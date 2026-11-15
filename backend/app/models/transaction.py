from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    
    source_type = Column(String(50), nullable=False)  # 'invoice', 'bank_statement', 'ledger', 'receipt'
    transaction_type = Column(String(20), default="expense")  # 'expense', 'income', 'debit', 'credit'
    
    transaction_date = Column(DateTime, nullable=False, index=True)
    amount = Column(Float, nullable=False, index=True)
    tax_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    
    vendor_name = Column(String(255), nullable=True, index=True)
    invoice_number = Column(String(100), nullable=True, index=True)
    reference_no = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    account_code = Column(String(50), default="6000")  # General ledger account code
    
    # Audit Flags
    match_status = Column(String(50), default="unmatched")  # 'unmatched', 'matched', 'partial', 'discrepancy'
    is_duplicate = Column(Boolean, default=False)
    is_anomaly = Column(Boolean, default=False)
    has_missing_doc = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="transactions")
    document = relationship("Document", back_populates="transactions")
    vendor = relationship("Vendor", back_populates="transactions")
    
    # Matches where this transaction is primary or secondary
    primary_matches = relationship("TransactionMatch", foreign_keys="TransactionMatch.primary_transaction_id", back_populates="primary_transaction", cascade="all, delete-orphan")
    matched_to = relationship("TransactionMatch", foreign_keys="TransactionMatch.matched_transaction_id", back_populates="matched_transaction")
    
    discrepancies = relationship("Discrepancy", back_populates="transaction", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyResult", back_populates="transaction", cascade="all, delete-orphan")
    missing_document_alerts = relationship("MissingDocumentAlert", back_populates="transaction", cascade="all, delete-orphan")
