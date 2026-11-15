from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

class TransactionMatch(Base):
    __tablename__ = "transaction_matches"

    id = Column(Integer, primary_key=True, index=True)
    primary_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    matched_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    
    match_type = Column(String(50), default="exact")  # 'exact', 'fuzzy', 'amount_mismatch', 'date_mismatch'
    confidence_score = Column(Float, default=1.0)
    status = Column(String(50), default="suggested")  # 'suggested', 'confirmed', 'rejected'
    
    amount_difference = Column(Float, default=0.0)
    date_difference_days = Column(Integer, default=0)
    match_reasons = Column(Text, nullable=True)
    auditor_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    primary_transaction = relationship("Transaction", foreign_keys=[primary_transaction_id], back_populates="primary_matches")
    matched_transaction = relationship("Transaction", foreign_keys=[matched_transaction_id], back_populates="matched_to")
