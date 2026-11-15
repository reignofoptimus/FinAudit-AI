from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Discrepancy(Base):
    __tablename__ = "discrepancies"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    related_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    discrepancy_type = Column(String(100), nullable=False)  # 'amount_mismatch', 'tax_error', 'date_inconsistency', 'bank_vs_ledger'
    expected_value = Column(String(255), nullable=False)
    actual_value = Column(String(255), nullable=False)
    difference_amount = Column(Float, default=0.0)
    
    risk_level = Column(String(50), default="medium")  # 'high', 'medium', 'low'
    explanation = Column(Text, nullable=False)
    status = Column(String(50), default="unresolved")  # 'unresolved', 'resolved', 'acknowledged'
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="discrepancies")
    related_document = relationship("Document")
