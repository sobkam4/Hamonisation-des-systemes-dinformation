from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import date, timedelta
from location_erp.permissions import IsOwnerOrAdmin
from .models import Paiement
from .serializers import PaiementSerializer, PaiementDetailSerializer
from contrats.models import Contrat

class PaiementListCreateView(generics.ListCreateAPIView):
    queryset = Paiement.objects.select_related('contrat', 'contrat__client', 'contrat__bien')
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaiementDetailSerializer
        return PaiementSerializer
    
    def get_queryset(self):
        queryset = Paiement.objects.select_related('contrat', 'contrat__client', 'contrat__bien')
        
        # Les non-admins ne voient que leurs propres paiements
        if self.request.user.role != 'admin':
            queryset = queryset.filter(created_by=self.request.user)
        
        # Filtrage par statut
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        # Filtrage par contrat
        contrat_id = self.request.query_params.get('contrat')
        if contrat_id:
            queryset = queryset.filter(contrat_id=contrat_id)
        
        # Filtrage par période
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        if date_debut:
            queryset = queryset.filter(date_echeance__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_echeance__lte=date_fin)
        
        # Recherche
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(contrat__client__nom__icontains=search) |
                Q(contrat__client__prenom__icontains=search) |
                Q(reference_paiement__icontains=search)
            )
        
        return queryset.order_by('-date_echeance')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class PaiementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Paiement.objects.select_related('contrat', 'contrat__client', 'contrat__bien')
    serializer_class = PaiementDetailSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrAdmin)

class PaiementMarquerPayeView(generics.UpdateAPIView):
    queryset = Paiement.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    
    def update(self, request, *args, **kwargs):
        paiement = self.get_object()
        montant_paye = request.data.get('montant_paye')
        
        if not montant_paye:
            return Response(
                {'error': 'Le montant payé est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        paiement.marquer_paye(montant_paye)
        
        serializer = self.get_serializer(paiement)
        return Response(serializer.data)

class PaiementGenererReferenceView(generics.UpdateAPIView):
    queryset = Paiement.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    
    def update(self, request, *args, **kwargs):
        paiement = self.get_object()
        paiement.generer_reference()
        
        return Response({
            'reference_paiement': paiement.reference_paiement,
            'message': 'Référence générée avec succès'
        })

class PaiementsEnRetardView(generics.ListAPIView):
    serializer_class = PaiementSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Paiement.objects.filter(
            statut='en_retard'
        ).select_related('contrat', 'contrat__client', 'contrat__bien').order_by('date_echeance')

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def paiement_statistics(request):
    today = timezone.now().date()
    
    stats = {
        'total_paiements': Paiement.objects.count(),
        'paiements_payes': Paiement.objects.filter(statut='paye').count(),
        'paiements_en_retard': Paiement.objects.filter(statut='en_retard').count(),
        'paiements_en_attente': Paiement.objects.filter(statut='en_attente').count(),
        'total_encaisse': Paiement.objects.filter(statut='paye').aggregate(
            total=Sum('montant')
        )['total'] or 0,
        'total_du': Paiement.objects.aggregate(total=Sum('montant_du'))['total'] or 0,
        'solde_restant_total': sum(p.solde_restant for p in Paiement.objects.all()),
        'paiements_ce_mois': Paiement.objects.filter(
            date_echeance__month=today.month,
            date_echeance__year=today.year
        ).count()
    }
    
    return Response(stats)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generer_echeances(request, contrat_id):
    try:
        contrat = Contrat.objects.get(pk=contrat_id)
        
        if contrat.statut != 'actif':
            return Response(
                {'error': 'Les échéances ne peuvent être générées que pour les contrats actifs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si des échéances existent déjà
        existing_count = Paiement.objects.filter(contrat=contrat).count()
        expected_count = contrat.duree_mois
        
        if existing_count >= expected_count:
            return Response(
                {'message': f'Les {expected_count} échéances sont déjà générées'}
            )
        
        # Générer les échéances manquantes
        echeances_crees = []
        current_date = contrat.date_debut
        
        for i in range(existing_count, expected_count):
            date_echeance = current_date.replace(day=1) + timedelta(days=32)
            date_echeance = date_echeance.replace(day=contrat.date_debut.day)
            
            if date_echeance > contrat.date_fin:
                date_echeance = contrat.date_fin
            
            paiement = Paiement.objects.create(
                contrat=contrat,
                date_echeance=date_echeance,
                date_paiement=None,
                montant=0,
                montant_du=contrat.montant_mensuel,
                type_paiement='especes',
                statut='en_attente',
                created_by=request.user
            )
            
            echeances_crees.append(paiement.id)
            current_date = date_echeance + timedelta(days=32)
        
        return Response({
            'message': f'{len(echeances_crees)} échéances générées avec succès',
            'echeances_crees': echeances_crees
        })
        
    except Contrat.DoesNotExist:
        return Response(
            {'error': 'Contrat non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
