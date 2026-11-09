from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ExtractedRecord(Base):
    __tablename__ = "extracted_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    document_type = Column(String(50), default="invoice")
    invoice_number = Column(String(100), nullable=True, index=True)
    transaction_ref = Column(String(100), nullable=True, index=True)
    vendor_name = Column(String(255), nullable=True, index=True)
    transaction_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    
    total_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=True, default=0.0)
    subtotal_amount = Column(Float, nullable=True, default=0.0)
    currency = Column(String(10), default="USD")
    
    payment_status = Column(String(50), default="paid")  # 'paid', 'pending', 'overdue'
    payment_method = Column(String(50), nullable=True)  # 'ACH', 'Wire', 'Credit Card', 'Check'
    account_details = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    confidence_score = Column(Float, default=0.92)
    is_verified = Column(Boolean, default=False)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="extracted_records")
