from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.vendor import Vendor
from app.models.transaction import Transaction
from app.schemas.vendor import VendorOut, VendorDetailOut, VendorSpendMonth
from app.services.auth_service import get_current_user
from app.services.vendor_service import get_vendor_summary, update_vendor_analytics

router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.get("", response_model=List[VendorOut])
def list_vendors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    return get_vendor_summary(db, company_id)

@router.get("/{vendor_id}", response_model=VendorDetailOut)
def get_vendor_detail(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    v = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.company_id == company_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Monthly spend aggregation
    txs = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        func.lower(Transaction.vendor_name) == v.name.lower()
    ).all()

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_dict = {m: 0.0 for m in month_names[:10]}
    for t in txs:
        m_idx = t.transaction_date.month - 1
        if m_idx < len(month_names):
            m_name = month_names[m_idx]
            monthly_dict[m_name] = round(monthly_dict.get(m_name, 0.0) + t.amount, 2)

    monthly_trend = [VendorSpendMonth(month=m, amount=amt) for m, amt in monthly_dict.items()]

    detail = VendorDetailOut(
        id=v.id,
        company_id=v.company_id,
        name=v.name,
        normalized_name=v.normalized_name,
        tax_id=v.tax_id,
        category=v.category,
        contact_email=v.contact_email,
        payment_terms=v.payment_terms,
        risk_rating=v.risk_rating,
        risk_score=v.risk_score,
        risk_reasons=v.risk_reasons,
        total_spend=v.total_spend,
        transaction_count=v.transaction_count,
        duplicate_count=v.duplicate_count,
        created_at=v.created_at,
        monthly_trend=monthly_trend
    )
    return detail
