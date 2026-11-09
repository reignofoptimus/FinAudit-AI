import os
from datetime import datetime, timedelta
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from app.config import settings

def generate_sample_pdf_invoice(dest_path: str):
    doc = SimpleDocTemplate(dest_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('InvTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=22, textColor=colors.HexColor('#0f172a'))
    normal_style = ParagraphStyle('InvNormal', parent=styles['Normal'], fontName='Helvetica', fontSize=9, textColor=colors.HexColor('#334155'))
    bold_style = ParagraphStyle('InvBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#0f172a'))
    
    story = []
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 10))
    
    meta_data = [
        [Paragraph("<b>From:</b><br/>CloudScale Solutions Inc.<br/>100 Enterprise Way, Suite 400<br/>San Jose, CA 95110<br/>tax@cloudscale.io", normal_style),
         Paragraph("<b>Billed To:</b><br/>Acme Global Enterprise<br/>500 Corporate Blvd<br/>New York, NY 10001<br/>accounts@acmeglobal.com", normal_style)],
        [Paragraph("<b>Invoice Number:</b> INV-2024-8841<br/><b>Transaction ID:</b> TXN-994120<br/><b>Payment Method:</b> ACH Wire", normal_style),
         Paragraph("<b>Invoice Date:</b> October 14, 2024<br/><b>Due Date:</b> November 14, 2024<br/><b>Account:</b> Routing: 021000021 / Acct: 9482104", normal_style)]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(meta_table)
    story.append(Spacer(1, 20))
    
    # Items
    items_data = [
        [Paragraph("Description", bold_style), Paragraph("Quantity", bold_style), Paragraph("Unit Price", bold_style), Paragraph("Amount", bold_style)],
        [Paragraph("Enterprise Cloud Infrastructure - Q3 Tier 1 Hosting", normal_style), Paragraph("1", normal_style), Paragraph("$18,500.00", normal_style), Paragraph("$18,500.00", normal_style)],
        [Paragraph("Dedicated VPC Peering & High-Availability Mesh", normal_style), Paragraph("1", normal_style), Paragraph("$4,200.00", normal_style), Paragraph("$4,200.00", normal_style)],
        [Paragraph("24/7 Enterprise Tier SRE Support & Monitoring", normal_style), Paragraph("1", normal_style), Paragraph("$2,300.00", normal_style), Paragraph("$2,300.00", normal_style)],
        [Paragraph("Subtotal", bold_style), Paragraph("", normal_style), Paragraph("", normal_style), Paragraph("$25,000.00", bold_style)],
        [Paragraph("Sales Tax (8%)", bold_style), Paragraph("", normal_style), Paragraph("", normal_style), Paragraph("$2,000.00", bold_style)],
        [Paragraph("Total Amount Due", bold_style), Paragraph("", normal_style), Paragraph("", normal_style), Paragraph("$27,000.00", bold_style)]
    ]
    items_table = Table(items_data, colWidths=[280, 70, 95, 95])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#e2e8f0'))
    ]))
    story.append(items_table)
    doc.build(story)

def generate_sample_bank_csv(dest_path: str):
    rows = [
        {"Date": "2024-10-15", "Reference": "TXN-994120", "Description": "ACH Outward: CloudScale Solutions Inc.", "Amount": -27000.00, "Balance": 348200.50},
        {"Date": "2024-10-16", "Reference": "TXN-881290", "Description": "Wire Transfer: Delta Logistics Corp", "Amount": -14250.00, "Balance": 333950.50},
        {"Date": "2024-10-18", "Reference": "TXN-773120", "Description": "Direct Debit: Metro Facilities Services", "Amount": -6400.00, "Balance": 327550.50},
        {"Date": "2024-10-20", "Reference": "TXN-552199", "Description": "Customer Deposit: Vertex Systems Payment", "Amount": 85000.00, "Balance": 412550.50},
        {"Date": "2024-10-22", "Reference": "TXN-442110", "Description": "Check #4891: Prime Telecom Backbone", "Amount": -3850.00, "Balance": 408700.50},
        {"Date": "2024-10-24", "Reference": "TXN-331209", "Description": "Wire: CyberShield Security Audit", "Amount": -19800.00, "Balance": 388900.50},
        {"Date": "2024-10-28", "Reference": "TXN-221094", "Description": "ACH Debit: Horizon Marketing Retainer", "Amount": -12500.00, "Balance": 376400.50},
        {"Date": "2024-10-30", "Reference": "TXN-110948", "Description": "Vendor Wire: Apex Office Supplies", "Amount": -2890.00, "Balance": 373510.50}
    ]
    df = pd.DataFrame(rows)
    df.to_csv(dest_path, index=False)

def generate_sample_ledger_excel(dest_path: str):
    rows = [
        {"Account_Code": "6010", "Account_Name": "Cloud Hosting", "Posting_Date": "2024-10-15", "Vendor": "CloudScale Solutions", "Invoice_Ref": "INV-2024-8841", "Debit": 27000.00, "Credit": 0.00, "Status": "Posted"},
        {"Account_Code": "6020", "Account_Name": "Freight & Logistics", "Posting_Date": "2024-10-16", "Vendor": "Delta Logistics", "Invoice_Ref": "INV-DL-4921", "Debit": 14250.00, "Credit": 0.00, "Status": "Posted"},
        {"Account_Code": "6030", "Account_Name": "Facilities & Maintenance", "Posting_Date": "2024-10-18", "Vendor": "Metro Facilities", "Invoice_Ref": "INV-MF-209", "Debit": 6400.00, "Credit": 0.00, "Status": "Posted"},
        {"Account_Code": "4010", "Account_Name": "Operating Revenue", "Posting_Date": "2024-10-20", "Vendor": "Vertex Systems", "Invoice_Ref": "INV-REC-891", "Debit": 0.00, "Credit": 85000.00, "Status": "Posted"},
        {"Account_Code": "6040", "Account_Name": "Telecommunications", "Posting_Date": "2024-10-22", "Vendor": "Prime Telecom", "Invoice_Ref": "INV-PT-994", "Debit": 3850.00, "Credit": 0.00, "Status": "Posted"},
        {"Account_Code": "6050", "Account_Name": "Information Security", "Posting_Date": "2024-10-24", "Vendor": "CyberShield Security", "Invoice_Ref": "INV-CS-582", "Debit": 19800.00, "Credit": 0.00, "Status": "Posted"},
        {"Account_Code": "6060", "Account_Name": "Advertising & PR", "Posting_Date": "2024-10-28", "Vendor": "Horizon Marketing", "Invoice_Ref": "INV-HM-831", "Debit": 12500.00, "Credit": 0.00, "Status": "Posted"},
        {"Account_Code": "6070", "Account_Name": "Office Supplies", "Posting_Date": "2024-10-30", "Vendor": "Apex Office Supplies", "Invoice_Ref": "INV-AO-109", "Debit": 2890.00, "Credit": 0.00, "Status": "Posted"}
    ]
    df = pd.DataFrame(rows)
    with pd.ExcelWriter(dest_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="General_Ledger_Q4", index=False)

def create_all_sample_files():
    os.makedirs(settings.SAMPLE_DIR, exist_ok=True)
    pdf_path = os.path.join(settings.SAMPLE_DIR, "sample_invoice_cloudscale.pdf")
    csv_path = os.path.join(settings.SAMPLE_DIR, "sample_bank_statement_q4.csv")
    xlsx_path = os.path.join(settings.SAMPLE_DIR, "sample_general_ledger.xlsx")

    if not os.path.exists(pdf_path):
        generate_sample_pdf_invoice(pdf_path)
    if not os.path.exists(csv_path):
        generate_sample_bank_csv(csv_path)
    if not os.path.exists(xlsx_path):
        generate_sample_ledger_excel(xlsx_path)

if __name__ == "__main__":
    create_all_sample_files()
