from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.transaction import TransactionOut

class DiscrepancyOut(BaseModel):
    id: int
    transaction_id: int
    related_document_id: Optional[int] = None
    discrepancy_type: str
    expected_value: str
    actual_value: str
    difference_amount: float
    risk_level: str
    explanation: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    transaction: Optional[TransactionOut] = None

    class Config:
        from_attributes = True

class DuplicateRecordOut(BaseModel):
    id: int
    group_id: str
    transaction_id: int
    duplicate_type: str
    confidence_score: float
    flag_reason: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    transaction: Optional[TransactionOut] = None

    class Config:
        from_attributes = True

class DuplicateGroupOut(BaseModel):
    group_id: str
    duplicate_type: str
    confidence_score: float
    flag_reason: str
    status: str
    records: List[DuplicateRecordOut]

class AnomalyOut(BaseModel):
    id: int
    transaction_id: int
    anomaly_score: float
    raw_isolation_score: Optional[float] = None
    risk_level: str
    anomaly_factors: str
    model_name: str
    is_reviewed: bool
    auditor_disposition: Optional[str] = None
    auditor_comments: Optional[str] = None
    created_at: datetime
    transaction: Optional[TransactionOut] = None

    class Config:
        from_attributes = True

class MissingDocOut(BaseModel):
    id: int
    transaction_id: int
    missing_document_type: str
    explanation: str
    risk_level: str
    is_resolved: bool
    attached_document_id: Optional[int] = None
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    transaction: Optional[TransactionOut] = None

    class Config:
        from_attributes = True

class FindingResolveRequest(BaseModel):
    resolution_notes: str
    action: Optional[str] = "resolve"  # 'resolve', 'dismiss', 'investigate'
