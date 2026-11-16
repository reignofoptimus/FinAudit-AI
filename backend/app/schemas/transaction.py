from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.services.security_service import sanitize_text

class TransactionOut(BaseModel):
    id: int
    company_id: int
    document_id: Optional[int] = None
    vendor_id: Optional[int] = None
    source_type: str
    transaction_type: str
    transaction_date: datetime
    amount: float
    tax_amount: Optional[float] = 0.0
    currency: str = "USD"
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    reference_no: Optional[str] = None
    description: Optional[str] = None
    account_code: Optional[str] = "6000"
    match_status: str
    is_duplicate: bool
    is_anomaly: bool
    has_missing_doc: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    source_type: str
    transaction_date: str
    amount: float = Field(..., gt=0.0, le=100_000_000.0)  # Enforce positive amount (Vulnerability 10)
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    reference_no: Optional[str] = None
    description: Optional[str] = None
    transaction_type: Optional[str] = "expense"
    account_code: Optional[str] = "6000"

    @field_validator("vendor_name", "invoice_number", "reference_no", "description", mode="before")
    @classmethod
    def sanitize_strings(cls, v):
        if v is not None:
            return sanitize_text(str(v), max_length=500)
        return v
