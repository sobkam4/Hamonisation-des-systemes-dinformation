from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from django.db.models import Count, Q
from location_erp.permissions import IsOwnerOrAdmin
from .models import Bien
from .serializers import BienSerializer, BienDetailSerializer

@extend_schema(
    tags=['Biens'],
    summary="Lister les biens",
    description="Retourne la liste des biens avec filtrage et recherche",
    parameters=[
        OpenApiParameter(
            name='statut',
            type=OpenApiTypes.STR,
            enum=['disponible', 'loue', 'maintenance'],
            description='Filtrer par statut du bien'
        ),
        OpenApiParameter(
            name='type',
            type=OpenApiTypes.STR,
            enum=['appartement', 'maison', 'local_commercial', 'studio', 'duplex', 'villa'],
            description='Filtrer par type de bien'
        ),
        OpenApiParameter(
            name='search',
            type=OpenApiTypes.STR,
            description='Rechercher par nom ou adresse'
        )
    ]
)
class BienListCreateView(generics.ListCreateAPIView):
    queryset = Bien.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BienDetailSerializer
        return BienSerializer
    
    def get_queryset(self):
        queryset = Bien.objects.all()
        
        # Les non-admins ne voient que leurs propres biens
        if self.request.user.role != 'admin':
            queryset = queryset.filter(created_by=self.request.user)
        
        # Filtrage par statut
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        # Filtrage par type
        type_bien = self.request.query_params.get('type')
        if type_bien:
            queryset = queryset.filter(type_bien=type_bien)
        
        # Recherche par nom
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) | 
                Q(adresse__icontains=search)
            )
        
        return queryset.order_by('-date_creation')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

@extend_schema(
    tags=['Biens'],
    summary="Détails d'un bien",
    description="Récupère, met à jour ou supprime un bien"
)
class BienDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Bien.objects.all()
    serializer_class = BienDetailSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrAdmin)

@extend_schema(
    tags=['Biens'],
    summary="Changer statut d'un bien",
    description="Modifie le statut d'un bien (disponible, loué, maintenance)",
    request=OpenApiTypes.OBJECT
)
class BienChangeStatusView(generics.UpdateAPIView):
    queryset = Bien.objects.all()
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrAdmin)
    serializer_class = BienSerializer
    
    def update(self, request, *args, **kwargs):
        bien = self.get_object()
        nouveau_statut = request.data.get('statut')
        
        if nouveau_statut not in ['disponible', 'loue', 'maintenance']:
            return Response(
                {'error': 'Statut invalide'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si le bien peut être loué
        if nouveau_statut == 'loue' and not bien.peut_etre_loue():
            return Response(
                {'error': 'Ce bien ne peut pas être loué'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        bien.statut = nouveau_statut
        bien.save()
        
        serializer = self.get_serializer(bien)
        return Response(serializer.data)

@extend_schema(
    tags=['Biens'],
    summary="Statistiques des biens",
    description="Retourne les statistiques détaillées sur les biens"
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def bien_statistics(request):
    stats = {
        'total_biens': Bien.objects.count(),
        'biens_disponibles': Bien.objects.filter(statut='disponible').count(),
        'biens_loues': Bien.objects.filter(statut='loue').count(),
        'biens_maintenance': Bien.objects.filter(statut='maintenance').count(),
        'par_type': Bien.objects.values('type_bien').annotate(count=Count('id')),
        'taux_occupation': 0
    }
    
    total = stats['total_biens']
    if total > 0:
        stats['taux_occupation'] = (stats['biens_loues'] / total) * 100
    
    return Response(stats)
