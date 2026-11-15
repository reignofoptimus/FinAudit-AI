from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    
    anomaly_score = Column(Float, nullable=False)  # Normalized 0 to 100 (higher = more anomalous)
    raw_isolation_score = Column(Float, nullable=True)  # Raw output from Isolation Forest
    risk_level = Column(String(50), default="high")  # 'high', 'medium', 'low'
    
    anomaly_factors = Column(Text, nullable=False)  # JSON or text breakdown: e.g. "Amount is 5.2x vendor mean; processed on Sunday"
    model_name = Column(String(100), default="IsolationForest-v1.0")
    
    is_reviewed = Column(Boolean, default=False)
    auditor_disposition = Column(String(50), nullable=True)  # 'legitimate', 'suspicious', 'confirmed_fraud'
    auditor_comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="anomalies")
