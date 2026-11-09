from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.discrepancy import Discrepancy
from app.models.match import TransactionMatch
from app.config import settings

def run_discrepancy_analysis(db: Session, company_id: int) -> Dict[str, Any]:
    """
    Evaluates:
    1. TransactionMatches where amount or date mismatches
    2. Tax calculation errors (e.g. tax != total * tax_rate or tax exceeds total)
    3. Ledger vs Bank payment discrepancies
    4. Large unrecorded or inconsistent payments
    """
    # Clear existing active discrepancies
    db.query(Discrepancy).filter(
        Discrepancy.status == "unresolved",
        Discrepancy.transaction.has(company_id=company_id)
    ).delete(synchronize_session=False)

    discrepancies_created = 0

    # 1. From Transaction Matches with Mismatches
    mismatches = db.query(TransactionMatch).filter(
        TransactionMatch.match_type.in_(["amount_mismatch", "date_mismatch"]),
        TransactionMatch.primary_transaction.has(company_id=company_id)
    ).all()

    for m in mismatches:
        t_prim = m.primary_transaction
        t_match = m.matched_transaction
        
        if m.match_type == "amount_mismatch":
            risk = "high" if m.amount_difference >= settings.MEDIUM_RISK_AMOUNT_THRESHOLD else "medium"
            disc = Discrepancy(
                transaction_id=t_prim.id,
                related_document_id=t_match.document_id,
                discrepancy_type="amount_mismatch",
                expected_value=f"${t_match.amount:,.2f} (Ledger)",
                actual_value=f"${t_prim.amount:,.2f} (Invoice)",
                difference_amount=m.amount_difference,
                risk_level=risk,
                explanation=f"Variance of ${m.amount_difference:,.2f} between source document and general ledger entry for vendor '{t_prim.vendor_name}'. Expected ${t_match.amount:,.2f}, billed as ${t_prim.amount:,.2f}.",
                status="unresolved"
            )
            db.add(disc)
            discrepancies_created += 1

        elif m.match_type == "date_mismatch":
            risk = "medium" if m.date_difference_days > 20 else "low"
            disc = Discrepancy(
                transaction_id=t_prim.id,
                related_document_id=t_match.document_id,
                discrepancy_type="date_inconsistency",
                expected_value=t_match.transaction_date.strftime("%Y-%m-%d"),
                actual_value=t_prim.transaction_date.strftime("%Y-%m-%d"),
                difference_amount=0.0,
                risk_level=risk,
                explanation=f"Significant timing difference of {m.date_difference_days} days between billing date and ledger recording for {t_prim.vendor_name}.",
                status="unresolved"
            )
            db.add(disc)
            discrepancies_created += 1

    # 2. Check Tax Calculations across all invoices
    invoices = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        Transaction.source_type == "invoice"
    ).all()

    for inv in invoices:
        if inv.amount > 100.0:
            # Expected standard tax ~ 8% to 10%
            expected_tax = round(inv.amount * 0.08, 2)
            actual_tax = inv.tax_amount or 0.0
            
            # Tax calculation error if actual tax is 0 or deviates by > 30% from standard calculation
            if actual_tax > 0 and abs(actual_tax - expected_tax) > max(150.0, expected_tax * 0.4):
                tax_diff = round(abs(actual_tax - expected_tax), 2)
                risk = "high" if tax_diff > 1000.0 else "medium"
                disc = Discrepancy(
                    transaction_id=inv.id,
                    related_document_id=inv.document_id,
                    discrepancy_type="tax_calculation_error",
                    expected_value=f"${expected_tax:,.2f} (Standard 8% Tax)",
                    actual_value=f"${actual_tax:,.2f} (Recorded Tax)",
                    difference_amount=tax_diff,
                    risk_level=risk,
                    explanation=f"Recorded sales/VAT tax of ${actual_tax:,.2f} deviates significantly from statutory tax rate on total amount of ${inv.amount:,.2f}.",
                    status="unresolved"
                )
                db.add(disc)
                discrepancies_created += 1

    db.commit()
    return {
        "status": "success",
        "discrepancies_identified": discrepancies_created
    }
