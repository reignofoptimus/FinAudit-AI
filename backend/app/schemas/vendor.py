from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class VendorOut(BaseModel):
    id: int
    company_id: int
    name: str
    normalized_name: str
    tax_id: Optional[str] = None
    category: str
    contact_email: Optional[str] = None
    payment_terms: str
    risk_rating: str
    risk_score: float
    risk_reasons: Optional[str] = None
    total_spend: float
    transaction_count: int
    duplicate_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class VendorSpendMonth(BaseModel):
    month: str
    amount: float

class VendorDetailOut(VendorOut):
    monthly_trend: List[VendorSpendMonth] = []
