from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view
from location_erp.permissions import IsOwnerOrAdmin
from .models import Client
from .serializers import (
    ClientContratResumeSerializer,
    ClientDetailSerializer,
    ClientErrorSerializer,
    ClientMarquerDefautRequestSerializer,
    ClientMarquerDefautResponseSerializer,
    ClientSerializer,
)
from contrats.models import Contrat

class ClientListCreateView(generics.ListCreateAPIView):
    queryset = Client.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ClientDetailSerializer
        return ClientSerializer
    
    def get_queryset(self):
        queryset = Client.objects.all()
        
        # Les non-admins ne voient que leurs propres clients
        if self.request.user.role != 'admin':
            queryset = queryset.filter(created_by=self.request.user)
        
        # Filtrage par défaut de paiement
        defaut_paiement = self.request.query_params.get('defaut_paiement')
        if defaut_paiement is not None:
            queryset = queryset.filter(defaut_paiement=defaut_paiement.lower() == 'true')
        
        # Recherche par nom ou email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) | 
                Q(prenom__icontains=search) |
                Q(email__icontains=search) |
                Q(telephone__icontains=search)
            )
        
        return queryset.order_by('nom', 'prenom')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientDetailSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrAdmin)

@extend_schema_view(
    get=extend_schema(responses={200: ClientContratResumeSerializer(many=True)}),
)
class ClientContratsView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ClientContratResumeSerializer

    def get(self, request, pk):
        client = Client.objects.get(pk=pk)
        contrats = Contrat.objects.filter(client=client)
        
        data = []
        for contrat in contrats:
            data.append({
                'id': contrat.id,
                'bien_nom': contrat.bien.nom,
                'date_debut': contrat.date_debut,
                'date_fin': contrat.date_fin,
                'montant_mensuel': contrat.montant_mensuel,
                'statut': contrat.statut,
                'statut_display': contrat.get_statut_display(),
                'est_actif': contrat.est_actif
            })
        
        return Response(data)

@extend_schema_view(
    patch=extend_schema(
        request=ClientMarquerDefautRequestSerializer,
        responses={
            200: ClientMarquerDefautResponseSerializer,
            400: ClientErrorSerializer,
        },
    ),
    put=extend_schema(exclude=True),
)
class ClientMarquerDefautView(generics.UpdateAPIView):
    queryset = Client.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ClientDetailSerializer

    def update(self, request, *args, **kwargs):
        client = self.get_object()
        action = request.data.get('action')  # 'marquer' ou 'lever'
        
        if action == 'marquer':
            client.marquer_defaut_paiement()
            message = "Client marqué en défaut de paiement"
        elif action == 'lever':
            client.lever_defaut_paiement()
            message = "Défaut de paiement levé"
        else:
            return Response(
                {'error': 'Action invalide'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'message': message, 'defaut_paiement': client.defaut_paiement})

@extend_schema(responses={200: OpenApiTypes.OBJECT})
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def client_statistics(request):
    stats = {
        'total_clients': Client.objects.count(),
        'clients_defaut': Client.objects.filter(defaut_paiement=True).count(),
        'clients_actifs': Contrat.objects.filter(statut='actif').values('client').distinct().count(),
        'nouveaux_clients_mois': Client.objects.filter(
            date_creation__month=request.GET.get('mois'),
            date_creation__year=request.GET.get('annee')
        ).count() if request.GET.get('mois') and request.GET.get('annee') else 0
    }
    
    return Response(stats)
