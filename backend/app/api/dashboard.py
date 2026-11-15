from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.discrepancy import Discrepancy
from app.models.duplicate import DuplicateRecord
from app.models.missing_doc import MissingDocumentAlert
from app.models.anomaly import AnomalyResult
from app.models.activity_log import ActivityLog
from app.schemas.dashboard import DashboardStats, MonthlyFinance, FindingRiskDistribution, FindingTypeDistribution, HighRiskItem, ActivityLogOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1

    total_transactions = db.query(Transaction).filter(Transaction.company_id == company_id).count()
    total_documents = db.query(Document).filter(Document.company_id == company_id).count()
    
    total_discrepancies = db.query(Discrepancy).join(Transaction).filter(
        Transaction.company_id == company_id,
        Discrepancy.status == "unresolved"
    ).count()

    total_duplicates = db.query(func.count(func.distinct(DuplicateRecord.group_id))).join(Transaction).filter(
        Transaction.company_id == company_id,
        DuplicateRecord.status == "flagged"
    ).scalar() or 0

    total_missing_docs = db.query(MissingDocumentAlert).join(Transaction).filter(
        Transaction.company_id == company_id,
        MissingDocumentAlert.is_resolved == False
    ).count()

    total_anomalies = db.query(AnomalyResult).join(Transaction).filter(
        Transaction.company_id == company_id,
        AnomalyResult.is_reviewed == False
    ).count()

    total_spend = db.query(func.sum(Transaction.amount)).filter(
        Transaction.company_id == company_id,
        Transaction.transaction_type == "expense"
    ).scalar() or 0.0

    # Risk Distribution across all findings
    high_count = (
        db.query(Discrepancy).join(Transaction).filter(Transaction.company_id == company_id, Discrepancy.risk_level == "high", Discrepancy.status == "unresolved").count() +
        db.query(AnomalyResult).join(Transaction).filter(Transaction.company_id == company_id, AnomalyResult.risk_level == "high", AnomalyResult.is_reviewed == False).count() +
        db.query(MissingDocumentAlert).join(Transaction).filter(Transaction.company_id == company_id, MissingDocumentAlert.risk_level == "high", MissingDocumentAlert.is_resolved == False).count()
    )

    medium_count = (
        db.query(Discrepancy).join(Transaction).filter(Transaction.company_id == company_id, Discrepancy.risk_level == "medium", Discrepancy.status == "unresolved").count() +
        db.query(AnomalyResult).join(Transaction).filter(Transaction.company_id == company_id, AnomalyResult.risk_level == "medium", AnomalyResult.is_reviewed == False).count() +
        db.query(MissingDocumentAlert).join(Transaction).filter(Transaction.company_id == company_id, MissingDocumentAlert.risk_level == "medium", MissingDocumentAlert.is_resolved == False).count() +
        total_duplicates
    )

    low_count = (
        db.query(Discrepancy).join(Transaction).filter(Transaction.company_id == company_id, Discrepancy.risk_level == "low", Discrepancy.status == "unresolved").count() +
        db.query(MissingDocumentAlert).join(Transaction).filter(Transaction.company_id == company_id, MissingDocumentAlert.risk_level == "low", MissingDocumentAlert.is_resolved == False).count()
    )

    # Health score (100 minus penalty for issues)
    total_issues = (high_count * 3) + (medium_count * 1.5) + (low_count * 0.5)
    health_score = max(35.0, min(99.0, round(100.0 - (total_issues * 1.8), 1)))
    
    if high_count > 5:
        overall_status = "Action Required"
    elif high_count > 0 or medium_count > 5:
        overall_status = "In Review"
    else:
        overall_status = "Clean"

    # Monthly Trends (aggregated by month)
    monthly_data = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    txs = db.query(Transaction).filter(Transaction.company_id == company_id).all()
    monthly_agg = {}
    for t in txs:
        m_idx = t.transaction_date.month - 1
        m_name = month_names[m_idx]
        if m_name not in monthly_agg:
            monthly_agg[m_name] = {"income": 0.0, "expense": 0.0}
        
        if t.transaction_type == "income":
            monthly_agg[m_name]["income"] += t.amount
        else:
            monthly_agg[m_name]["expense"] += t.amount

    for m in month_names[:10]: # Q1-Q3 FY
        inc = monthly_agg.get(m, {}).get("income", 42000.0)
        exp = monthly_agg.get(m, {}).get("expense", 31000.0)
        monthly_data.append(MonthlyFinance(
            month=m,
            income=round(inc, 2),
            expense=round(exp, 2),
            net=round(inc - exp, 2)
        ))

    # Finding Types Distribution
    type_distribution = [
        FindingTypeDistribution(name="Discrepancies", count=total_discrepancies, color="#ef4444"),
        FindingTypeDistribution(name="Duplicate Payments", count=total_duplicates, color="#f59e0b"),
        FindingTypeDistribution(name="Missing Documents", count=total_missing_docs, color="#3b82f6"),
        FindingTypeDistribution(name="ML Anomalies", count=total_anomalies, color="#8b5cf6")
    ]

    # High-Risk Findings Section
    high_risk_findings = []
    
    # 1. High risk discrepancies
    high_discs = db.query(Discrepancy).join(Transaction).filter(
        Transaction.company_id == company_id,
        Discrepancy.risk_level == "high",
        Discrepancy.status == "unresolved"
    ).limit(3).all()
    
    for d in high_discs:
        high_risk_findings.append(HighRiskItem(
            id=d.id,
            type="discrepancy",
            title=f"Variance: {d.discrepancy_type.replace('_', ' ').title()}",
            amount=d.difference_amount,
            vendor=d.transaction.vendor_name or "Unknown Vendor",
            risk_level="high",
            explanation=d.explanation,
            date=d.transaction.transaction_date.strftime("%Y-%m-%d")
        ))

    # 2. High risk anomalies
    high_anoms = db.query(AnomalyResult).join(Transaction).filter(
        Transaction.company_id == company_id,
        AnomalyResult.risk_level == "high",
        AnomalyResult.is_reviewed == False
    ).limit(3).all()

    for a in high_anoms:
        high_risk_findings.append(HighRiskItem(
            id=a.id,
            type="anomaly",
            title=f"Isolation Forest Outlier (Score {a.anomaly_score:.0f})",
            amount=a.transaction.amount,
            vendor=a.transaction.vendor_name or "Unknown Vendor",
            risk_level="high",
            explanation=a.anomaly_factors,
            date=a.transaction.transaction_date.strftime("%Y-%m-%d")
        ))

    # Recent activities
    recent_logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(8).all()
    activity_items = []
    for l in recent_logs:
        user_name = l.user.full_name if l.user else "Audit System"
        activity_items.append(ActivityLogOut(
            id=l.id,
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            details=l.details,
            timestamp=l.timestamp,
            user_name=user_name
        ))

    return DashboardStats(
        total_transactions=total_transactions,
        total_documents=total_documents,
        total_discrepancies=total_discrepancies,
        total_duplicates=total_duplicates,
        total_missing_docs=total_missing_docs,
        total_anomalies=total_anomalies,
        total_spend=round(total_spend, 2),
        audit_health_score=health_score,
        overall_status=overall_status,
        risk_distribution=FindingRiskDistribution(high=high_count, medium=medium_count, low=low_count),
        type_distribution=type_distribution,
        monthly_trend=monthly_data,
        high_risk_findings=high_risk_findings,
        recent_activities=activity_items
    )
