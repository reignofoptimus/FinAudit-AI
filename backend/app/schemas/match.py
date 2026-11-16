from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.schemas.transaction import TransactionOut
from app.services.security_service import sanitize_text

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

    @field_validator("auditor_notes", mode="before")
    @classmethod
    def sanitize_notes(cls, v):
        if v is not None:
            return sanitize_text(str(v), max_length=1000)
        return v

class ManualMatchRequest(BaseModel):
    primary_transaction_id: int
    matched_transaction_id: int
    match_type: Optional[str] = "manual"
    auditor_notes: Optional[str] = None

    @field_validator("auditor_notes", mode="before")
    @classmethod
    def sanitize_notes(cls, v):
        if v is not None:
            return sanitize_text(str(v), max_length=1000)
        return v
