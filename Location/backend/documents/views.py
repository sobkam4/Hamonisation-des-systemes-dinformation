from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from location_erp.permissions import IsOwnerOrAdmin
from .models import Document
from .serializers import DocumentSerializer

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = Document.objects.all()
        user = self.request.user
        
        # Les non-admins ne voient que leurs propres documents
        if user.role != 'admin':
            queryset = queryset.filter(created_by=user)
        
        # Filtres
        type_doc = self.request.query_params.get('type')
        if type_doc:
            queryset = queryset.filter(type_document=type_doc)
        
        bien_id = self.request.query_params.get('bien')
        if bien_id:
            queryset = queryset.filter(bien_id=bien_id)
        
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        contrat_id = self.request.query_params.get('contrat')
        if contrat_id:
            queryset = queryset.filter(contrat_id=contrat_id)
        
        # Recherche
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(titre__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-date_creation')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrAdmin)
    parser_classes = [JSONParser, MultiPartParser, FormParser]
