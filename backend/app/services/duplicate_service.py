import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.duplicate import DuplicateRecord
from app.services.matching_service import string_similarity

def run_duplicate_detection(db: Session, company_id: int) -> Dict[str, Any]:
    """
    Scans company transactions for duplicates using:
    1. Exact invoice number match across transactions
    2. Identical amount + exact/fuzzy vendor name within 30 days
    3. Identical transaction reference
    """
    # Clear existing active flags for clean re-detection
    db.query(DuplicateRecord).filter(
        DuplicateRecord.status == "flagged",
        DuplicateRecord.transaction.has(company_id=company_id)
    ).delete(synchronize_session=False)

    transactions = db.query(Transaction).filter(
        Transaction.company_id == company_id
    ).order_by(Transaction.transaction_date.asc()).all()

    flagged_ids = set()
    groups_created = 0

    n = len(transactions)
    for i in range(n):
        t1 = transactions[i]
        for j in range(i + 1, n):
            t2 = transactions[j]
            
            # Avoid comparing identical objects or cross-source expected matches (e.g., invoice vs its own ledger entry)
            # If one is invoice and one is ledger, that is a match, NOT a duplicate payment!
            # Duplicates are within the SAME source type or two payment records (two invoices, or two bank payments)
            if t1.source_type != t2.source_type and not (t1.source_type == "bank_statement" and t2.source_type == "bank_statement"):
                continue

            is_duplicate = False
            dup_type = ""
            reason = ""
            confidence = 0.0

            # 1. Exact Invoice Number match on two invoices
            if (
                t1.invoice_number and t2.invoice_number and 
                t1.invoice_number.strip().upper() == t2.invoice_number.strip().upper() and
                t1.source_type == "invoice" and t2.source_type == "invoice"
            ):
                is_duplicate = True
                dup_type = "exact_invoice_duplicate"
                confidence = 0.98
                reason = f"Duplicate invoice number '{t1.invoice_number}' billed twice (${t1.amount:,.2f} and ${t2.amount:,.2f}) by vendor '{t1.vendor_name}'"

            # 2. Identical Amount and exact/fuzzy vendor within 30 days on payments
            elif abs(t1.amount - t2.amount) == 0.0:
                vendor_sim = string_similarity(t1.vendor_name, t2.vendor_name)
                days_diff = abs((t1.transaction_date - t2.transaction_date).days)
                
                if vendor_sim >= 0.85 and days_diff <= 30:
                    is_duplicate = True
                    dup_type = "identical_payment_pattern"
                    confidence = 0.92 if days_diff <= 7 else 0.82
                    reason = f"Potential double-payment of ${t1.amount:,.2f} to '{t1.vendor_name}' within {days_diff} days (dates: {t1.transaction_date.strftime('%Y-%m-%d')} & {t2.transaction_date.strftime('%Y-%m-%d')})"

            # 3. Exact Transaction ID match
            elif (
                t1.reference_no and t2.reference_no and
                t1.reference_no.strip() == t2.reference_no.strip() and
                len(t1.reference_no.strip()) > 4
            ):
                is_duplicate = True
                dup_type = "duplicate_reference_id"
                confidence = 0.95
                reason = f"Identical transaction reference '{t1.reference_no}' found in multiple records for ${t1.amount:,.2f}"

            if is_duplicate:
                group_uuid = f"DUP-{uuid.uuid4().hex[:8].upper()}"
                
                # Add record for t1
                d1 = DuplicateRecord(
                    group_id=group_uuid,
                    transaction_id=t1.id,
                    duplicate_type=dup_type,
                    confidence_score=confidence,
                    flag_reason=reason,
                    status="flagged"
                )
                # Add record for t2
                d2 = DuplicateRecord(
                    group_id=group_uuid,
                    transaction_id=t2.id,
                    duplicate_type=dup_type,
                    confidence_score=confidence,
                    flag_reason=reason,
                    status="flagged"
                )
                db.add(d1)
                db.add(d2)
                
                t1.is_duplicate = True
                t2.is_duplicate = True
                flagged_ids.add(t1.id)
                flagged_ids.add(t2.id)
                groups_created += 1

    db.commit()
    return {
        "status": "success",
        "duplicate_groups_detected": groups_created,
        "total_flagged_transactions": len(flagged_ids)
    }
