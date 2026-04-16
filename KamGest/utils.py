import json
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def format_invoice_date(value):
    if not value:
        return ""

    if timezone.is_aware(value):
        value = timezone.localtime(value)

    return value.strftime("%d/%m/%Y")


def format_log_datetime(value):
    if not value:
        return ""
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    return value.strftime("%d/%m/%Y %H:%M")


def _truncate_text(text, max_len):
    s = str(text) if text is not None else ""
    if len(s) <= max_len:
        return s
    return s[: max_len - 3] + "..."


def generate_activity_logs_pdf(logs):
    """Construit un PDF du journal d'activites (QuerySet ou liste d'ActivityLog)."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
    )
    styles = getSampleStyleSheet()
    company_name = getattr(settings, "INVOICE_COMPANY_NAME", "KamGestion")

    title_style = ParagraphStyle(
        "LogTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor("#111827"),
    )
    company_style = ParagraphStyle(
        "LogCompany",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#374151"),
        spaceAfter=4,
    )
    meta_style = ParagraphStyle(
        "LogMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#6b7280"),
        spaceAfter=10,
    )
    cell_header = ParagraphStyle(
        "LogCellHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        textColor=colors.HexColor("#111827"),
        leading=9,
    )
    cell_body = ParagraphStyle(
        "LogCellBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        textColor=colors.HexColor("#111827"),
        leading=9,
    )

    elements = []
    elements.append(Paragraph(company_name, company_style))
    elements.append(Paragraph("Journal d'activites", title_style))
    elements.append(
        Paragraph(
            f"Genere le {format_log_datetime(timezone.now())}",
            meta_style,
        )
    )
    elements.append(Spacer(1, 6))

    table_rows = [
        [
            Paragraph("Date / heure", cell_header),
            Paragraph("Utilisateur", cell_header),
            Paragraph("Action", cell_header),
            Paragraph("Entite", cell_header),
            Paragraph("Description", cell_header),
            Paragraph("Meta", cell_header),
        ]
    ]

    for log in logs:
        username = log.user.username if log.user else "-"
        entity = log.entity_type or "-"
        if log.entity_id:
            entity = f"{entity} #{log.entity_id}"
        meta_raw = json.dumps(log.metadata, ensure_ascii=True) if log.metadata else ""
        table_rows.append(
            [
                Paragraph(_escape_xml(format_log_datetime(log.created_at)), cell_body),
                Paragraph(_escape_xml(_truncate_text(username, 24)), cell_body),
                Paragraph(_escape_xml(_truncate_text(log.action, 28)), cell_body),
                Paragraph(_escape_xml(_truncate_text(entity, 22)), cell_body),
                Paragraph(_escape_xml(_truncate_text(log.description, 120)), cell_body),
                Paragraph(_escape_xml(_truncate_text(meta_raw, 80)), cell_body),
            ]
        )

    content_w = 210 * mm - 24 * mm
    fixed_w = 26 * mm + 26 * mm + 30 * mm + 28 * mm + 22 * mm
    col_widths = [
        26 * mm,
        26 * mm,
        30 * mm,
        28 * mm,
        content_w - fixed_w,
        22 * mm,
    ]

    log_table = Table(table_rows, colWidths=col_widths, repeatRows=1)
    log_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#111827")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    elements.append(log_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer


def _escape_xml(text):
    """Echappe les caracteres speciaux pour Paragraph (mini-XML)."""
    s = str(text)
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def format_invoice_amount(amount, currency):
    value = Decimal(amount)
    has_decimals = value != value.quantize(Decimal("1"))

    if has_decimals:
        amount_text = f"{value:,.2f}"
    else:
        amount_text = f"{value:,.0f}"

    amount_text = amount_text.replace(",", " ").replace(".", ",")
    return f"{amount_text} {currency}"


def get_status_label(status):
    return {
        "draft": "Brouillon",
        "confirmed": "Confirmee",
        "delivered": "Livree",
        "cancelled": "Annulee",
    }.get(status, status)


def generate_invoice_pdf(order):
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=22 * mm,
        bottomMargin=20 * mm,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
    )
    styles = getSampleStyleSheet()
    company_name = getattr(settings, "INVOICE_COMPANY_NAME", "KamGestion")
    company_location = getattr(settings, "INVOICE_COMPANY_LOCATION", "Conakry, Guinee")

    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        alignment=TA_CENTER,
        leading=24,
        spaceAfter=4,
    )
    company_style = ParagraphStyle(
        "CompanyHeader",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#111827"),
        spaceAfter=2,
    )
    location_style = ParagraphStyle(
        "CompanyLocation",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#374151"),
        spaceAfter=10,
    )
    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=colors.HexColor("#111827"),
        spaceAfter=6,
    )
    normal_style = ParagraphStyle(
        "InvoiceNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        textColor=colors.HexColor("#111827"),
        leading=16,
    )
    strong_style = ParagraphStyle(
        "InvoiceStrong",
        parent=normal_style,
        fontName="Helvetica-Bold",
    )
    right_style = ParagraphStyle(
        "RightAligned",
        parent=normal_style,
        alignment=TA_RIGHT,
    )
    footer_style = ParagraphStyle(
        "InvoiceFooter",
        parent=styles["Italic"],
        fontName="Helvetica-Oblique",
        fontSize=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#374151"),
    )

    elements = []
    created_at = format_invoice_date(order.created_at)
    status_label = get_status_label(order.status)
    customer_name = order.customer.full_name
    delivery_address = order.delivery_address or order.customer.address or "-"

    elements.append(Paragraph(company_name, company_style))
    elements.append(Paragraph(company_location, location_style))
    elements.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#d1d5db")))
    elements.append(Spacer(1, 14))
    elements.append(Paragraph("FACTURE", title_style))
    elements.append(Spacer(1, 14))
    elements.append(Paragraph(f"Commande : {order.number}", normal_style))
    elements.append(Paragraph(f"Date : {created_at}", normal_style))
    elements.append(Spacer(1, 14))
    elements.append(Paragraph("Client", section_title_style))
    elements.append(Paragraph(customer_name, strong_style))
    elements.append(Paragraph(f"Adresse: {delivery_address}", normal_style))
    if order.customer.phone:
        elements.append(Paragraph(f"Telephone: {order.customer.phone}", normal_style))
    if order.customer.email:
        elements.append(Paragraph(f"Email: {order.customer.email}", normal_style))
    elements.append(Spacer(1, 16))

    table_rows = [
        [
            Paragraph("Description", strong_style),
            Paragraph("Quantite", right_style),
            Paragraph("Prix unitaire", right_style),
            Paragraph("Sous-total", right_style),
        ]
    ]

    for item in order.items.all():
        table_rows.append(
            [
                Paragraph(item.product_name, normal_style),
                Paragraph(str(item.quantity), right_style),
                Paragraph(format_invoice_amount(item.unit_price, order.currency), right_style),
                Paragraph(format_invoice_amount(item.subtotal, order.currency), right_style),
            ]
        )

    total_text = format_invoice_amount(order.total, order.currency)
    table_rows.append(
        [
            Paragraph("<b>Total a payer :</b>", right_style),
            Paragraph("", right_style),
            Paragraph("", right_style),
            Paragraph(f"<b>{total_text}</b>", right_style),
        ]
    )

    invoice_table = Table(table_rows, colWidths=[82 * mm, 22 * mm, 28 * mm, 28 * mm], hAlign="LEFT")
    invoice_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#111827")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#e5e7eb")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#e5e7eb")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
            ]
        )
    )
    elements.append(invoice_table)
    elements.append(Spacer(1, 14))
    elements.append(Paragraph(f"Statut : {status_label}", right_style))
    if order.payment_method:
        elements.append(Paragraph(f"Paiement : {order.payment_method}", right_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#e5e7eb")))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Merci pour votre confiance.", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer