from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.http import HttpResponse
from .pdf_generator import generer_contrat_pdf, generer_quittance_pdf, generer_recu_pdf
from contrats.models import Contrat
from paiements.models import Paiement

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generer_pdf_contrat(request, contrat_id):
    """Génère un PDF de contrat"""
    try:
        contrat = Contrat.objects.select_related('client', 'bien').get(id=contrat_id)
        
        # Vérifier les permissions
        if request.user.role != 'admin' and hasattr(contrat, 'created_by') and contrat.created_by != request.user:
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'accéder à ce contrat'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        client = contrat.client
        bien = contrat.bien
        
        pdf_buffer = generer_contrat_pdf(contrat, client, bien)
        
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="contrat_{contrat.reference or contrat.id}.pdf"'
        return response
        
    except Contrat.DoesNotExist:
        return Response(
            {'error': 'Contrat non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generer_pdf_quittance(request, paiement_id):
    """Génère une quittance de loyer en PDF"""
    try:
        paiement = Paiement.objects.select_related('contrat__client', 'contrat__bien').get(id=paiement_id)
        
        # Vérifier les permissions
        if request.user.role != 'admin' and hasattr(paiement.contrat, 'created_by') and paiement.contrat.created_by != request.user:
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'accéder à ce paiement'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        contrat = paiement.contrat
        client = contrat.client
        bien = contrat.bien
        
        pdf_buffer = generer_quittance_pdf(paiement, contrat, client, bien)
        
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="quittance_{paiement.reference}.pdf"'
        return response
        
    except Paiement.DoesNotExist:
        return Response(
            {'error': 'Paiement non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generer_pdf_recu(request, paiement_id):
    """Génère un reçu de paiement en PDF"""
    try:
        paiement = Paiement.objects.select_related('contrat__client').get(id=paiement_id)
        
        # Vérifier les permissions
        if request.user.role != 'admin' and hasattr(paiement.contrat, 'created_by') and paiement.contrat.created_by != request.user:
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'accéder à ce paiement'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        contrat = paiement.contrat
        client = contrat.client
        
        pdf_buffer = generer_recu_pdf(paiement, contrat, client)
        
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="recu_{paiement.reference}.pdf"'
        return response
        
    except Paiement.DoesNotExist:
        return Response(
            {'error': 'Paiement non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
