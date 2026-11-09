from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.missing_doc import MissingDocumentAlert
from app.config import settings

def run_missing_document_scan(db: Session, company_id: int) -> Dict[str, Any]:
    """
    Identifies transactions in bank statements or ledger that lack an attached document_id,
    or payments over threshold without corresponding invoices/receipts.
    """
    # Clear existing unresolved alerts
    db.query(MissingDocumentAlert).filter(
        MissingDocumentAlert.is_resolved == False,
        MissingDocumentAlert.transaction.has(company_id=company_id)
    ).delete(synchronize_session=False)

    transactions = db.query(Transaction).filter(
        Transaction.company_id == company_id
    ).all()

    missing_alerts_created = 0

    for tx in transactions:
        # If transaction has no document_id or has_missing_doc is marked
        if tx.document_id is None or tx.has_missing_doc:
            req_type = "invoice"
            if tx.source_type == "bank_statement":
                req_type = "invoice_or_contract"
            elif tx.amount < 500.0:
                req_type = "expense_receipt"
            elif tx.amount > 10000.0:
                req_type = "purchase_order_and_invoice"

            risk = "high" if tx.amount >= settings.HIGH_RISK_AMOUNT_THRESHOLD else "medium"
            if tx.amount < 1000.0:
                risk = "low"

            alert = MissingDocumentAlert(
                transaction_id=tx.id,
                missing_document_type=req_type,
                explanation=f"Transaction of ${tx.amount:,.2f} to '{tx.vendor_name}' on {tx.transaction_date.strftime('%Y-%m-%d')} has no supporting {req_type.replace('_', ' ')} uploaded or attached.",
                risk_level=risk,
                is_resolved=False
            )
            db.add(alert)
            tx.has_missing_doc = True
            missing_alerts_created += 1

    db.commit()
    return {
        "status": "success",
        "missing_documents_detected": missing_alerts_created
    }
