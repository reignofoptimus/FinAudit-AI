from typing import Optional
from datetime import datetime
from pydantic import BaseModel

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
    amount: float
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    reference_no: Optional[str] = None
    description: Optional[str] = None
    transaction_type: Optional[str] = "expense"
    account_code: Optional[str] = "6000"
