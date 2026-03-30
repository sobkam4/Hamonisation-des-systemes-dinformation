from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from django.utils import timezone
from datetime import datetime

def generer_contrat_pdf(contrat, client, bien):
    """Génère un PDF de contrat de location"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Style pour le titre
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER,
    )
    
    # Style pour les sections
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=12,
    )
    
    # Titre
    story.append(Paragraph("CONTRAT DE LOCATION", title_style))
    story.append(Spacer(1, 20))
    
    # Informations du contrat
    story.append(Paragraph(f"<b>Référence:</b> {contrat.reference or f'CTR-{contrat.id}'}", styles['Normal']))
    story.append(Paragraph(f"<b>Date de création:</b> {contrat.date_creation.strftime('%d/%m/%Y') if hasattr(contrat, 'date_creation') else timezone.now().strftime('%d/%m/%Y')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Parties
    story.append(Paragraph("<b>ENTRE LES SOUSSIGNÉS:</b>", heading_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>LE PROPRIÉTAIRE (BAILLEUR):</b>", styles['Normal']))
    story.append(Paragraph("Représenté par l'ERP Location Immobilière", styles['Normal']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>LE LOCATAIRE (PRENANT):</b>", styles['Normal']))
    story.append(Paragraph(f"<b>Nom:</b> {client.prenom} {client.nom}", styles['Normal']))
    story.append(Paragraph(f"<b>Email:</b> {client.email}", styles['Normal']))
    story.append(Paragraph(f"<b>Téléphone:</b> {client.telephone}", styles['Normal']))
    if client.adresse:
        story.append(Paragraph(f"<b>Adresse:</b> {client.adresse}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Bien loué
    story.append(Paragraph("<b>BIEN LOUÉ:</b>", heading_style))
    story.append(Paragraph(f"<b>Nom:</b> {bien.nom}", styles['Normal']))
    story.append(Paragraph(f"<b>Type:</b> {bien.get_type_bien_display() if hasattr(bien, 'get_type_bien_display') else bien.type_bien}", styles['Normal']))
    story.append(Paragraph(f"<b>Adresse:</b> {bien.adresse}", styles['Normal']))
    if hasattr(bien, 'superficie') and bien.superficie:
        story.append(Paragraph(f"<b>Superficie:</b> {bien.superficie} m²", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Conditions de location
    story.append(Paragraph("<b>CONDITIONS DE LOCATION:</b>", heading_style))
    
    data = [
        ['Durée', f"Du {contrat.date_debut.strftime('%d/%m/%Y')} au {contrat.date_fin.strftime('%d/%m/%Y')}"],
        ['Loyer mensuel', f"{contrat.montant_mensuel:,.0f} GNF"],
        ['Caution', f"{contrat.caution:,.0f} GNF"],
        ['Statut', contrat.get_statut_display() if hasattr(contrat, 'get_statut_display') else contrat.statut],
    ]
    
    table = Table(data, colWidths=[5*cm, 12*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    
    story.append(table)
    story.append(Spacer(1, 30))
    
    # Conditions générales
    story.append(Paragraph("<b>CONDITIONS GÉNÉRALES:</b>", heading_style))
    story.append(Paragraph("1. Le locataire s'engage à payer le loyer mensuellement à la date convenue.", styles['Normal']))
    story.append(Paragraph("2. Le locataire s'engage à maintenir le bien en bon état.", styles['Normal']))
    story.append(Paragraph("3. Toute modification du bien nécessite l'accord préalable du propriétaire.", styles['Normal']))
    story.append(Spacer(1, 30))
    
    # Signatures
    story.append(Paragraph("<b>SIGNATURES:</b>", heading_style))
    story.append(Spacer(1, 40))
    story.append(Paragraph("Le Propriétaire", styles['Normal']))
    story.append(Spacer(1, 60))
    story.append(Paragraph("Le Locataire", styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def generer_quittance_pdf(paiement, contrat, client, bien):
    """Génère une quittance de loyer en PDF"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER,
    )
    
    # Titre
    story.append(Paragraph("QUITTANCE DE LOYER", title_style))
    story.append(Spacer(1, 20))
    
    # Informations
    story.append(Paragraph(f"<b>Référence paiement:</b> {paiement.reference}", styles['Normal']))
    story.append(Paragraph(f"<b>Date d'émission:</b> {timezone.now().strftime('%d/%m/%Y')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Locataire
    story.append(Paragraph("<b>REÇU DE:</b>", styles['Heading2']))
    story.append(Paragraph(f"{client.prenom} {client.nom}", styles['Normal']))
    story.append(Paragraph(f"{client.email}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Bien
    story.append(Paragraph("<b>POUR LE BIEN:</b>", styles['Heading2']))
    story.append(Paragraph(f"{bien.nom} - {bien.adresse}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Détails du paiement
    story.append(Paragraph("<b>DÉTAILS DU PAIEMENT:</b>", styles['Heading2']))
    
    data = [
        ['Mois payé', paiement.mois_paye or f"{paiement.date_paiement.strftime('%m/%Y')}"],
        ['Montant', f"{paiement.montant:,.0f} GNF"],
        ['Date de paiement', paiement.date_paiement.strftime('%d/%m/%Y')],
        ['Type de paiement', paiement.get_type_paiement_display() if hasattr(paiement, 'get_type_paiement_display') else paiement.type_paiement],
        ['Statut', paiement.get_statut_display() if hasattr(paiement, 'get_statut_display') else paiement.statut],
    ]
    
    table = Table(data, colWidths=[5*cm, 12*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    
    story.append(table)
    story.append(Spacer(1, 30))
    
    # Signature
    story.append(Paragraph("<b>Signature:</b>", styles['Normal']))
    story.append(Spacer(1, 40))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def generer_recu_pdf(paiement, contrat, client):
    """Génère un reçu de paiement en PDF"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#059669'),
        spaceAfter=30,
        alignment=TA_CENTER,
    )
    
    # Titre
    story.append(Paragraph("REÇU DE PAIEMENT", title_style))
    story.append(Spacer(1, 20))
    
    # Informations
    story.append(Paragraph(f"<b>Référence:</b> {paiement.reference}", styles['Normal']))
    story.append(Paragraph(f"<b>Date:</b> {paiement.date_paiement.strftime('%d/%m/%Y')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph(f"<b>Reçu de:</b> {client.prenom} {client.nom}", styles['Normal']))
    story.append(Paragraph(f"<b>Montant:</b> {paiement.montant:,.0f} GNF", styles['Normal']))
    story.append(Paragraph(f"<b>Type:</b> {paiement.get_type_paiement_display() if hasattr(paiement, 'get_type_paiement_display') else paiement.type_paiement}", styles['Normal']))
    
    if paiement.notes:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Notes:</b> {paiement.notes}", styles['Normal']))
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("Merci pour votre paiement.", styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
