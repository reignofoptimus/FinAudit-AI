from datetime import datetime
from difflib import SequenceMatcher
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.match import TransactionMatch
from app.models.discrepancy import Discrepancy

def string_similarity(a: Optional[str], b: Optional[str]) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

def run_automated_matching(db: Session, company_id: int) -> Dict[str, Any]:
    """
    Compares Invoices, Bank Statements, and General Ledger transactions for the company.
    Finds exact, fuzzy, amount-mismatched, and date-mismatched pairs.
    """
    # Clear existing suggested matches to allow clean re-runs
    db.query(TransactionMatch).filter(
        TransactionMatch.status == "suggested",
        TransactionMatch.primary_transaction.has(company_id=company_id)
    ).delete(synchronize_session=False)
    
    invoices = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        Transaction.source_type == "invoice"
    ).all()
    
    bank_txs = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        Transaction.source_type == "bank_statement"
    ).all()
    
    ledger_txs = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        Transaction.source_type == "ledger"
    ).all()
    
    matches_created = 0
    matched_primary_ids = set()
    matched_target_ids = set()

    # Pass 1: Invoice vs General Ledger
    for inv in invoices:
        best_match = None
        best_score = 0.0
        best_type = None
        best_reason = ""
        diff_amount = 0.0
        diff_days = 0

        for led in ledger_txs:
            if led.id in matched_target_ids:
                continue

            # Check invoice number match
            inv_no_match = (
                inv.invoice_number and led.invoice_number and 
                inv.invoice_number.strip().upper() == led.invoice_number.strip().upper()
            )

            # Amount difference
            amt_diff = round(abs(inv.amount - led.amount), 2)
            amt_exact = amt_diff == 0.0
            amt_close = amt_diff > 0.0 and amt_diff <= max(inv.amount * 0.05, 50.0)

            # Date difference in days
            days_diff = abs((inv.transaction_date - led.transaction_date).days)
            date_close = days_diff <= 7

            # Vendor similarity
            vendor_sim = string_similarity(inv.vendor_name, led.vendor_name)

            # 1. Exact Match: Invoice # and Amount match, close date
            if inv_no_match and amt_exact and date_close:
                score = 0.99
                mtype = "exact"
                reason = f"Exact invoice #{inv.invoice_number} and identical amount ${inv.amount:,.2f}"
                best_match = led
                best_score = score
                best_type = mtype
                best_reason = reason
                diff_amount = amt_diff
                diff_days = days_diff
                break

            # 2. Fuzzy Match: Vendor similarity >= 0.85 and exact amount and date within 5 days
            elif vendor_sim >= 0.85 and amt_exact and date_close:
                score = 0.92
                mtype = "fuzzy"
                reason = f"Vendor match ({vendor_sim*100:.0f}%), identical amount ${inv.amount:,.2f}"
                if score > best_score:
                    best_match = led
                    best_score = score
                    best_type = mtype
                    best_reason = reason
                    diff_amount = amt_diff
                    diff_days = days_diff

            # 3. Amount Mismatch: Invoice number match or strong vendor match, but amount differs
            elif (inv_no_match or vendor_sim >= 0.90) and not amt_exact and amt_diff < 5000.0 and date_close:
                score = 0.75
                mtype = "amount_mismatch"
                reason = f"Invoice reference match but amount differs: Invoice ${inv.amount:,.2f} vs Ledger ${led.amount:,.2f} (Diff: ${amt_diff:,.2f})"
                if score > best_score:
                    best_match = led
                    best_score = score
                    best_type = mtype
                    best_reason = reason
                    diff_amount = amt_diff
                    diff_days = days_diff

            # 4. Date Mismatch: Exact amount and invoice/vendor match, but date differs by > 7 days
            elif (inv_no_match or vendor_sim >= 0.90) and amt_exact and days_diff > 7 and days_diff <= 45:
                score = 0.78
                mtype = "date_mismatch"
                reason = f"Amount ${inv.amount:,.2f} matched but date differs by {days_diff} days"
                if score > best_score:
                    best_match = led
                    best_score = score
                    best_type = mtype
                    best_reason = reason
                    diff_amount = amt_diff
                    diff_days = days_diff

        if best_match:
            match_obj = TransactionMatch(
                primary_transaction_id=inv.id,
                matched_transaction_id=best_match.id,
                match_type=best_type,
                confidence_score=best_score,
                status="suggested",
                amount_difference=diff_amount,
                date_difference_days=diff_days,
                match_reasons=best_reason
            )
            db.add(match_obj)
            matched_primary_ids.add(inv.id)
            matched_target_ids.add(best_match.id)
            
            # Update status
            inv.match_status = "matched" if best_type in ["exact", "fuzzy"] else "discrepancy"
            best_match.match_status = inv.match_status
            matches_created += 1

    # Pass 2: Bank Statement vs General Ledger (for payments not yet matched)
    for btx in bank_txs:
        if btx.id in matched_primary_ids:
            continue
        best_match = None
        best_score = 0.0
        best_type = None
        best_reason = ""
        diff_amount = 0.0
        diff_days = 0

        for led in ledger_txs:
            if led.id in matched_target_ids:
                continue

            amt_diff = round(abs(btx.amount - led.amount), 2)
            amt_exact = amt_diff == 0.0
            days_diff = abs((btx.transaction_date - led.transaction_date).days)
            vendor_sim = string_similarity(btx.vendor_name, led.vendor_name)
            ref_match = btx.reference_no and led.reference_no and btx.reference_no.strip() == led.reference_no.strip()

            if (ref_match or vendor_sim >= 0.88) and amt_exact and days_diff <= 3:
                score = 0.97
                mtype = "exact"
                reason = f"Bank statement record matches ledger for {btx.vendor_name} (${btx.amount:,.2f})"
                best_match = led
                best_score = score
                best_type = mtype
                best_reason = reason
                diff_amount = amt_diff
                diff_days = days_diff
                break
            elif vendor_sim >= 0.80 and amt_exact and days_diff <= 7:
                score = 0.88
                mtype = "fuzzy"
                reason = f"Fuzzy bank match ({vendor_sim*100:.0f}%) with identical amount ${btx.amount:,.2f}"
                if score > best_score:
                    best_match = led
                    best_score = score
                    best_type = mtype
                    best_reason = reason
                    diff_amount = amt_diff
                    diff_days = days_diff

        if best_match:
            match_obj = TransactionMatch(
                primary_transaction_id=btx.id,
                matched_transaction_id=best_match.id,
                match_type=best_type,
                confidence_score=best_score,
                status="suggested",
                amount_difference=diff_amount,
                date_difference_days=diff_days,
                match_reasons=best_reason
            )
            db.add(match_obj)
            matched_primary_ids.add(btx.id)
            matched_target_ids.add(best_match.id)
            btx.match_status = "matched"
            best_match.match_status = "matched"
            matches_created += 1

    db.commit()
    return {
        "status": "success",
        "matches_generated": matches_created,
        "matched_primary_count": len(matched_primary_ids),
        "timestamp": datetime.utcnow().isoformat()
    }
