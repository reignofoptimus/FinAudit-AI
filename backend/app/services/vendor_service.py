from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.vendor import Vendor
from app.models.transaction import Transaction
from app.models.duplicate import DuplicateRecord
from app.models.discrepancy import Discrepancy

def update_vendor_analytics(db: Session, company_id: int) -> None:
    """
    Computes aggregates for all vendors and derives risk scores.
    """
    vendors = db.query(Vendor).filter(Vendor.company_id == company_id).all()
    
    for v in vendors:
        txs = db.query(Transaction).filter(
            Transaction.company_id == company_id,
            func.lower(Transaction.vendor_name) == v.name.lower()
        ).all()

        total_spend = sum(t.amount for t in txs)
        tx_count = len(txs)
        
        # Check duplicate records associated with this vendor
        dup_count = db.query(DuplicateRecord).join(Transaction).filter(
            Transaction.company_id == company_id,
            func.lower(Transaction.vendor_name) == v.name.lower()
        ).count()

        # Check discrepancies
        disc_count = db.query(Discrepancy).join(Transaction).filter(
            Transaction.company_id == company_id,
            func.lower(Transaction.vendor_name) == v.name.lower()
        ).count()

        # Check anomalies
        anomaly_count = sum(1 for t in txs if t.is_anomaly)

        # Explainable Risk Calculation (0 - 100)
        risk_score = 10.0
        reasons = []

        if dup_count > 0:
            risk_score += min(35.0, dup_count * 15.0)
            reasons.append(f"{dup_count} duplicate payment incident(s) flagged")
            
        if disc_count > 0:
            risk_score += min(25.0, disc_count * 10.0)
            reasons.append(f"{disc_count} billing or ledger discrepancy event(s)")

        if anomaly_count > 0:
            risk_score += min(25.0, anomaly_count * 12.0)
            reasons.append(f"{anomaly_count} high-variance outlier transaction(s)")

        if total_spend > 50000.0:
            risk_score += 10.0
            reasons.append("High-volume material vendor (total spend > $50,000)")

        risk_score = min(98.0, risk_score)
        
        if risk_score >= 60.0:
            rating = "high"
        elif risk_score >= 35.0:
            rating = "medium"
        else:
            rating = "low"
            if not reasons:
                reasons.append("Clean audit history with consistent billing patterns")

        v.total_spend = round(total_spend, 2)
        v.transaction_count = tx_count
        v.duplicate_count = dup_count
        v.risk_score = round(risk_score, 1)
        v.risk_rating = rating
        v.risk_reasons = " • ".join(reasons)

    db.commit()

def get_vendor_summary(db: Session, company_id: int) -> List[Dict[str, Any]]:
    update_vendor_analytics(db, company_id)
    vendors = db.query(Vendor).filter(Vendor.company_id == company_id).order_by(Vendor.total_spend.desc()).all()
    
    result = []
    for v in vendors:
        result.append({
            "id": v.id,
            "company_id": v.company_id,
            "name": v.name,
            "normalized_name": v.normalized_name,
            "category": v.category,
            "payment_terms": v.payment_terms,
            "total_spend": v.total_spend,
            "transaction_count": v.transaction_count,
            "duplicate_count": v.duplicate_count,
            "risk_rating": v.risk_rating,
            "risk_score": v.risk_score,
            "risk_reasons": v.risk_reasons,
            "created_at": v.created_at
        })
    return result
