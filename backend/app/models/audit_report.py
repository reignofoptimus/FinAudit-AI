from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class AuditReport(Base):
    __tablename__ = "audit_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    audit_period = Column(String(100), default="Q1 - Q4 FY2024")
    
    total_transactions = Column(Integer, default=0)
    documents_processed = Column(Integer, default=0)
    discrepancies_count = Column(Integer, default=0)
    duplicates_count = Column(Integer, default=0)
    missing_docs_count = Column(Integer, default=0)
    anomalies_count = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)
    
    pdf_file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    
    executive_summary = Column(Text, nullable=True)
    auditor_comments = Column(Text, nullable=True)
    review_status = Column(String(50), default="draft")  # 'draft', 'auditor_approved', 'final'
    generated_by = Column(String(255), default="System Auditor")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="audit_reports")
