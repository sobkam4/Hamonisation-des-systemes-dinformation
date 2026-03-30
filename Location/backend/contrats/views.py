from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Q, Sum
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view
from location_erp.permissions import IsOwnerOrAdmin
from .models import Contrat
from .serializers import (
    ContratDetailSerializer,
    ContratErrorSerializer,
    ContratPaiementListItemSerializer,
    ContratResilierResponseSerializer,
    ContratSerializer,
    ContratSoldeResponseSerializer,
)
from paiements.models import Paiement

class ContratListCreateView(generics.ListCreateAPIView):
    queryset = Contrat.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_serializer_class(self):
        # Utiliser ContratSerializer pour POST car il accepte les IDs
        # ContratDetailSerializer est en read_only et ne peut pas créer
        return ContratSerializer
    
    def get_queryset(self):
        queryset = Contrat.objects.select_related('client', 'bien')
        
        # Les non-admins ne voient que leurs propres contrats
        if self.request.user.role != 'admin':
            queryset = queryset.filter(created_by=self.request.user)
        
        # Filtrage par statut
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        # Filtrage par client
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        # Filtrage par bien
        bien_id = self.request.query_params.get('bien')
        if bien_id:
            queryset = queryset.filter(bien_id=bien_id)
        
        # Recherche
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(client__nom__icontains=search) |
                Q(client__prenom__icontains=search) |
                Q(bien__nom__icontains=search)
            )
        
        return queryset.order_by('-date_creation')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ContratDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Contrat.objects.select_related('client', 'bien')
    serializer_class = ContratDetailSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrAdmin)

@extend_schema_view(
    patch=extend_schema(
        responses={
            200: ContratResilierResponseSerializer,
            400: ContratErrorSerializer,
        },
    ),
    put=extend_schema(exclude=True),
)
class ContratResilierView(generics.UpdateAPIView):
    queryset = Contrat.objects.all()
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrAdmin)
    serializer_class = ContratDetailSerializer

    def update(self, request, *args, **kwargs):
        contrat = self.get_object()
        
        if contrat.statut not in ['actif', 'en_attente']:
            return Response(
                {'error': 'Seuls les contrats actifs ou en attente peuvent être résiliés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        motif = request.data.get('motif', '')
        contrat.statut = 'resilie'
        contrat.save()
        
        # Libérer le bien
        contrat.bien.statut = 'disponible'
        contrat.bien.save()
        
        return Response({
            'message': 'Contrat résilié avec succès',
            'motif': motif,
            'statut': contrat.statut
        })

@extend_schema_view(
    get=extend_schema(responses={200: ContratPaiementListItemSerializer(many=True)}),
)
class ContratPaiementsView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ContratPaiementListItemSerializer

    def get(self, request, pk):
        contrat = Contrat.objects.get(pk=pk)
        paiements = Paiement.objects.filter(contrat=contrat).order_by('-date_echeance')
        
        data = []
        for paiement in paiements:
            data.append({
                'id': paiement.id,
                'date_echeance': paiement.date_echeance,
                'date_paiement': paiement.date_paiement,
                'montant_du': paiement.montant_du,
                'montant': paiement.montant,
                'solde_restant': paiement.solde_restant,
                'statut': paiement.statut,
                'statut_display': paiement.get_statut_display(),
                'type_paiement': paiement.type_paiement,
                'jours_retard': paiement.jours_retard
            })
        
        return Response(data)

@extend_schema_view(
    get=extend_schema(responses={200: ContratSoldeResponseSerializer}),
)
class ContratSoldeView(generics.RetrieveAPIView):
    queryset = Contrat.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ContratDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        contrat = self.get_object()
        solde = contrat.calculer_solde_total()
        
        return Response({
            'solde_total': solde,
            'montant_total_du': contrat.montant_mensuel * contrat.duree_mois,
            'duree_mois': contrat.duree_mois
        })

@extend_schema(responses={200: OpenApiTypes.OBJECT})
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def contrat_statistics(request):
    stats = {
        'total_contrats': Contrat.objects.count(),
        'contrats_actifs': Contrat.objects.filter(statut='actif').count(),
        'contrats_resilie': Contrat.objects.filter(statut='resilie').count(),
        'contrats_termine': Contrat.objects.filter(statut='termine').count(),
        'contrats_en_attente': Contrat.objects.filter(statut='en_attente').count(),
        'revenu_mensuel_total': Contrat.objects.filter(statut='actif').aggregate(
            total=Sum('montant_mensuel')
        )['total'] or 0
    }
    
    return Response(stats)
