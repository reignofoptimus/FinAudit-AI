from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

class DuplicateRecord(Base):
    __tablename__ = "duplicate_records"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(String(100), nullable=False, index=True)  # Links paired duplicate transactions
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    
    duplicate_type = Column(String(100), default="exact_invoice")  # 'exact_invoice', 'fuzzy_vendor_amount', 'content_match'
    confidence_score = Column(Float, default=0.95)
    flag_reason = Column(Text, nullable=False)
    status = Column(String(50), default="flagged")  # 'flagged', 'confirmed_duplicate', 'false_positive', 'resolved'
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction")
