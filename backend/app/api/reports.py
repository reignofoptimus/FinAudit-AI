import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.discrepancy import Discrepancy
from app.models.duplicate import DuplicateRecord
from app.models.missing_doc import MissingDocumentAlert
from app.models.anomaly import AnomalyResult
from app.models.audit_report import AuditReport
from app.models.activity_log import ActivityLog
from app.schemas.report import ReportGenerateRequest, ReportOut
from app.services.auth_service import get_current_user
from app.services.report_service import generate_pdf_report
from app.services.llm_service import generate_audit_executive_summary

router = APIRouter(prefix="/reports", tags=["Audit Reports"])

@router.post("/generate", response_model=ReportOut)
def create_audit_report(
    payload: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    company_name = current_user.company.name if current_user.company else "Acme Global Enterprise"

    # Aggregates
    total_tx = db.query(Transaction).filter(Transaction.company_id == company_id).count()
    total_docs = db.query(Document).filter(Document.company_id == company_id).count()
    total_spend = db.query(func.sum(Transaction.amount)).filter(Transaction.company_id == company_id).scalar() or 0.0

    discs = db.query(Discrepancy).join(Transaction).filter(
        Transaction.company_id == company_id,
        Discrepancy.status == "unresolved"
    )
    if payload.risk_filter and payload.risk_filter != "all":
        discs = discs.filter(Discrepancy.risk_level == payload.risk_filter)
    discrepancies_list = discs.all()

    dups = db.query(DuplicateRecord).join(Transaction).filter(
        Transaction.company_id == company_id,
        DuplicateRecord.status == "flagged"
    ).all()

    anoms = db.query(AnomalyResult).join(Transaction).filter(
        Transaction.company_id == company_id,
        AnomalyResult.is_reviewed == False
    )
    if payload.risk_filter and payload.risk_filter != "all":
        anoms = anoms.filter(AnomalyResult.risk_level == payload.risk_filter)
    anomalies_list = anoms.all()

    missing = db.query(MissingDocumentAlert).join(Transaction).filter(
        Transaction.company_id == company_id,
        MissingDocumentAlert.is_resolved == False
    ).all()

    high_risk_count = (
        sum(1 for d in discrepancies_list if d.risk_level == "high") +
        sum(1 for a in anomalies_list if a.risk_level == "high")
    )

    stats = {
        "total_transactions": total_tx,
        "total_documents": total_docs,
        "total_spend": total_spend,
        "total_discrepancies": len(discrepancies_list),
        "total_duplicates": len(dups) // 2 if len(dups) >= 2 else len(dups),
        "total_missing_docs": len(missing),
        "total_anomalies": len(anomalies_list),
        "high_risk_count": high_risk_count,
        "audit_health_score": max(40.0, min(98.0, 100.0 - (high_risk_count * 4.5 + len(discrepancies_list) * 2.0)))
    }

    # Format data for PDF generator
    disc_data = [{
        "transaction_id": d.transaction_id,
        "discrepancy_type": d.discrepancy_type,
        "expected_value": d.expected_value,
        "actual_value": d.actual_value,
        "difference_amount": d.difference_amount,
        "risk_level": d.risk_level
    } for d in discrepancies_list]

    anom_data = [{
        "transaction_id": a.transaction_id,
        "anomaly_score": a.anomaly_score,
        "anomaly_factors": a.anomaly_factors,
        "risk_level": a.risk_level,
        "transaction": {"vendor_name": a.transaction.vendor_name, "amount": a.transaction.amount}
    } for a in anomalies_list]

    # Create Report row
    report_record = AuditReport(
        company_id=company_id,
        title=payload.title or "Comprehensive Financial Audit Report",
        audit_period=payload.audit_period or "FY2024",
        total_transactions=total_tx,
        documents_processed=total_docs,
        discrepancies_count=len(discrepancies_list),
        duplicates_count=len(dups) // 2 if len(dups) >= 2 else len(dups),
        missing_docs_count=len(missing),
        anomalies_count=len(anomalies_list),
        high_risk_count=high_risk_count,
        auditor_comments=payload.auditor_comments,
        review_status="draft",
        generated_by=current_user.full_name
    )
    db.add(report_record)
    db.flush()

    # Generate PDF via ReportLab
    pdf_path = generate_pdf_report(
        report_id=report_record.id,
        company_name=company_name,
        audit_period=payload.audit_period or "FY2024",
        stats=stats,
        discrepancies=disc_data,
        duplicates=[],
        anomalies=anom_data,
        missing_docs=[],
        auditor_comments=payload.auditor_comments
    )

    report_record.pdf_file_path = pdf_path
    if os.path.exists(pdf_path):
        report_record.file_size_bytes = os.path.getsize(pdf_path)

    report_record.executive_summary = generate_audit_executive_summary(stats)

    db.add(ActivityLog(
        user_id=current_user.id,
        action="GENERATE_REPORT",
        entity_type="audit_report",
        entity_id=report_record.id,
        details=f"Generated audit report PDF '{report_record.title}'"
    ))

    db.commit()
    db.refresh(report_record)
    return report_record

@router.get("", response_model=List[ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    return db.query(AuditReport).filter(AuditReport.company_id == company_id).order_by(AuditReport.created_at.desc()).all()

@router.get("/{report_id}/download")
def download_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    rep = db.query(AuditReport).filter(AuditReport.id == report_id, AuditReport.company_id == company_id).first()
    if not rep or not rep.pdf_file_path or not os.path.exists(rep.pdf_file_path):
        raise HTTPException(status_code=404, detail="PDF report file not found on disk")

    filename = os.path.basename(rep.pdf_file_path)
    return FileResponse(
        path=rep.pdf_file_path,
        media_type="application/pdf",
        filename=filename
    )
