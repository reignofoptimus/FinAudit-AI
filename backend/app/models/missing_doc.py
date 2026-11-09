from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class MissingDocumentAlert(Base):
    __tablename__ = "missing_document_alerts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    
    missing_document_type = Column(String(100), default="invoice")  # 'invoice', 'receipt', 'purchase_order', 'bank_slip'
    explanation = Column(Text, nullable=False)
    risk_level = Column(String(50), default="medium")  # 'high', 'medium', 'low'
    
    is_resolved = Column(Boolean, default=False)
    attached_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="missing_document_alerts")
    attached_document = relationship("Document")
