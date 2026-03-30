from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import RapportMensuel, IndicateurPerformance
from .serializers import (
    CalculerRoiRequestSerializer,
    ErrorDetailSerializer,
    IndicateurPerformanceSerializer,
    RapportMensuelSerializer,
)
from biens.models import Bien
from contrats.models import Contrat
from paiements.models import Paiement
from depenses.models import Depense
from clients.models import Client

class RapportMensuelListView(generics.ListAPIView):
    queryset = RapportMensuel.objects.all()
    serializer_class = RapportMensuelSerializer
    permission_classes = (permissions.IsAuthenticated,)

class RapportMensuelDetailView(generics.RetrieveAPIView):
    queryset = RapportMensuel.objects.all()
    serializer_class = RapportMensuelSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        annee = self.kwargs['annee']
        mois = self.kwargs['mois']
        return RapportMensuel.objects.get(annee=annee, mois=mois)

@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={
            200: RapportMensuelSerializer,
            400: ErrorDetailSerializer,
        },
    )
)
class GenererRapportMensuelView(generics.CreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = RapportMensuelSerializer

    def post(self, request, *args, **kwargs):
        annee = self.kwargs['annee']
        mois = self.kwargs['mois']
        
        try:
            rapport = RapportMensuel.generer_rapport(annee, mois)
            serializer = RapportMensuelSerializer(rapport)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du rapport: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

class IndicateurPerformanceListView(generics.ListAPIView):
    queryset = IndicateurPerformance.objects.all()
    serializer_class = IndicateurPerformanceSerializer
    permission_classes = (permissions.IsAuthenticated,)

@extend_schema(
    request=CalculerRoiRequestSerializer,
    responses={
        200: IndicateurPerformanceSerializer,
        400: ErrorDetailSerializer,
    },
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def calculer_roi(request):
    periode_debut = request.data.get('periode_debut')
    periode_fin = request.data.get('periode_fin')
    
    if not periode_debut or not periode_fin:
        return Response(
            {'error': 'Les dates de début et de fin sont requises'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        periode_debut = datetime.strptime(periode_debut, '%Y-%m-%d').date()
        periode_fin = datetime.strptime(periode_fin, '%Y-%m-%d').date()
        
        indicateur = IndicateurPerformance.calculer_roi(periode_debut, periode_fin)
        serializer = IndicateurPerformanceSerializer(indicateur)
        return Response(serializer.data)
        
    except ValueError:
        return Response(
            {'error': 'Format de date invalide. Utilisez YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )

@extend_schema(responses={200: OpenApiTypes.OBJECT})
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard(request):
    today = timezone.now().date()
    current_month_start = today.replace(day=1)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    
    # Statistiques générales
    stats = {
        'biens': {
            'total': Bien.objects.count(),
            'disponibles': Bien.objects.filter(statut='disponible').count(),
            'loues': Bien.objects.filter(statut='loue').count(),
            'maintenance': Bien.objects.filter(statut='maintenance').count(),
            'taux_occupation': 0
        },
        'contrats': {
            'total': Contrat.objects.count(),
            'actifs': Contrat.objects.filter(statut='actif').count(),
            'revenu_mensuel': Contrat.objects.filter(statut='actif').aggregate(
                total=Sum('montant_mensuel')
            )['total'] or 0
        },
        'paiements': {
            'total_ce_mois': Paiement.objects.filter(
                date_paiement__month=today.month,
                date_paiement__year=today.year,
                statut='paye'
            ).aggregate(total=Sum('montant'))['total'] or 0,
            'en_retard': Paiement.objects.filter(statut='en_retard').count(),
            'total_encaisse': Paiement.objects.filter(statut='paye').aggregate(
                total=Sum('montant')
            )['total'] or 0
        },
        'depenses': {
            'total_ce_mois': Depense.objects.filter(
                date__month=today.month,
                date__year=today.year
            ).aggregate(total=Sum('montant'))['total'] or 0,
            'total_annuel': Depense.objects.filter(
                date__year=today.year
            ).aggregate(total=Sum('montant'))['total'] or 0
        }
    }
    
    # Calcul du taux d'occupation
    total_biens = stats['biens']['total']
    if total_biens > 0:
        stats['biens']['taux_occupation'] = (stats['biens']['loues'] / total_biens) * 100
    else:
        stats['biens']['taux_occupation'] = 0
    
    # Cashflow du mois
    revenus_mois = stats['paiements']['total_ce_mois']
    depenses_mois = stats['depenses']['total_ce_mois']
    stats['cashflow_mois'] = revenus_mois - depenses_mois
    
    return Response(stats)

@extend_schema(responses={200: OpenApiTypes.OBJECT})
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def cashflow(request):
    # Paramètres
    annee = request.GET.get('annee', timezone.now().year)
    
    cashflow_data = []
    
    for mois in range(1, 13):
        # Revenus du mois
        revenus = Paiement.objects.filter(
            date_paiement__year=annee,
            date_paiement__month=mois,
            statut='paye'
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        # Dépenses du mois
        depenses = Depense.objects.filter(
            date__year=annee,
            date__month=mois
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        cashflow_mois = revenus - depenses
        
        cashflow_data.append({
            'mois': mois,
            'nom_mois': datetime(annee, mois, 1).strftime('%B'),
            'revenus': revenus,
            'depenses': depenses,
            'cashflow': cashflow_mois
        })
    
    return Response({
        'annee': annee,
        'donnees': cashflow_data,
        'total_annuel': {
            'revenus': sum(item['revenus'] for item in cashflow_data),
            'depenses': sum(item['depenses'] for item in cashflow_data),
            'cashflow': sum(item['cashflow'] for item in cashflow_data)
        }
    })

@extend_schema(responses={200: OpenApiTypes.OBJECT})
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def projection(request):
    mois_projection = int(request.GET.get('mois', 12))  # Projection sur 12 mois par défaut
    
    today = timezone.now().date()
    projections = []
    
    for i in range(mois_projection):
        mois_cible = (today.month + i - 1) % 12 + 1
        annee_cible = today.year + (today.month + i - 1) // 12
        
        # Revenus projetés (basés sur les contrats actifs)
        revenus_projetes = Contrat.objects.filter(
            statut='actif',
            date_debut__lte=datetime(annee_cible, mois_cible, 1).date(),
            date_fin__gte=datetime(annee_cible, mois_cible, 1).date()
        ).aggregate(total=Sum('montant_mensuel'))['total'] or 0
        
        # Dépenses moyennes mensuelles
        depenses_moyennes = Depense.objects.aggregate(
            avg=Sum('montant') / Count('id')
        )['avg'] or 0
        
        cashflow_projete = revenus_projetes - depenses_moyennes
        
        projections.append({
            'mois': mois_cible,
            'annee': annee_cible,
            'nom_mois': datetime(annee_cible, mois_cible, 1).strftime('%B %Y'),
            'revenus_projetes': revenus_projetes,
            'depenses_projetees': depenses_moyennes,
            'cashflow_projete': cashflow_projete
        })
    
    # Calculer le ROI projeté
    total_revenus = sum(p['revenus_projetes'] for p in projections)
    total_depenses = sum(p['depenses_projetees'] for p in projections)
    
    if total_depenses > 0:
        roi_projete = ((total_revenus - total_depenses) / total_depenses) * 100
    else:
        roi_projete = 0
    
    return Response({
        'projection_mois': mois_projection,
        'projections': projections,
        'totaux': {
            'revenus_totaux': total_revenus,
            'depenses_totales': total_depenses,
            'roi_projete': roi_projete
        }
    })

@extend_schema(responses={200: OpenApiTypes.OBJECT})
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def rapport_clients_contrats(request):
    """
    Rapport listant tous les clients, leurs contrats et les mois qu'ils ont payés
    """
    # Filtrer les clients selon les permissions
    clients_queryset = Client.objects.all()
    if request.user.role != 'admin':
        clients_queryset = clients_queryset.filter(created_by=request.user)
    
    rapport_data = []
    
    for client in clients_queryset.select_related():
        contrats = Contrat.objects.filter(client=client)
        if request.user.role != 'admin':
            contrats = contrats.filter(created_by=request.user)
        
        client_data = {
            'client_id': client.id,
            'client_nom': client.nom,
            'client_prenom': client.prenom,
            'client_nom_complet': client.nom_complet,
            'client_email': client.email,
            'client_telephone': client.telephone,
            'contrats': []
        }
        
        for contrat in contrats.select_related('bien'):
            # Récupérer tous les paiements pour ce contrat
            paiements = Paiement.objects.filter(contrat=contrat)
            if request.user.role != 'admin':
                paiements = paiements.filter(created_by=request.user)
            
            # Extraire les mois payés (uniques)
            mois_payes = paiements.filter(
                statut__in=['paye', 'partiel']
            ).exclude(
                mois_paye__isnull=True
            ).exclude(
                mois_paye=''
            ).values_list('mois_paye', flat=True).distinct()
            
            # Formater les mois payés pour l'affichage
            mois_payes_formates = []
            for mois_paye in mois_payes:
                if mois_paye:
                    try:
                        annee, mois = mois_paye.split('-')
                        mois_noms = {
                            '01': 'Janvier', '02': 'Février', '03': 'Mars',
                            '04': 'Avril', '05': 'Mai', '06': 'Juin',
                            '07': 'Juillet', '08': 'Août', '09': 'Septembre',
                            '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
                        }
                        mois_payes_formates.append(f"{mois_noms.get(mois, mois)} {annee}")
                    except:
                        mois_payes_formates.append(mois_paye)
            
            contrat_data = {
                'contrat_id': contrat.id,
                'contrat_reference': f"CTR-{contrat.id}",
                'bien_nom': contrat.bien.nom,
                'bien_id': contrat.bien.id,
                'date_debut': contrat.date_debut,
                'date_fin': contrat.date_fin,
                'montant_mensuel': float(contrat.montant_mensuel),
                'statut': contrat.statut,
                'statut_display': contrat.get_statut_display(),
                'mois_payes': sorted(mois_payes_formates, reverse=True),
                'nombre_mois_payes': len(mois_payes_formates),
                'total_paiements': float(paiements.filter(statut='paye').aggregate(total=Sum('montant'))['total'] or 0)
            }
            
            client_data['contrats'].append(contrat_data)
        
        if client_data['contrats']:  # Ne pas inclure les clients sans contrats
            rapport_data.append(client_data)
    
    return Response({
        'total_clients': len(rapport_data),
        'donnees': rapport_data
    })
