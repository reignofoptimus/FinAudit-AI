from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    normalized_name = Column(String(255), nullable=False, index=True)
    tax_id = Column(String(100), nullable=True)
    category = Column(String(100), default="General Supplier")
    contact_email = Column(String(255), nullable=True)
    payment_terms = Column(String(50), default="Net 30")
    
    # Risk Metrics
    risk_rating = Column(String(50), default="low")  # 'low', 'medium', 'high'
    risk_score = Column(Float, default=15.0)  # 0 to 100
    risk_reasons = Column(Text, nullable=True)
    
    # Financial Aggregates (cached/updated on seed/sync)
    total_spend = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    duplicate_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="vendors")
    transactions = relationship("Transaction", back_populates="vendor")
