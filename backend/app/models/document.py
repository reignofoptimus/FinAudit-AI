from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # 'pdf', 'csv', 'xlsx', 'xls', 'image'
    category = Column(String(50), default="invoice")  # 'invoice', 'bank_statement', 'receipt', 'general_ledger', 'purchase_order'
    file_size_bytes = Column(Integer, default=0)
    upload_date = Column(DateTime, default=datetime.utcnow)
    processing_status = Column(String(50), default="pending")  # 'pending', 'processing', 'completed', 'error'
    error_message = Column(Text, nullable=True)
    extracted_records_count = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.95)

    # Relationships
    company = relationship("Company", back_populates="documents")
    extracted_records = relationship("ExtractedRecord", back_populates="document", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="document")
