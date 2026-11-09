from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    registration_number = Column(String(100), nullable=True)
    industry = Column(String(100), default="Technology & Services")
    currency = Column(String(10), default="USD")
    fiscal_year_end = Column(String(20), default="December 31")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="company", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="company", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="company", cascade="all, delete-orphan")
    audit_reports = relationship("AuditReport", back_populates="company", cascade="all, delete-orphan")
