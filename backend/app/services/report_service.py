import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch
from app.config import settings
from app.services.llm_service import generate_audit_executive_summary

def generate_pdf_report(
    report_id: int,
    company_name: str,
    audit_period: str,
    stats: Dict[str, Any],
    discrepancies: List[Dict[str, Any]],
    duplicates: List[Dict[str, Any]],
    anomalies: List[Dict[str, Any]],
    missing_docs: List[Dict[str, Any]],
    auditor_comments: Optional[str] = None
) -> str:
    filename = f"audit_report_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    file_path = os.path.join(settings.REPORT_DIR, filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#b45309'),
        alignment=1 # Center
    )
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("FINAUDIT AI — COMPREHENSIVE AUDIT REPORT", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Client / Entity: <b>{company_name}</b> | Audit Period: <b>{audit_period}</b> | Generated: <b>{datetime.now().strftime('%B %d, %Y - %H:%M UTC')}</b>", subtitle_style))
    story.append(Spacer(1, 8))

    # Disclaimer Callout Box
    disclaimer_p = Paragraph(
        "CONFIDENTIAL AUDIT DOCUMENT — PREPARED BY FINAUDIT AI ASSISTANT<br/>"
        "This report is an AI-generated draft synthesized from automated document parsing and machine learning anomaly detection. "
        "Final audit verification and regulatory attestations remain subject to certified human auditor supervision.",
        disclaimer_style
    )
    disc_table = Table([[disclaimer_p]], colWidths=[540])
    disc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef3c7')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#f59e0b')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(disc_table)
    story.append(Spacer(1, 12))

    # Executive Summary Metrics Grid
    story.append(Paragraph("1. Executive Audit Overview & Control Metrics", h2_style))
    metrics_data = [
        [
            Paragraph("<b>Total Transactions:</b>", body_style), Paragraph(f"{stats.get('total_transactions', 0):,}", body_style),
            Paragraph("<b>Total Expenditure:</b>", body_style), Paragraph(f"${stats.get('total_spend', 0.0):,.2f}", body_style),
        ],
        [
            Paragraph("<b>Documents Analyzed:</b>", body_style), Paragraph(f"{stats.get('total_documents', 0)}", body_style),
            Paragraph("<b>Audit Control Health:</b>", body_style), Paragraph(f"{stats.get('audit_health_score', 84):.1f}%", body_style),
        ],
        [
            Paragraph("<b>Identified Discrepancies:</b>", body_style), Paragraph(f"<font color='#dc2626'><b>{stats.get('total_discrepancies', 0)}</b></font>", body_style),
            Paragraph("<b>Duplicate Invoices/Payments:</b>", body_style), Paragraph(f"<font color='#d97706'><b>{stats.get('total_duplicates', 0)}</b></font>", body_style),
        ],
        [
            Paragraph("<b>Missing Supporting Docs:</b>", body_style), Paragraph(f"{stats.get('total_missing_docs', 0)}", body_style),
            Paragraph("<b>ML Anomaly Outliers:</b>", body_style), Paragraph(f"<font color='#dc2626'><b>{stats.get('total_anomalies', 0)}</b></font>", body_style),
        ]
    ]
    metrics_table = Table(metrics_data, colWidths=[140, 130, 140, 130])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 10))

    # AI Executive Narrative
    story.append(Paragraph("2. Auditor Commentary & Risk Observations", h2_style))
    summary_text = generate_audit_executive_summary(stats)
    for para in summary_text.split("\n\n"):
        if para.strip():
            story.append(Paragraph(para.replace("\n", "<br/>"), body_style))
            story.append(Spacer(1, 4))

    if auditor_comments:
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>Specific Auditor Notes:</b> {auditor_comments}", body_style))
    story.append(Spacer(1, 10))

    # Discrepancies Table
    if discrepancies:
        story.append(Paragraph("3. Material Discrepancies (Document vs Ledger)", h2_style))
        disc_rows = [[
            Paragraph("Tx ID", table_header_style),
            Paragraph("Discrepancy Type", table_header_style),
            Paragraph("Expected", table_header_style),
            Paragraph("Actual", table_header_style),
            Paragraph("Variance", table_header_style),
            Paragraph("Risk", table_header_style),
        ]]
        for d in discrepancies[:8]:
            risk_color = "#dc2626" if d.get("risk_level") == "high" else "#d97706"
            disc_rows.append([
                Paragraph(f"#{d.get('transaction_id')}", table_cell_style),
                Paragraph(str(d.get("discrepancy_type")).replace("_", " ").title(), table_cell_style),
                Paragraph(str(d.get("expected_value")), table_cell_style),
                Paragraph(str(d.get("actual_value")), table_cell_style),
                Paragraph(f"${d.get('difference_amount', 0.0):,.2f}", table_cell_style),
                Paragraph(f"<font color='{risk_color}'><b>{str(d.get('risk_level')).upper()}</b></font>", table_cell_style),
            ])
        disc_tbl = Table(disc_rows, colWidths=[45, 120, 105, 105, 80, 85])
        disc_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(disc_tbl)
        story.append(Spacer(1, 10))

    # Machine Learning Outliers Table
    if anomalies:
        story.append(Paragraph("4. Machine Learning Anomaly Detection (Isolation Forest)", h2_style))
        anom_rows = [[
            Paragraph("Tx ID", table_header_style),
            Paragraph("Vendor", table_header_style),
            Paragraph("Amount", table_header_style),
            Paragraph("Score", table_header_style),
            Paragraph("Key Algorithmic Factors", table_header_style),
        ]]
        for a in anomalies[:6]:
            tx = a.get("transaction") or {}
            anom_rows.append([
                Paragraph(f"#{a.get('transaction_id')}", table_cell_style),
                Paragraph(tx.get("vendor_name", "N/A")[:20], table_cell_style),
                Paragraph(f"${tx.get('amount', 0.0):,.2f}", table_cell_style),
                Paragraph(f"<b>{a.get('anomaly_score', 0):.1f}</b>", table_cell_style),
                Paragraph(str(a.get("anomaly_factors", ""))[:140], table_cell_style),
            ])
        anom_tbl = Table(anom_rows, colWidths=[45, 110, 75, 50, 260])
        anom_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(anom_tbl)
        story.append(Spacer(1, 12))

    # Auditor Verification & Sign-Off Section
    story.append(Paragraph("5. Audit Attestation & Sign-off", h2_style))
    sign_data = [
        [
            Paragraph("<b>Lead Auditor:</b> ___________________________", body_style),
            Paragraph("<b>Review Date:</b> ___________________________", body_style)
        ],
        [
            Paragraph("<b>Audit Status:</b> [  ] Approved  [  ] Conditional  [  ] Follow-up", body_style),
            Paragraph("<b>Signature:</b> ___________________________", body_style)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[270, 270])
    sign_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sign_table)

    # Build PDF
    doc.build(story)
    return file_path
