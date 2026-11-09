import os
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.config import settings
from app.models.company import Company
from app.models.user import User
from app.models.vendor import Vendor
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.activity_log import ActivityLog
from app.services.auth_service import get_password_hash
from app.services.matching_service import run_automated_matching
from app.services.duplicate_service import run_duplicate_detection
from app.services.discrepancy_service import run_discrepancy_analysis
from app.services.missing_doc_service import run_missing_document_scan
from app.services.anomaly_service import run_ml_anomaly_detection
from app.services.vendor_service import update_vendor_analytics
from app.sample_data.generate_sample_files import create_all_sample_files

def seed_database():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_company = db.query(Company).first()
        if existing_company and db.query(Transaction).count() >= 100:
            print("Database already contains seed transactions.")
            return

        print("Generating sample test documents...")
        create_all_sample_files()

        print("Seeding Company & Users...")
        company = existing_company or Company(
            name="Acme Global Enterprise",
            registration_number="US-DEL-984210",
            industry="Enterprise Technology & Logistics",
            currency="USD",
            fiscal_year_end="December 31"
        )
        if not existing_company:
            db.add(company)
            db.flush()

        # Seed Users
        admin_user = db.query(User).filter(User.email == "admin@finaudit.ai").first()
        if not admin_user:
            admin_user = User(
                email="admin@finaudit.ai",
                hashed_password=get_password_hash("AdminPass123!"),
                full_name="Sarah Jenkins (Lead Audit Partner)",
                role="admin",
                company_id=company.id
            )
            db.add(admin_user)

        auditor_user = db.query(User).filter(User.email == "auditor@finaudit.ai").first()
        if not auditor_user:
            auditor_user = User(
                email="auditor@finaudit.ai",
                hashed_password=get_password_hash("AuditorPass123!"),
                full_name="David Vance (Senior Forensic Auditor)",
                role="auditor",
                company_id=company.id
            )
            db.add(auditor_user)

        db.flush()

        # Seed Vendors
        vendor_configs = [
            ("CloudScale Solutions", "Cloud & Web Infrastructure", "Net 30", 12.0),
            ("Apex Office Supplies", "Office Equipment & Furniture", "Net 15", 8.0),
            ("Delta Logistics Corp", "Freight & Fleet Operations", "Net 30", 45.0),
            ("Nexa Tech Hardware", "Hardware & IT Equipment", "Net 30", 20.0),
            ("Vertex Solutions Group", "Strategy & Engineering Consulting", "Net 45", 25.0),
            ("Horizon Marketing LLC", "Advertising & Digital Acquisition", "Net 30", 65.0),
            ("CyberShield Security", "Cybersecurity & Pen-testing", "Net 30", 15.0),
            ("Metro Facilities & Janitorial", "Premises & Sanitization", "Net 15", 5.0),
            ("Prime Telecom", "High-Speed Transit & VOIP", "Net 30", 10.0),
            ("Pinnacle Legal Advisors", "Corporate Legal Counsel", "Net 30", 30.0),
            ("Swift Global Courier", "Document Courier & Express Cargo", "Net 15", 7.0),
            ("Quantum Data Analytics", "ML Cloud Training Clusters", "Net 30", 55.0)
        ]

        vendors_map = {}
        for name, cat, terms, base_risk in vendor_configs:
            v = db.query(Vendor).filter(Vendor.name == name, Vendor.company_id == company.id).first()
            if not v:
                v = Vendor(
                    company_id=company.id,
                    name=name,
                    normalized_name=name.lower(),
                    category=cat,
                    payment_terms=terms,
                    tax_id=f"XX-9{random.randint(100000, 999999)}",
                    risk_score=base_risk,
                    risk_rating="high" if base_risk >= 60 else "medium" if base_risk >= 25 else "low"
                )
                db.add(v)
                db.flush()
            vendors_map[name] = v

        # Seed Documents
        sample_pdf = os.path.join(settings.SAMPLE_DIR, "sample_invoice_cloudscale.pdf")
        sample_csv = os.path.join(settings.SAMPLE_DIR, "sample_bank_statement_q4.csv")
        sample_xlsx = os.path.join(settings.SAMPLE_DIR, "sample_general_ledger.xlsx")

        doc1 = Document(
            company_id=company.id,
            filename="sample_invoice_cloudscale.pdf",
            file_path=sample_pdf,
            file_type="pdf",
            category="invoice",
            file_size_bytes=os.path.getsize(sample_pdf) if os.path.exists(sample_pdf) else 45000,
            processing_status="completed",
            extracted_records_count=1,
            confidence_score=0.96
        )
        doc2 = Document(
            company_id=company.id,
            filename="sample_bank_statement_q4.csv",
            file_path=sample_csv,
            file_type="csv",
            category="bank_statement",
            file_size_bytes=os.path.getsize(sample_csv) if os.path.exists(sample_csv) else 2500,
            processing_status="completed",
            extracted_records_count=8,
            confidence_score=0.98
        )
        doc3 = Document(
            company_id=company.id,
            filename="sample_general_ledger.xlsx",
            file_path=sample_xlsx,
            file_type="xlsx",
            category="general_ledger",
            file_size_bytes=os.path.getsize(sample_xlsx) if os.path.exists(sample_xlsx) else 6500,
            processing_status="completed",
            extracted_records_count=8,
            confidence_score=0.99
        )
        db.add_all([doc1, doc2, doc3])
        db.flush()

        print("Generating 120+ synthetic realistic financial transactions...")
        base_date = datetime(2024, 1, 15)
        transactions_to_add = []

        # 1. Standard Consistent Invoices and Matching Ledgers (Pairs)
        standard_vendors = [
            ("CloudScale Solutions", [12500.0, 18500.0, 27000.0, 16400.0, 22100.0]),
            ("Apex Office Supplies", [1420.0, 2890.0, 850.0, 3120.0, 1950.0]),
            ("Delta Logistics Corp", [8400.0, 14250.0, 9200.0, 11800.0, 7600.0]),
            ("Nexa Tech Hardware", [15400.0, 22800.0, 9800.0, 31000.0]),
            ("CyberShield Security", [19800.0, 19800.0, 19800.0, 24500.0]),
            ("Metro Facilities & Janitorial", [4200.0, 6400.0, 5100.0, 4800.0, 6200.0]),
            ("Prime Telecom", [3850.0, 3850.0, 4100.0, 3850.0, 3950.0]),
            ("Pinnacle Legal Advisors", [15000.0, 18500.0, 12000.0, 22000.0]),
            ("Swift Global Courier", [1200.0, 2450.0, 1890.0, 980.0, 2100.0]),
            ("Quantum Data Analytics", [32000.0, 28500.0, 34000.0, 29000.0])
        ]

        inv_counter = 1000
        ref_counter = 5000

        for v_name, amounts in standard_vendors:
            v_obj = vendors_map.get(v_name)
            for idx, amt in enumerate(amounts):
                inv_counter += 1
                ref_counter += 1
                tx_date = base_date + timedelta(days=idx * 45 + random.randint(1, 10))
                inv_no = f"INV-2024-{inv_counter}"
                ref_no = f"TXN-{ref_counter}"

                # Invoice Record
                t_inv = Transaction(
                    company_id=company.id,
                    document_id=doc1.id if v_name == "CloudScale Solutions" else None,
                    vendor_id=v_obj.id if v_obj else None,
                    source_type="invoice",
                    transaction_type="expense",
                    transaction_date=tx_date,
                    amount=amt,
                    tax_amount=round(amt * 0.08, 2),
                    vendor_name=v_name,
                    invoice_number=inv_no,
                    reference_no=ref_no,
                    description=f"Quarterly services rendered by {v_name}",
                    account_code="6000",
                    match_status="unmatched"
                )
                transactions_to_add.append(t_inv)

                # Ledger Record (Matched)
                t_led = Transaction(
                    company_id=company.id,
                    document_id=doc3.id,
                    vendor_id=v_obj.id if v_obj else None,
                    source_type="ledger",
                    transaction_type="expense",
                    transaction_date=tx_date + timedelta(days=random.randint(1, 3)),
                    amount=amt,
                    tax_amount=round(amt * 0.08, 2),
                    vendor_name=v_name,
                    invoice_number=inv_no,
                    reference_no=ref_no,
                    description=f"GL Posting: {v_name} - {inv_no}",
                    account_code="6000",
                    match_status="unmatched"
                )
                transactions_to_add.append(t_led)

                # Bank Record for settlement
                t_bnk = Transaction(
                    company_id=company.id,
                    document_id=doc2.id,
                    vendor_id=v_obj.id if v_obj else None,
                    source_type="bank_statement",
                    transaction_type="expense",
                    transaction_date=tx_date + timedelta(days=random.randint(2, 5)),
                    amount=amt,
                    tax_amount=0.0,
                    vendor_name=v_name,
                    invoice_number=inv_no,
                    reference_no=ref_no,
                    description=f"ACH Settlement: {v_name}",
                    account_code="1010",
                    match_status="unmatched"
                )
                transactions_to_add.append(t_bnk)

        # 2. Deliberate Duplicate Invoices & Payments
        # Case A: Horizon Marketing identical invoice billed twice
        inv_counter += 1
        ref_counter += 1
        dup_date1 = datetime(2024, 6, 12)
        dup_date2 = datetime(2024, 6, 19)
        dup_inv_no = f"INV-HM-DUPLICATE-{inv_counter}"
        
        dup_tx1 = Transaction(
            company_id=company.id,
            source_type="invoice",
            transaction_type="expense",
            transaction_date=dup_date1,
            amount=14850.00,
            tax_amount=1188.00,
            vendor_name="Horizon Marketing LLC",
            invoice_number=dup_inv_no,
            reference_no=f"TXN-{ref_counter}",
            description="Campaign management fee (First submission)",
            match_status="unmatched",
            is_duplicate=True
        )
        ref_counter += 1
        dup_tx2 = Transaction(
            company_id=company.id,
            source_type="invoice",
            transaction_type="expense",
            transaction_date=dup_date2,
            amount=14850.00,
            tax_amount=1188.00,
            vendor_name="Horizon Marketing LLC",
            invoice_number=dup_inv_no,
            reference_no=f"TXN-{ref_counter}",
            description="Campaign management fee (Duplicate re-submission)",
            match_status="unmatched",
            is_duplicate=True
        )
        transactions_to_add.extend([dup_tx1, dup_tx2])

        # Case B: Double Wire Transfer to Delta Logistics
        dup_bank1 = Transaction(
            company_id=company.id,
            source_type="bank_statement",
            transaction_type="expense",
            transaction_date=datetime(2024, 8, 4),
            amount=18400.00,
            vendor_name="Delta Logistics Corp",
            reference_no="WIRE-DL-9901",
            description="Wire Transfer to Delta Logistics Corp",
            match_status="unmatched",
            is_duplicate=True
        )
        dup_bank2 = Transaction(
            company_id=company.id,
            source_type="bank_statement",
            transaction_type="expense",
            transaction_date=datetime(2024, 8, 6),
            amount=18400.00,
            vendor_name="Delta Logistics Corp",
            reference_no="WIRE-DL-9902",
            description="Duplicate Wire Out: Delta Logistics Corp",
            match_status="unmatched",
            is_duplicate=True
        )
        transactions_to_add.extend([dup_bank1, dup_bank2])

        # 3. Deliberate Amount Mismatches (Ledger differs from Invoice)
        # Case A: Nexa Tech Hardware Invoice billed $34,800 but Ledger recorded $31,500 ($3,300 variance)
        inv_counter += 1
        ref_counter += 1
        disc_inv1 = Transaction(
            company_id=company.id,
            source_type="invoice",
            transaction_type="expense",
            transaction_date=datetime(2024, 5, 10),
            amount=34800.00,
            tax_amount=2784.00,
            vendor_name="Nexa Tech Hardware",
            invoice_number=f"INV-NT-{inv_counter}",
            reference_no=f"TXN-{ref_counter}",
            description="Server cluster replacement batch",
            match_status="discrepancy"
        )
        disc_led1 = Transaction(
            company_id=company.id,
            source_type="ledger",
            transaction_type="expense",
            transaction_date=datetime(2024, 5, 12),
            amount=31500.00,
            tax_amount=2520.00,
            vendor_name="Nexa Tech Hardware",
            invoice_number=f"INV-NT-{inv_counter}",
            reference_no=f"TXN-{ref_counter}",
            description="GL Posting: Nexa Tech Server Replacement (Under-recorded)",
            match_status="discrepancy"
        )
        transactions_to_add.extend([disc_inv1, disc_led1])

        # Case B: Vertex Solutions Consulting Invoice $22,450 vs Ledger $22,045 (Typo transposition)
        inv_counter += 1
        ref_counter += 1
        disc_inv2 = Transaction(
            company_id=company.id,
            source_type="invoice",
            transaction_type="expense",
            transaction_date=datetime(2024, 7, 18),
            amount=22450.00,
            tax_amount=1796.00,
            vendor_name="Vertex Solutions Group",
            invoice_number=f"INV-VS-{inv_counter}",
            reference_no=f"TXN-{ref_counter}",
            description="Strategic architectural assessment",
            match_status="discrepancy"
        )
        disc_led2 = Transaction(
            company_id=company.id,
            source_type="ledger",
            transaction_type="expense",
            transaction_date=datetime(2024, 7, 20),
            amount=22045.00,
            tax_amount=1763.60,
            vendor_name="Vertex Solutions Group",
            invoice_number=f"INV-VS-{inv_counter}",
            reference_no=f"TXN-{ref_counter}",
            description="GL Posting: Strategic assessment ($405 digit swap error)",
            match_status="discrepancy"
        )
        transactions_to_add.extend([disc_inv2, disc_led2])

        # 4. Deliberate Tax Calculation Discrepancy
        # An invoice with erroneous tax calculation ($5,200 on an $18,000 order = 28.8% tax)
        inv_counter += 1
        ref_counter += 1
        tax_error_inv = Transaction(
            company_id=company.id,
            source_type="invoice",
            transaction_type="expense",
            transaction_date=datetime(2024, 9, 5),
            amount=18000.00,
            tax_amount=5200.00, # Incorrect excessive tax
            vendor_name="Pinnacle Legal Advisors",
            invoice_number=f"INV-PLA-TAXERR-{inv_counter}",
            reference_no=f"TXN-{ref_counter}",
            description="Retainer and regulatory filings with anomalous tax charge",
            match_status="unmatched"
        )
        transactions_to_add.append(tax_error_inv)

        # 5. Deliberate Missing Supporting Documents
        # Wire payments in bank statement with NO document attached
        for m_idx, (m_vendor, m_amt) in enumerate([
            ("Delta Logistics Corp", 42500.00),
            ("Horizon Marketing LLC", 28000.00),
            ("Apex Office Supplies", 4120.00),
            ("Quantum Data Analytics", 58000.00),
            ("Nexa Tech Hardware", 18900.00)
        ]):
            ref_counter += 1
            missing_tx = Transaction(
                company_id=company.id,
                document_id=None, # Missing document
                source_type="bank_statement",
                transaction_type="expense",
                transaction_date=datetime(2024, 4, 10) + timedelta(days=m_idx * 35),
                amount=m_amt,
                vendor_name=m_vendor,
                reference_no=f"UNATTACHED-WIRE-{ref_counter}",
                description=f"Disbursement to {m_vendor} without uploaded PO or voucher",
                match_status="unmatched",
                has_missing_doc=True
            )
            transactions_to_add.append(missing_tx)

        # 6. Deliberate Machine Learning Anomalies (Outliers)
        # Outlier A: Huge Sunday transaction to Horizon Marketing ($98,500.00 - normally ~$12k)
        ref_counter += 1
        sunday_date = datetime(2024, 9, 15) # Sunday
        anom_tx1 = Transaction(
            company_id=company.id,
            source_type="bank_statement",
            transaction_type="expense",
            transaction_date=sunday_date,
            amount=98500.00, # Extreme spike
            vendor_name="Horizon Marketing LLC",
            reference_no=f"WIRE-WEEKEND-{ref_counter}",
            description="Urgent off-cycle international media buy payout",
            match_status="unmatched",
            is_anomaly=True
        )
        transactions_to_add.append(anom_tx1)

        # Outlier B: Extreme spike for Apex Office Supplies ($48,200.00 - normally ~$2k)
        ref_counter += 1
        anom_tx2 = Transaction(
            company_id=company.id,
            source_type="invoice",
            transaction_type="expense",
            transaction_date=datetime(2024, 8, 22),
            amount=48200.00,
            tax_amount=3856.00,
            vendor_name="Apex Office Supplies",
            invoice_number=f"INV-AO-SPIKE-{inv_counter}",
            reference_no=f"TXN-{ref_counter}",
            description="Entire office workstation overhaul bulk order",
            match_status="unmatched",
            is_anomaly=True
        )
        transactions_to_add.append(anom_tx2)

        # 7. Revenue / Customer Deposits (to demonstrate income and expense charts)
        revenue_items = [
            ("Global Health Systems Enterprise Contract", 125000.00, datetime(2024, 2, 10)),
            ("FinTech Corp Platform License Q1", 95000.00, datetime(2024, 3, 20)),
            ("Starlight Media Cloud Hosting Fee", 72000.00, datetime(2024, 5, 15)),
            ("Vertex Systems Implementation Milestone", 140000.00, datetime(2024, 7, 1)),
            ("Orion Retail ERP Integration Deposit", 110000.00, datetime(2024, 8, 28)),
            ("Atlantic Logistics SaaS Subscription", 88000.00, datetime(2024, 10, 12))
        ]
        for desc, inc_amt, inc_date in revenue_items:
            ref_counter += 1
            inc_tx = Transaction(
                company_id=company.id,
                source_type="bank_statement",
                transaction_type="income",
                transaction_date=inc_date,
                amount=inc_amt,
                vendor_name="Client Remittance Account",
                reference_no=f"REC-{ref_counter}",
                description=desc,
                account_code="4010",
                match_status="matched"
            )
            transactions_to_add.append(inc_tx)

        db.add_all(transactions_to_add)
        db.commit()

        print(f"Committed {len(transactions_to_add)} transactions to database.")

        # Run automated auditing pipelines
        print("Running automated transaction matching...")
        run_automated_matching(db, company.id)

        print("Running duplicate detection engine...")
        run_duplicate_detection(db, company.id)

        print("Running discrepancy analysis...")
        run_discrepancy_analysis(db, company.id)

        print("Running missing document scanner...")
        run_missing_document_scan(db, company.id)

        print("Running Scikit-learn Isolation Forest ML anomaly model...")
        run_ml_anomaly_detection(db, company.id)

        print("Updating vendor risk and financial aggregates...")
        update_vendor_analytics(db, company.id)

        # Seed initial activity logs
        db.add_all([
            ActivityLog(user_id=admin_user.id, action="INITIAL_AUDIT_SEED", entity_type="system", details="Financial dataset initialized with 120+ transactions"),
            ActivityLog(user_id=auditor_user.id, action="SCAN_COMPLETE", entity_type="audit", details="Automated audit suite executed across FY2024 records")
        ])
        db.commit()

        print("Seeding completed successfully! System is fully operational.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
