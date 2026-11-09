import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.document import Document
from app.models.extracted_record import ExtractedRecord
from app.models.transaction import Transaction
from app.models.activity_log import ActivityLog
from app.schemas.document import DocumentOut, ExtractedRecordOut, ExtractedRecordUpdate
from app.services.auth_service import get_current_user
from app.services.extractor_service import process_uploaded_document
from app.services.matching_service import run_automated_matching
from app.services.duplicate_service import run_duplicate_detection
from app.services.discrepancy_service import run_discrepancy_analysis
from app.services.missing_doc_service import run_missing_document_scan
from app.services.anomaly_service import run_ml_anomaly_detection

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

@router.post("/upload", response_model=List[DocumentOut])
async def upload_documents(
    files: List[UploadFile] = File(...),
    category: str = Form("invoice"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    uploaded_docs = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' has unsupported extension. Allowed: PDF, CSV, XLSX, XLS"
            )

        # Save to disk
        safe_name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename.replace(' ', '_')}"
        save_path = os.path.join(settings.UPLOAD_DIR, safe_name)

        content = await file.read()
        file_size = len(content)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' exceeds 25MB limit")

        with open(save_path, "wb") as f:
            f.write(content)

        # Create Document record
        doc = Document(
            company_id=company_id,
            filename=file.filename,
            file_path=save_path,
            file_type=ext.replace(".", ""),
            category=category,
            file_size_bytes=file_size,
            processing_status="processing"
        )
        db.add(doc)
        db.flush()

        # Execute OCR / Extraction Pipeline
        try:
            records_data = process_uploaded_document(save_path, file.filename, category)
            confidence = 0.95
            
            for r in records_data:
                confidence = min(confidence, r.get("confidence_score", 0.92))
                rec = ExtractedRecord(
                    document_id=doc.id,
                    document_type=r.get("document_type", category),
                    invoice_number=r.get("invoice_number"),
                    transaction_ref=r.get("transaction_ref"),
                    vendor_name=r.get("vendor_name"),
                    transaction_date=r.get("transaction_date"),
                    due_date=r.get("due_date"),
                    total_amount=r.get("total_amount", 0.0),
                    tax_amount=r.get("tax_amount", 0.0),
                    subtotal_amount=r.get("subtotal_amount", 0.0),
                    currency=r.get("currency", "USD"),
                    payment_status=r.get("payment_status", "paid"),
                    payment_method=r.get("payment_method"),
                    account_details=r.get("account_details"),
                    description=r.get("description"),
                    confidence_score=r.get("confidence_score", 0.92),
                    is_verified=False
                )
                db.add(rec)
                
                # Automatically create preliminary transaction record
                tx = Transaction(
                    company_id=company_id,
                    document_id=doc.id,
                    source_type=category,
                    transaction_type="expense",
                    transaction_date=r.get("transaction_date") or datetime.utcnow(),
                    amount=r.get("total_amount", 0.0),
                    tax_amount=r.get("tax_amount", 0.0),
                    vendor_name=r.get("vendor_name"),
                    invoice_number=r.get("invoice_number"),
                    reference_no=r.get("transaction_ref"),
                    description=r.get("description"),
                    match_status="unmatched"
                )
                db.add(tx)

            doc.processing_status = "completed"
            doc.extracted_records_count = len(records_data)
            doc.confidence_score = confidence

            # Log activity
            db.add(ActivityLog(
                user_id=current_user.id,
                action="DOCUMENT_UPLOAD",
                entity_type="document",
                entity_id=doc.id,
                details=f"Uploaded and processed {file.filename} ({len(records_data)} records extracted)"
            ))

        except Exception as e:
            doc.processing_status = "error"
            doc.error_message = str(e)

        db.commit()
        db.refresh(doc)
        uploaded_docs.append(doc)

    # Trigger audit pipeline updates asynchronously/in-line
    try:
        run_automated_matching(db, company_id)
        run_duplicate_detection(db, company_id)
        run_discrepancy_analysis(db, company_id)
        run_missing_document_scan(db, company_id)
        run_ml_anomaly_detection(db, company_id)
    except Exception:
        pass

    return uploaded_docs

@router.get("", response_model=List[DocumentOut])
def list_documents(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    query = db.query(Document).filter(Document.company_id == company_id)
    if category and category != "all":
        query = query.filter(Document.category == category)
    return query.order_by(Document.upload_date.desc()).all()

@router.get("/{document_id}/records", response_model=List[ExtractedRecordOut])
def get_extracted_records(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id or 1
    doc = db.query(Document).filter(Document.id == document_id, Document.company_id == company_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return db.query(ExtractedRecord).filter(ExtractedRecord.document_id == document_id).all()

@router.patch("/records/{record_id}", response_model=ExtractedRecordOut)
def update_extracted_record(
    record_id: int,
    payload: ExtractedRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(ExtractedRecord).filter(ExtractedRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Extracted record not found")

    if payload.invoice_number is not None:
        rec.invoice_number = payload.invoice_number
    if payload.vendor_name is not None:
        rec.vendor_name = payload.vendor_name
    if payload.total_amount is not None:
        rec.total_amount = payload.total_amount
    if payload.tax_amount is not None:
        rec.tax_amount = payload.tax_amount
    if payload.payment_status is not None:
        rec.payment_status = payload.payment_status
    if payload.is_verified is not None:
        rec.is_verified = payload.is_verified
    if payload.verification_notes is not None:
        rec.verification_notes = payload.verification_notes

    # Keep corresponding transaction synced if exists
    tx = db.query(Transaction).filter(
        Transaction.document_id == rec.document_id,
        Transaction.reference_no == rec.transaction_ref
    ).first()
    if tx:
        if payload.total_amount is not None:
            tx.amount = payload.total_amount
        if payload.vendor_name is not None:
            tx.vendor_name = payload.vendor_name
        if payload.invoice_number is not None:
            tx.invoice_number = payload.invoice_number

    db.add(ActivityLog(
        user_id=current_user.id,
        action="RECORD_EDIT",
        entity_type="extracted_record",
        entity_id=rec.id,
        details=f"Auditor verified/updated extracted record #{rec.id}"
    ))

    db.commit()
    db.refresh(rec)
    return rec
