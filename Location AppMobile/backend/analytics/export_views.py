from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum
from datetime import datetime, timedelta
from decimal import Decimal
import pandas as pd
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import io

from biens.models import Bien
from contrats.models import Contrat
from paiements.models import Paiement
from depenses.models import Depense
from clients.models import Client


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_rapport_mensuel_excel(request):
    """Exporte le rapport mensuel en format Excel"""
    annee = int(request.GET.get('annee', timezone.now().year))
    mois = int(request.GET.get('mois', timezone.now().month))
    
    # Récupérer les données
    paiements = Paiement.objects.filter(
        date_paiement__year=annee,
        date_paiement__month=mois,
        statut='paye'
    ).select_related('contrat__client', 'contrat__bien')
    
    depenses = Depense.objects.filter(
        date__year=annee,
        date__month=mois
    )
    
    # Créer le workbook Excel
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Feuille 1: Résumé
        resume_data = {
            'Indicateur': [
                'Total des revenus',
                'Total des dépenses',
                'Cashflow net',
                'Nombre de paiements',
                'Nombre de dépenses',
                'Taux de paiement en retard'
            ],
            'Valeur': [
                float(paiements.aggregate(total=models.Sum('montant'))['total'] or 0),
                float(depenses.aggregate(total=models.Sum('montant'))['total'] or 0),
                float(paiements.aggregate(total=models.Sum('montant'))['total'] or 0) - 
                float(depenses.aggregate(total=models.Sum('montant'))['total'] or 0),
                paiements.count(),
                depenses.count(),
                f"{(Paiement.objects.filter(statut='en_retard').count() / max(Paiement.objects.count(), 1)) * 100:.1f}%"
            ]
        }
        
        df_resume = pd.DataFrame(resume_data)
        df_resume.to_excel(writer, sheet_name='Résumé', index=False)
        
        # Feuille 2: Détails des paiements
        paiements_data = []
        for paiement in paiements:
            paiements_data.append({
                'Date': paiement.date_paiement.strftime('%d/%m/%Y'),
                'Client': paiement.contrat.client.nom_complet,
                'Bien': paiement.contrat.bien.nom,
                'Montant': float(paiement.montant),
                'Statut': paiement.get_statut_display(),
                'Type': paiement.type_paiement
            })
        
        df_paiements = pd.DataFrame(paiements_data)
        df_paiements.to_excel(writer, sheet_name='Paiements', index=False)
        
        # Feuille 3: Détails des dépenses
        depenses_data = []
        for depense in depenses:
            depenses_data.append({
                'Date': depense.date.strftime('%d/%m/%Y'),
                'Catégorie': depense.categorie.nom,
                'Description': depense.description,
                'Montant': float(depense.montant),
                'Type': depense.type_depense
            })
        
        df_depenses = pd.DataFrame(depenses_data)
        df_depenses.to_excel(writer, sheet_name='Dépenses', index=False)
        
        # Feuille 4: Performance des biens
        biens_data = []
        for bien in Bien.objects.all():
            paiements_bien = paiements.filter(contrat__bien=bien)
            biens_data.append({
                'Bien': bien.nom,
                'Type': bien.type_bien,
                'Statut': bien.get_statut_display(),
                'Revenus mensuels': float(bien.montant_mensuel or 0),
                'Revenus ce mois': float(paiements_bien.aggregate(total=Sum('montant'))['total'] or 0),
                'Taux occupation': '100%' if bien.statut == 'loue' else '0%'
            })
        
        df_biens = pd.DataFrame(biens_data)
        df_biens.to_excel(writer, sheet_name='Biens', index=False)
    
    output.seek(0)
    
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=rapport_mensuel_{annee}_{mois:02d}.xlsx'
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_rapport_mensuel_pdf(request):
    """Exporte le rapport mensuel en format PDF"""
    from django.db.models import Sum
    
    annee = int(request.GET.get('annee', timezone.now().year))
    mois = int(request.GET.get('mois', timezone.now().month))
    
    # Récupérer les données
    paiements = Paiement.objects.filter(
        date_paiement__year=annee,
        date_paiement__month=mois,
        statut='paye'
    ).select_related('contrat__client', 'contrat__bien')
    
    depenses = Depense.objects.filter(
        date__year=annee,
        date__month=mois
    )
    
    # Calculs
    total_revenus = paiements.aggregate(total=Sum('montant'))['total'] or 0
    total_depenses = depenses.aggregate(total=Sum('montant'))['total'] or 0
    cashflow = total_revenus - total_depenses
    
    # Créer le PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=rapport_mensuel_{annee}_{mois:02d}.pdf'
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1  # Center
    )
    
    content = []
    
    # Titre
    mois_nom = datetime(annee, mois, 1).strftime('%B %Y')
    content.append(Paragraph(f"Rapport Mensuel - {mois_nom}", title_style))
    content.append(Spacer(1, 20))
    
    # Résumé
    resume_data = [
            ['Indicateur', 'Montant (GNF)'],
            ['Total des revenus', f'{total_revenus:,.0f}'],
            ['Total des dépenses', f'{total_depenses:,.0f}'],
            ['Cashflow net', f'{cashflow:,.0f}'],
            ['Nombre de paiements', str(paiements.count())],
            ['Nombre de dépenses', str(depenses.count())]
        ]
    
    resume_table = Table(resume_data, colWidths=[3*inch, 2*inch])
    resume_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    content.append(resume_table)
    content.append(Spacer(1, 20))
    
    # Détails des paiements
    content.append(Paragraph("Détails des Paiements", styles['Heading2']))
    content.append(Spacer(1, 12))
    
    paiements_data = [['Date', 'Client', 'Bien', 'Montant', 'Type']]
    for paiement in paiements[:10]:  # Limiter à 10 pour l'exemple
        paiements_data.append([
            paiement.date_paiement.strftime('%d/%m/%Y'),
            paiement.contrat.client.nom_complet,
            paiement.contrat.bien.nom,
            f'{paiement.montant:,.0f}',
            paiement.type_paiement
        ])
    
    paiements_table = Table(paiements_data, colWidths=[1*inch, 2*inch, 2*inch, 1*inch, 1*inch])
    paiements_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    content.append(paiements_table)
    content.append(Spacer(1, 20))
    
    # Détails des dépenses
    content.append(Paragraph("Détails des Dépenses", styles['Heading2']))
    content.append(Spacer(1, 12))
    
    depenses_data = [['Date', 'Catégorie', 'Description', 'Montant']]
    for depense in depenses[:10]:  # Limiter à 10 pour l'exemple
        depenses_data.append([
            depense.date.strftime('%d/%m/%Y'),
            depense.categorie.nom,
            depense.description[:30] + '...' if len(depense.description) > 30 else depense.description,
            f'{depense.montant:,.0f}'
        ])
    
    depenses_table = Table(depenses_data, colWidths=[1*inch, 1.5*inch, 2*inch, 1*inch])
    depenses_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    content.append(depenses_table)
    
    # Construire le PDF
    doc.build(content)
    buffer.seek(0)
    
    response.write(buffer.getvalue())
    buffer.close()
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_rapport_annuel_excel(request):
    """Exporte le rapport annuel en format Excel"""
    annee = int(request.GET.get('annee', timezone.now().year))
    
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Feuille 1: Résumé annuel par mois
        resume_data = []
        for mois in range(1, 13):
            paiements_mois = Paiement.objects.filter(
                date_paiement__year=annee,
                date_paiement__month=mois,
                statut='paye'
            )
            depenses_mois = Depense.objects.filter(
                date__year=annee,
                date__month=mois
            )
            
            total_revenus = paiements_mois.aggregate(total=models.Sum('montant'))['total'] or 0
            total_depenses = depenses_mois.aggregate(total=models.Sum('montant'))['total'] or 0
            
            resume_data.append({
                'Mois': datetime(annee, mois, 1).strftime('%B'),
                'Revenus': float(total_revenus),
                'Dépenses': float(total_depenses),
                'Cashflow': float(total_revenus - total_depenses),
                'Nb Paiements': paiements_mois.count(),
                'Nb Dépenses': depenses_mois.count()
            })
        
        df_resume = pd.DataFrame(resume_data)
        df_resume.to_excel(writer, sheet_name='Résumé Annuel', index=False)
        
        # Feuille 2: Performance des biens
        biens_data = []
        for bien in Bien.objects.all():
            paiements_bien = Paiement.objects.filter(
                contrat__bien=bien,
                date_paiement__year=annee,
                statut='paye'
            )
            
            biens_data.append({
                'Bien': bien.nom,
                'Type': bien.type_bien,
                'Statut': bien.get_statut_display(),
                'Revenus annuels': float(paiements_bien.aggregate(total=models.Sum('montant'))['total'] or 0),
                'Nb paiements': paiements_bien.count(),
                'Taux occupation': '100%' if bien.statut == 'loue' else '0%'
            })
        
        df_biens = pd.DataFrame(biens_data)
        df_biens.to_excel(writer, sheet_name='Performance Biens', index=False)
        
        # Feuille 3: Top clients
        clients_data = []
        for client in Client.objects.all():
            paiements_client = Paiement.objects.filter(
                contrat__client=client,
                date_paiement__year=annee,
                statut='paye'
            )
            
            if paiements_client.exists():
                clients_data.append({
                    'Client': client.nom_complet,
                    'Total payé': float(paiements_client.aggregate(total=models.Sum('montant'))['total'] or 0),
                    'Nb paiements': paiements_client.count(),
                    'Nb contrats': Contrat.objects.filter(client=client, statut='actif').count()
                })
        
        df_clients = pd.DataFrame(clients_data)
        df_clients = df_clients.sort_values('Total payé', ascending=False)
        df_clients.to_excel(writer, sheet_name='Top Clients', index=False)
    
    output.seek(0)
    
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=rapport_annuel_{annee}.xlsx'
    
    return response
