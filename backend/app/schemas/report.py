from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ReportGenerateRequest(BaseModel):
    title: Optional[str] = "Comprehensive Financial Audit Report"
    audit_period: Optional[str] = "FY2024 (Full Year)"
    auditor_comments: Optional[str] = None
    include_discrepancies: bool = True
    include_duplicates: bool = True
    include_anomalies: bool = True
    include_missing_docs: bool = True
    risk_filter: Optional[str] = "all"  # 'all', 'high', 'medium', 'low'

class ReportOut(BaseModel):
    id: int
    company_id: int
    title: str
    audit_period: str
    total_transactions: int
    documents_processed: int
    discrepancies_count: int
    duplicates_count: int
    missing_docs_count: int
    anomalies_count: int
    high_risk_count: int
    pdf_file_path: Optional[str] = None
    file_size_bytes: int
    executive_summary: Optional[str] = None
    auditor_comments: Optional[str] = None
    review_status: str
    generated_by: str
    created_at: datetime

    class Config:
        from_attributes = True
