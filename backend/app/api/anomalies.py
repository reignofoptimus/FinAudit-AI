from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.anomaly import AnomalyResult
from app.models.activity_log import ActivityLog
from app.schemas.finding import AnomalyOut
from app.services.auth_service import get_current_user
from app.services.anomaly_service import run_ml_anomaly_detection
from app.services.security_service import sanitize_text

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

class AnomalyReviewRequest(BaseModel):
    auditor_disposition: str  # 'legitimate', 'suspicious', 'confirmed_fraud'
    auditor_comments: Optional[str] = None

    @field_validator("auditor_comments", mode="before")
    @classmethod
    def sanitize_comments(cls, v):
        if v is not None:
            return sanitize_text(str(v), max_length=1000)
        return v

@router.post("/run")
def trigger_anomaly_detection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    res = run_ml_anomaly_detection(db, company_id)
    db.add(ActivityLog(
        user_id=current_user.id,
        action="RUN_ML_ANOMALY",
        entity_type="anomaly_result",
        details=f"ML Isolation Forest anomaly scan finished: {res.get('anomalies_detected')} outliers detected"
    ))
    db.commit()
    return res

@router.get("", response_model=List[AnomalyOut])
def list_anomalies(
    risk_level: Optional[str] = None,
    is_reviewed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    query = db.query(AnomalyResult).join(Transaction).filter(
        Transaction.company_id == company_id
    )

    if risk_level and risk_level != "all":
        query = query.filter(AnomalyResult.risk_level == risk_level)

    if is_reviewed is not None:
        query = query.filter(AnomalyResult.is_reviewed == is_reviewed)

    return query.order_by(AnomalyResult.anomaly_score.desc()).all()

@router.post("/{anomaly_id}/review", response_model=AnomalyOut)
def review_anomaly(
    anomaly_id: int,
    payload: AnomalyReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    # Prevent IDOR: Ensure anomaly belongs to current user's company (Vulnerability 2)
    anom = db.query(AnomalyResult).join(Transaction).filter(
        AnomalyResult.id == anomaly_id,
        Transaction.company_id == company_id
    ).first()
    if not anom:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    anom.is_reviewed = True
    anom.auditor_disposition = payload.auditor_disposition
    anom.auditor_comments = payload.auditor_comments

    db.add(ActivityLog(
        user_id=current_user.id,
        action="REVIEW_ANOMALY",
        entity_type="anomaly_result",
        entity_id=anom.id,
        details=f"Auditor marked anomaly #{anomaly_id} as '{payload.auditor_disposition}'"
    ))

    db.commit()
    db.refresh(anom)
    return anom
