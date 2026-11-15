from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.transaction import TransactionOut

class MatchOut(BaseModel):
    id: int
    primary_transaction_id: int
    matched_transaction_id: int
    match_type: str
    confidence_score: float
    status: str
    amount_difference: float
    date_difference_days: int
    match_reasons: Optional[str] = None
    auditor_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    primary_transaction: Optional[TransactionOut] = None
    matched_transaction: Optional[TransactionOut] = None

    class Config:
        from_attributes = True

class MatchReviewRequest(BaseModel):
    status: str  # 'confirmed' or 'rejected'
    auditor_notes: Optional[str] = None

class ManualMatchRequest(BaseModel):
    primary_transaction_id: int
    matched_transaction_id: int
    match_type: Optional[str] = "manual"
    auditor_notes: Optional[str] = None
