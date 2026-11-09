from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionOut])
def list_transactions(
    source_type: Optional[str] = None,
    match_status: Optional[str] = None,
    search: Optional[str] = None,
    risk_only: Optional[bool] = False,
    sort_by: Optional[str] = "date_desc",
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    query = db.query(Transaction).filter(Transaction.company_id == company_id)

    if source_type and source_type != "all":
        query = query.filter(Transaction.source_type == source_type)

    if match_status and match_status != "all":
        query = query.filter(Transaction.match_status == match_status)

    if risk_only:
        query = query.filter(
            or_(
                Transaction.is_duplicate == True,
                Transaction.is_anomaly == True,
                Transaction.has_missing_doc == True,
                Transaction.match_status == "discrepancy"
            )
        )

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.vendor_name.ilike(search_filter),
                Transaction.invoice_number.ilike(search_filter),
                Transaction.reference_no.ilike(search_filter),
                Transaction.description.ilike(search_filter)
            )
        )

    # Sorting
    if sort_by == "date_asc":
        query = query.order_by(asc(Transaction.transaction_date))
    elif sort_by == "amount_desc":
        query = query.order_by(desc(Transaction.amount))
    elif sort_by == "amount_asc":
        query = query.order_by(asc(Transaction.amount))
    else:
        query = query.order_by(desc(Transaction.transaction_date))

    return query.offset(skip).limit(limit).all()

@router.get("/{tx_id}", response_model=TransactionOut)
def get_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.company_id == company_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx
