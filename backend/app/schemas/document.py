from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ExtractedRecordOut(BaseModel):
    id: int
    document_id: int
    document_type: str
    invoice_number: Optional[str] = None
    transaction_ref: Optional[str] = None
    vendor_name: Optional[str] = None
    transaction_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    total_amount: float
    tax_amount: Optional[float] = 0.0
    subtotal_amount: Optional[float] = 0.0
    currency: str = "USD"
    payment_status: Optional[str] = "paid"
    payment_method: Optional[str] = None
    account_details: Optional[str] = None
    description: Optional[str] = None
    confidence_score: float
    is_verified: bool
    verification_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ExtractedRecordUpdate(BaseModel):
    invoice_number: Optional[str] = None
    vendor_name: Optional[str] = None
    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    transaction_date: Optional[str] = None  # ISO format string
    payment_status: Optional[str] = None
    is_verified: Optional[bool] = None
    verification_notes: Optional[str] = None

class DocumentOut(BaseModel):
    id: int
    company_id: int
    filename: str
    file_type: str
    category: str
    file_size_bytes: int
    upload_date: datetime
    processing_status: str
    error_message: Optional[str] = None
    extracted_records_count: int
    confidence_score: float
    extracted_records: Optional[List[ExtractedRecordOut]] = None

    class Config:
        from_attributes = True
