from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class MonthlyFinance(BaseModel):
    month: str
    income: float
    expense: float
    net: float

class FindingRiskDistribution(BaseModel):
    high: int
    medium: int
    low: int

class FindingTypeDistribution(BaseModel):
    name: str
    count: int
    color: str

class HighRiskItem(BaseModel):
    id: int
    type: str  # 'discrepancy', 'duplicate', 'anomaly', 'missing_doc'
    title: str
    amount: float
    vendor: str
    risk_level: str
    explanation: str
    date: str

class ActivityLogOut(BaseModel):
    id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None
    timestamp: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_transactions: int
    total_documents: int
    total_discrepancies: int
    total_duplicates: int
    total_missing_docs: int
    total_anomalies: int
    total_spend: float
    audit_health_score: float  # e.g., 82% clean
    overall_status: str  # 'Action Required', 'In Review', 'Clean'
    
    risk_distribution: FindingRiskDistribution
    type_distribution: List[FindingTypeDistribution]
    monthly_trend: List[MonthlyFinance]
    high_risk_findings: List[HighRiskItem]
    recent_activities: List[ActivityLogOut]
