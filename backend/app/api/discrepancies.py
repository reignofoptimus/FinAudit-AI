from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.discrepancy import Discrepancy
from app.models.activity_log import ActivityLog
from app.schemas.finding import DiscrepancyOut, FindingResolveRequest
from app.services.auth_service import get_current_user
from app.services.discrepancy_service import run_discrepancy_analysis

router = APIRouter(prefix="/discrepancies", tags=["Discrepancies"])

@router.post("/run")
def trigger_discrepancy_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    res = run_discrepancy_analysis(db, company_id)
    db.add(ActivityLog(
        user_id=current_user.id,
        action="RUN_DISCREPANCY_ANALYSIS",
        entity_type="discrepancy",
        details=f"Discrepancy scan finished: {res.get('discrepancies_identified')} variances identified"
    ))
    db.commit()
    return res

@router.get("", response_model=List[DiscrepancyOut])
def list_discrepancies(
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    query = db.query(Discrepancy).join(Transaction).filter(
        Transaction.company_id == company_id
    )

    if risk_level and risk_level != "all":
        query = query.filter(Discrepancy.risk_level == risk_level)

    if status and status != "all":
        query = query.filter(Discrepancy.status == status)

    return query.order_by(Discrepancy.difference_amount.desc()).all()

@router.post("/{discrepancy_id}/resolve", response_model=DiscrepancyOut)
def resolve_discrepancy(
    discrepancy_id: int,
    payload: FindingResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    disc = db.query(Discrepancy).filter(Discrepancy.id == discrepancy_id).first()
    if not disc:
        raise HTTPException(status_code=404, detail="Discrepancy not found")

    new_status = "dismissed" if payload.action == "dismiss" else "resolved"
    disc.status = new_status
    disc.resolution_notes = payload.resolution_notes

    db.add(ActivityLog(
        user_id=current_user.id,
        action="RESOLVE_DISCREPANCY",
        entity_type="discrepancy",
        entity_id=disc.id,
        details=f"Auditor marked discrepancy #{discrepancy_id} as {new_status}"
    ))

    db.commit()
    db.refresh(disc)
    return disc
