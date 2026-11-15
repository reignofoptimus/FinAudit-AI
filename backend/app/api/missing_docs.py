from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.document import Document
from app.models.missing_doc import MissingDocumentAlert
from app.models.activity_log import ActivityLog
from app.schemas.finding import MissingDocOut, FindingResolveRequest
from app.services.auth_service import get_current_user
from app.services.missing_doc_service import run_missing_document_scan

router = APIRouter(prefix="/missing-docs", tags=["Missing Documents"])

class AttachDocumentRequest(BaseModel):
    document_id: int
    notes: Optional[str] = "Attached supporting evidence"

@router.post("/run")
def trigger_missing_doc_scan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    res = run_missing_document_scan(db, company_id)
    db.add(ActivityLog(
        user_id=current_user.id,
        action="RUN_MISSING_DOC_SCAN",
        entity_type="missing_document_alert",
        details=f"Missing document scan finished: {res.get('missing_documents_detected')} alerts"
    ))
    db.commit()
    return res

@router.get("", response_model=List[MissingDocOut])
def list_missing_documents(
    risk_level: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    query = db.query(MissingDocumentAlert).join(Transaction).filter(
        Transaction.company_id == company_id
    )

    if risk_level and risk_level != "all":
        query = query.filter(MissingDocumentAlert.risk_level == risk_level)

    if is_resolved is not None:
        query = query.filter(MissingDocumentAlert.is_resolved == is_resolved)

    return query.order_by(MissingDocumentAlert.created_at.desc()).all()

@router.post("/{alert_id}/attach", response_model=MissingDocOut)
def attach_document_to_alert(
    alert_id: int,
    payload: AttachDocumentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(MissingDocumentAlert).filter(MissingDocumentAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    doc = db.query(Document).filter(Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    alert.attached_document_id = doc.id
    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.notes = payload.notes
    
    # Also attach to transaction
    if alert.transaction:
        alert.transaction.document_id = doc.id
        alert.transaction.has_missing_doc = False

    db.add(ActivityLog(
        user_id=current_user.id,
        action="ATTACH_DOCUMENT",
        entity_type="missing_document_alert",
        entity_id=alert.id,
        details=f"Auditor attached document '{doc.filename}' to resolve missing doc alert #{alert.id}"
    ))

    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{alert_id}/resolve", response_model=MissingDocOut)
def resolve_missing_doc_alert(
    alert_id: int,
    payload: FindingResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(MissingDocumentAlert).filter(MissingDocumentAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.notes = payload.resolution_notes

    if alert.transaction:
        alert.transaction.has_missing_doc = False

    db.add(ActivityLog(
        user_id=current_user.id,
        action="RESOLVE_MISSING_DOC",
        entity_type="missing_document_alert",
        entity_id=alert.id,
        details=f"Auditor marked missing doc alert #{alert.id} as resolved"
    ))

    db.commit()
    db.refresh(alert)
    return alert
