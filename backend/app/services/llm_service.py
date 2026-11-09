import os
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings

def call_external_llm(prompt: str) -> Optional[str]:
    # 1. Try Gemini if configured
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600}
            }
            res = httpx.post(url, json=payload, timeout=12.0)
            if res.status_code == 200:
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass

    # 2. Try OpenAI if configured
    if settings.OPENAI_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are FinAudit AI, an expert Senior Financial Auditor delivering concise, factual, explainable audit commentary."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 500
            }
            res = httpx.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=12.0)
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

    return None

def generate_audit_executive_summary(stats: Dict[str, Any]) -> str:
    total_tx = stats.get("total_transactions", 0)
    discrepancies = stats.get("total_discrepancies", 0)
    duplicates = stats.get("total_duplicates", 0)
    missing = stats.get("total_missing_docs", 0)
    anomalies = stats.get("total_anomalies", 0)
    high_risk = stats.get("high_risk_count", 0)
    total_spend = stats.get("total_spend", 0.0)

    prompt = (
        f"You are a Senior Financial Auditor. Write a formal 3-paragraph executive audit observation based on these audit statistics:\n"
        f"- Analyzed Transactions: {total_tx} totalling ${total_spend:,.2f}\n"
        f"- Document/Ledger Discrepancies: {discrepancies}\n"
        f"- Potential Duplicate Payments: {duplicates}\n"
        f"- Missing Supporting Documents: {missing}\n"
        f"- Machine Learning Outliers/Anomalies: {anomalies}\n"
        f"- High-Risk Critical Findings: {high_risk}\n\n"
        f"Summarize the overall financial controls posture, highlight key risk concentrations, and recommend actionable remediation steps."
    )

    llm_output = call_external_llm(prompt)
    if llm_output:
        return llm_output

    # Intelligent deterministic fallback
    risk_adjective = "elevated" if high_risk > 3 else "moderate" if (discrepancies + duplicates) > 3 else "satisfactory"
    return (
        f"EXECUTIVE AUDIT SUMMARY:\n\n"
        f"An automated examination was executed on {total_tx:,} financial records with a cumulative transaction volume of ${total_spend:,.2f}. "
        f"The algorithmic analysis identified {discrepancies} ledger/billing discrepancies, {duplicates} potential duplicate payment groups, "
        f"{missing} transactions lacking mandatory primary supporting documentation, and {anomalies} statistical outliers detected by the Isolation Forest model. "
        f"Overall risk exposure is assessed as {risk_adjective.upper()} with {high_risk} critical findings requiring direct auditor intervention.\n\n"
        f"PRIMARY RISK DRIVERS:\n"
        f"The dominant compliance liabilities stem from timing mismatches and amount variances between invoice billings and general ledger postings, "
        f"compounded by unattached vendor vouchers in high-value disbursements. Vendors exhibiting repetitive duplicate billing patterns present direct cash-leakage exposure.\n\n"
        f"AUDITOR RECOMMENDATION:\n"
        f"1. Freeze payment approvals on flagged duplicate vouchers pending vendor credit notes.\n"
        f"2. Enforce mandatory invoice attachment rules before journal clearance for transactions exceeding $5,000.\n"
        f"3. Reconcile tax calculation variances against statutory state/federal schedules before fiscal close."
    )

def explain_finding_ai(finding_type: str, details: Dict[str, Any]) -> str:
    prompt = f"Provide a brief 2-sentence auditor explanation for this financial finding: Type: {finding_type}. Details: {details}."
    llm_output = call_external_llm(prompt)
    if llm_output:
        return llm_output

    if finding_type == "discrepancy":
        return f"Identified variance between source document and general ledger. Expected {details.get('expected')}, but found {details.get('actual')}. This may indicate unauthorized billing amendments, posting errors, or unapplied credit deductions."
    elif finding_type == "duplicate":
        return f"Multiple transactions exhibit identical invoice references, amounts, and vendor identifiers. This represents an active risk of duplicate cash disbursement requiring dual-signoff verification."
    elif finding_type == "anomaly":
        return f"Transaction deviates significantly from baseline spending distribution and historical vendor averages. Requires evidentiary review to verify business justification."
    elif finding_type == "missing_document":
        return f"Transaction recorded without requisite supporting documentation (invoice/receipt). Non-compliant with standard internal accounting controls."
    return "Audit finding flagged by system rules for auditor review."
