# FinAudit AI – AI-Powered Financial Audit Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Isolation--Forest-F7931E.svg?style=flat&logo=scikit-learn)](https://scikit-learn.org/)
[License]: https://img.shields.io/badge/License-MIT-blue

**FinAudit AI** is a modern, enterprise-grade financial auditing and assurance platform designed to automate and simplify auditing workflows using Artificial Intelligence, Machine Learning, and automated document extraction.

The application functions as an **AI-powered auditor assistant** that dramatically reduces manual repetitive verification work while ensuring final audit decisions, supervisory reviews, and regulatory attestations remain strictly under human auditor supervision.

---

## Key Capabilities & Modules

1. **Authentication & User Management**
   - JWT-based authentication with bcrypt password hashing.
   - Role-based authorization (`admin`, `auditor`).
   - One-click demo sign-in for Lead Audit Partner and Senior Forensic Auditor.
   - Comprehensive audit activity logging.

2. **Executive Audit Dashboard**
   - Live calculated audit metrics: total transactions, uploaded documents, identified discrepancies, duplicate payments, missing supporting documentation, and ML anomaly outliers.
   - Financial velocity analytics: monthly income (customer remittances) vs expenditures.
   - Audit findings concentration breakdown (pie & bar visualizations with Recharts).
   - High-risk findings queue and recent activity feed.

3. **Financial Document Repository & OCR Extraction**
   - Drag-and-drop multi-file upload supporting PDF, CSV, and Excel (.xlsx, .xls) up to 25MB.
   - Real-time OCR and text/table parsing powered by PyMuPDF and Pandas.
   - Automated field normalization (dates, invoice numbers, tax rates, currency, amounts).
   - **Interactive Extracted Records Table**: Allows auditors to inspect, verify, and edit OCR fields directly in the browser before committing to transactions.

4. **Automated Transaction Matching & Reconciliation**
   - Multi-way cross-source matching (Invoices vs General Ledger, Bank Statements vs General Ledger).
   - Exact matching (100% amount, invoice #, and close date).
   - Fuzzy matching on vendor names using sequence similarity algorithms (>= 82%).
   - Classification of **Fully Matched**, **Partially Matched**, **Amount Mismatches**, and **Date Inconsistencies**.
   - Side-by-side reconciliation comparison with one-click auditor confirmation and rejection.

5. **Duplicate Payment & Invoice Detection**
   - Multi-factor duplicate detection (invoice number reuse, identical amount within 30-day window, matching transaction IDs).
   - Groups twin/triplet records together with explainable flag reasons.
   - Explicit safeguard: does not classify similar transactions as confirmed fraud without auditor review.

6. **Financial Discrepancy & Variance Analysis**
   - Identifies source-to-ledger amount differences, statutory tax calculation errors (deviations from standard 8% tax), and date timing anomalies.
   - Displays Expected Value, Actual Value, Difference Amount, and Risk Level (High, Medium, Low).
   - Dedicated auditor resolution dialog with resolution notes.

7. **Missing Documentation Surveillance**
   - Flags disbursements, expense claims, or ledger postings that lack mandatory primary evidence.
   - Allows auditors to attach uploaded evidence documents directly to transactions to resolve evidentiary gaps.

8. **Machine Learning Anomaly Detection (Isolation Forest)**
   - Unsupervised Scikit-Learn `IsolationForest` model trained on expenditure volume, vendor z-scores, velocity, and weekend/off-cycle timing.
   - Generates normalized Anomaly Scores (0 to 100) and explainable narrative factors (e.g., *"Amount is 4.8 standard deviations above vendor historical average; processed on Sunday"*).
   - Interactive scatter plot mapping anomaly scores against transaction values.
   - Forensic disposition recording (`legitimate`, `suspicious`, `confirmed_fraud`).

9. **Vendor Spend & Risk Analytics**
   - Vendor risk ratings (`High`, `Medium`, `Low`) calculated from duplicate billing patterns, ledger discrepancies, and spend concentration.
   - Monthly spend velocity trends and historical voucher counts.

10. **Audit Report Generation Studio**
    - Synthesizes all audit findings into downloadable, professional multi-page PDF audit reports using ReportLab.
    - Includes executive summary metrics, discrepancy tables, ML anomaly summaries, auditor comments, and formal sign-off attestation blocks.
    - Prominently watermarked: *"AI-Generated Audit Draft — Subject to Final Auditor Review"*.

11. **Configurable Settings & Thresholds**
    - Customizable materiality amounts for high-risk ($25,000) and medium-risk ($5,000) thresholds.
    - Configurable Isolation Forest contamination ratio and fuzzy similarity threshold.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Vite |
| **Backend** | Python 3.12, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic |
| **Database** | SQLite (Zero-config local setup) / PostgreSQL compatible via `DATABASE_URL` |
| **AI / Machine Learning** | Scikit-Learn (`IsolationForest`), NumPy, Pandas |
| **Document Processing** | PyMuPDF (`fitz`), PyPDF, OpenPyXL, ReportLab |
| **Security & Auth** | Python-Jose (JWT), Bcrypt, OAuth2 Bearer Tokens |

---

## Quick Start & Execution

### 1. Fast Launch (Windows)

Double-click or run:
```powershell
.\start_all.bat
```
This automatically starts:
- **Backend API**: `http://127.0.0.1:8000` (Swagger Docs: `http://127.0.0.1:8000/docs`)
- **Frontend App**: `http://127.0.0.1:5173`

Alternatively, launch them in separate terminals:

#### Start Backend:
```powershell
.\start_backend.bat
# Or manually:
cd backend
python run.py
```

#### Start Frontend:
```powershell
.\start_frontend.bat
# Or manually:
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## Default Demo Credentials

The database comes pre-seeded with 160 realistic transactions across 12 vendors, intentional duplicates, discrepancies, anomalies, and sample files.

| Role | Email | Password |
|---|---|---|
| **Lead Audit Partner (Admin)** | `admin@finaudit.ai` | `AdminPass123!` |
| **Forensic Auditor** | `auditor@finaudit.ai` | `AuditorPass123!` |

*(Both accounts are accessible with one click directly from the Login page)*

---

## Testing the Document Upload & OCR Pipeline

FinAudit AI includes generated sample test files ready for testing:
1. In the top navigation bar, click **Test Sample Documents**.
2. Download any of the sample files:
   - `sample_invoice_cloudscale.pdf` (Real formatted PDF Invoice with line items)
   - `sample_bank_statement_q4.csv` (CSV bank ledger with debit/credit entries)
   - `sample_general_ledger.xlsx` (Excel workbook with GL posting rows)
3. Navigate to **Documents**, select the document category, and drag-and-drop the downloaded file.
4. Watch the real-time OCR progress, view the parsed fields, and click **Inspect OCR** to verify or edit extracted data!

---

## Machine Learning & AI Design

- **Deterministic Rule Engines**: Used for arithmetic calculations, tax rate validation, date consistency checks, and sequence similarity matching. No LLM hallucinations on calculations.
- **Isolation Forest Model**: Scikit-Learn unsupervised ensemble that measures tree depth isolation across feature vectors (log-amount, vendor z-score, global z-score, weekend indicators, day-of-week).
- **LLM Summary Integration**: Generates natural-language executive audit commentary with an intelligent offline deterministic fallback.

---

## System Architecture

```
Project F ai/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, dashboard, docs, txs, matching, anomalies...)
│   │   ├── models/          # SQLAlchemy relational database models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Extractor, matching, duplicate, anomaly, report services
│   │   ├── sample_data/     # Realistic 160+ transaction generator & test documents
│   │   ├── config.py        # Configuration & risk threshold settings
│   │   ├── database.py      # SQLAlchemy session & engine setup
│   │   └── main.py          # FastAPI application & router initialization
│   ├── run.py               # Uvicorn server launcher
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Typed API client
│   │   ├── components/      # Sidebar, Navbar, MetricCard, StatusBadge, Modal
│   │   ├── context/         # AuthContext & ToastContext
│   │   ├── pages/           # 11 modules: Dashboard, Documents, Matching, Anomalies...
│   │   ├── types/           # TypeScript interfaces
│   │   └── App.tsx          # Master router
│   ├── tailwind.config.js
│   └── package.json
├── start_all.bat            # One-click dual launcher
├── start_backend.bat        # Backend runner
└── start_frontend.bat       # Frontend runner
```

---

FinAudit AI demonstrates how modern artificial intelligence and machine learning can drastically reduce audit cycle times while keeping final verification and assurance decisions under human supervisor control.
