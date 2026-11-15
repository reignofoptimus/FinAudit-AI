from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.match import TransactionMatch
from app.models.activity_log import ActivityLog
from app.schemas.match import MatchOut, MatchReviewRequest, ManualMatchRequest
from app.services.auth_service import get_current_user
from app.services.matching_service import run_automated_matching

router = APIRouter(prefix="/matching", tags=["Matching"])

@router.post("/run")
def trigger_matching(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    res = run_automated_matching(db, company_id)
    db.add(ActivityLog(
        user_id=current_user.id,
        action="RUN_MATCHING",
        entity_type="transaction_match",
        details=f"Automated matching executed: {res.get('matches_generated')} matches found"
    ))
    db.commit()
    return res

@router.get("/matches", response_model=List[MatchOut])
def get_matches(
    status: Optional[str] = None,
    match_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    query = db.query(TransactionMatch).join(
        Transaction, TransactionMatch.primary_transaction_id == Transaction.id
    ).filter(Transaction.company_id == company_id)

    if status and status != "all":
        query = query.filter(TransactionMatch.status == status)

    if match_type and match_type != "all":
        query = query.filter(TransactionMatch.match_type == match_type)

    return query.order_by(TransactionMatch.confidence_score.desc()).all()

@router.post("/{match_id}/review", response_model=MatchOut)
def review_match(
    match_id: int,
    payload: MatchReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match_obj = db.query(TransactionMatch).filter(TransactionMatch.id == match_id).first()
    if not match_obj:
        raise HTTPException(status_code=404, detail="Match not found")

    if payload.status not in ["confirmed", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'confirmed' or 'rejected'")

    match_obj.status = payload.status
    if payload.auditor_notes:
        match_obj.auditor_notes = payload.auditor_notes

    # Update transactions match status
    p_tx = match_obj.primary_transaction
    m_tx = match_obj.matched_transaction

    if payload.status == "confirmed":
        p_tx.match_status = "matched"
        m_tx.match_status = "matched"
    else:
        p_tx.match_status = "unmatched"
        m_tx.match_status = "unmatched"

    db.add(ActivityLog(
        user_id=current_user.id,
        action="MATCH_REVIEW",
        entity_type="transaction_match",
        entity_id=match_obj.id,
        details=f"Auditor marked match #{match_id} as {payload.status.upper()}"
    ))

    db.commit()
    db.refresh(match_obj)
    return match_obj

@router.post("/manual", response_model=MatchOut)
def create_manual_match(
    payload: ManualMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    t1 = db.query(Transaction).filter(Transaction.id == payload.primary_transaction_id, Transaction.company_id == company_id).first()
    t2 = db.query(Transaction).filter(Transaction.id == payload.matched_transaction_id, Transaction.company_id == company_id).first()
    
    if not t1 or not t2:
        raise HTTPException(status_code=404, detail="One or both transactions not found")

    amt_diff = round(abs(t1.amount - t2.amount), 2)
    days_diff = abs((t1.transaction_date - t2.transaction_date).days)

    match_obj = TransactionMatch(
        primary_transaction_id=t1.id,
        matched_transaction_id=t2.id,
        match_type=payload.match_type or "manual",
        confidence_score=1.0,
        status="confirmed",
        amount_difference=amt_diff,
        date_difference_days=days_diff,
        match_reasons="Manual match confirmed by auditor",
        auditor_notes=payload.auditor_notes
    )
    db.add(match_obj)
    t1.match_status = "matched"
    t2.match_status = "matched"

    db.add(ActivityLog(
        user_id=current_user.id,
        action="MANUAL_MATCH",
        entity_type="transaction_match",
        details=f"Auditor manually paired #{t1.id} and #{t2.id}"
    ))

    db.commit()
    db.refresh(match_obj)
    return match_obj
