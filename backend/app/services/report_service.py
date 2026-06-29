import io
from datetime import datetime
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# MITRE ATT&CK Mapping matrix based on analysis classification
MITRE_MAPPINGS = {
    "phishing": [
        {"id": "T1566", "name": "Phishing", "tactic": "Initial Access", "description": "Adversaries may send phishing messages to gain access to victim systems."},
        {"id": "T1204.001", "name": "User Execution: Malicious Link", "tactic": "Execution", "description": "Adversaries may rely on users clicking links to trigger execution."}
    ],
    "malware": [
        {"id": "T1204.002", "name": "User Execution: Malicious File", "tactic": "Execution", "description": "Adversaries may rely on users opening files to trigger execution."},
        {"id": "T1574", "name": "Hijack Execution Flow", "tactic": "Persistence / Privilege Escalation", "description": "Adversaries may execute malicious payloads by hijacking how operating systems run programs."}
    ],
    "network_anomaly": [
        {"id": "T1046", "name": "Network Service Scanning", "tactic": "Discovery", "description": "Adversaries may attempt to list network services to find vulnerabilites."},
        {"id": "T1498", "name": "Network Denial of Service", "tactic": "Impact", "description": "Adversaries may jam network links to degrade availability."}
    ],
    "generic_security": [
        {"id": "T1566", "name": "Phishing", "tactic": "Initial Access", "description": "General threat vectors."},
        {"id": "T1204", "name": "User Execution", "tactic": "Execution", "description": "Execution patterns."}
    ]
}


def get_mitre_techniques(analysis_type: str) -> list:
    """Return mapped MITRE ATT&CK techniques for a threat category."""
    return MITRE_MAPPINGS.get(analysis_type, [])


def generate_incident_pdf(
    analysis_record: Dict[str, Any], 
    doc_info: Optional[Dict[str, Any]] = None
) -> bytes:
    """
    Generates a beautifully styled ReportLab PDF containing threat analytics, 
    risk scores, MITRE ATT&CK alignment, and analyst playbooks.
    """
    buffer = io.BytesIO()
    
    # Page setup
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )
    
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0F172A'), # Charcoal / Navy slate
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=25
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1E3A8A'), # Navy Blue
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#334155'),
        leading=14,
        spaceAfter=10
    )
    
    # Title & Metadata
    story.append(Paragraph("MANTRA Security Incident Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC", subtitle_style))
    story.append(Spacer(1, 0.1 * inch))
    
    # Summary Table setup
    class_color = '#10B981' # Benign green
    if analysis_record['classification'] == 'malicious':
        class_color = '#EF4444' # Threat red
    elif analysis_record['classification'] == 'suspicious':
        class_color = '#F59E0B' # Suspicious orange
        
    summary_data = [
        [
            Paragraph("<b>Incident Details</b>", ParagraphStyle('H3', parent=styles['Normal'], fontSize=11, textColor=colors.white)), 
            ""
        ],
        ["Target Document:", doc_info['filename'] if doc_info else "Manual Feature Input"],
        ["Scan Category:", analysis_record['analysis_type'].upper().replace("_", " ")],
        ["Threat Level:", f"<font color='{class_color}'><b>{analysis_record['classification'].upper()}</b></font>"],
        ["Risk Assessment Score:", f"<b>{analysis_record.get('risk_score', 0)} / 100</b>"],
        ["Inference Confidence:", f"{round(analysis_record.get('confidence_score', 0.0) * 100, 2)}%"],
    ]
    
    summary_table = Table(summary_data, colWidths=[180, 320])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
        ('SPAN', (0, 0), (1, 0)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.25 * inch))
    
    # Explainability details
    story.append(Paragraph("Model Prediction Attributions (SHAP)", h2_style))
    story.append(Paragraph(
        "The following parameters contributed most to the ML threat classifier classification output:", 
        body_style
    ))
    
    details = analysis_record.get("predictions_details", {})
    explanations = details.get("explanations", {})
    
    if explanations:
        expl_data = [["Feature Name", "Attribution Weight (Impact strength)"]]
        for feat, weight in explanations.items():
            dir_str = "Elevates Risk (+)" if weight > 0 else "Reduces Risk (-)"
            expl_data.append([feat, f"{weight:+.4f} ({dir_str})"])
            
        expl_table = Table(expl_data, colWidths=[220, 280])
        expl_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#64748B')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        story.append(expl_table)
    else:
        story.append(Paragraph("No prediction feature details available.", body_style))
        
    story.append(Spacer(1, 0.25 * inch))
    
    # MITRE ATT&CK Mapping
    story.append(Paragraph("MITRE ATT&CK Techniques Alignment", h2_style))
    mitre_techs = get_mitre_techniques(analysis_record['analysis_type'])
    
    if mitre_techs:
        for tech in mitre_techs:
            story.append(Paragraph(f"<b>{tech['id']}: {tech['name']}</b>", ParagraphStyle('M1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=2)))
            story.append(Paragraph(f"<i>Tactic: {tech['tactic']}</i>", ParagraphStyle('M2', parent=styles['Normal'], fontSize=8.5, textColor=colors.HexColor('#475569'), spaceAfter=2)))
            story.append(Paragraph(tech['description'], ParagraphStyle('M3', parent=styles['Normal'], fontSize=9, spaceAfter=8)))
    else:
        story.append(Paragraph("No direct MITRE mapping registered for this type.", body_style))
        
    story.append(Spacer(1, 0.2 * inch))
    
    # Playbook / Response Guidance
    story.append(Paragraph("Security Response Playbook Guidelines", h2_style))
    
    playbook_text = "Perform standard operations verification."
    if analysis_record['classification'] == 'malicious':
        if analysis_record['analysis_type'] == 'phishing':
            playbook_text = (
                "1. Isolate the target mailbox and revoke active user OAuth tokens.\n"
                "2. Purge the suspicious email message from the entire organization exchange directory.\n"
                "3. Flag the parsed URL links inside firewall blocklists to prevent user clicks."
            )
        elif analysis_record['analysis_type'] == 'malware':
            playbook_text = (
                "1. Quarantine the affected host machine immediately to prevent lateral network movement.\n"
                "2. Submit the binary signature (hashes) to endpoint detection agents (EDR).\n"
                "3. Perform memory scans on hosts displaying identical DLL imports."
            )
        elif analysis_record['analysis_type'] == 'network_anomaly':
            playbook_text = (
                "1. Deploy dynamic ingress firewall rules to drop packets originating from anomalous external ports.\n"
                "2. Inspect active routing tables for indicators of tunneling protocols.\n"
                "3. Restrict host subnets to secure VLAN boundaries."
            )
    else:
        playbook_text = (
            "No urgent response playbook actions required. Incident is logged as benign. "
            "Continue passive monitoring of security loops."
        )
        
    story.append(Paragraph(playbook_text.replace("\n", "<br/>"), body_style))
    
    # Page template compile
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
