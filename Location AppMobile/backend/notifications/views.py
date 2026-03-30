from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import Notification
from .serializers import NotificationSerializer, NotificationListSerializer

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationListSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(user=user)
        
        # Filtre par statut (lu/non lu)
        lu = self.request.query_params.get('lu')
        if lu is not None:
            queryset = queryset.filter(lu=lu.lower() == 'true')
        
        # Filtre par type
        type_notif = self.request.query_params.get('type')
        if type_notif:
            queryset = queryset.filter(type_notification=type_notif)
        
        # Filtre par priorité
        priorite = self.request.query_params.get('priorite')
        if priorite:
            queryset = queryset.filter(priorite=priorite)
        
        return queryset.order_by('-date_creation')

class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Si on marque comme lu
        if 'lu' in request.data and request.data['lu']:
            instance.marquer_comme_lu()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return super().update(request, *args, **kwargs)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def marquer_toutes_comme_lues(request):
    """Marque toutes les notifications de l'utilisateur comme lues"""
    count = Notification.objects.filter(user=request.user, lu=False).update(
        lu=True,
        date_lecture=timezone.now()
    )
    return Response({'message': f'{count} notifications marquées comme lues'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def nombre_notifications_non_lues(request):
    """Retourne le nombre de notifications non lues"""
    count = Notification.objects.filter(user=request.user, lu=False).count()
    return Response({'count': count})

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def supprimer_notifications_lues(request):
    """Supprime toutes les notifications lues de l'utilisateur"""
    count, _ = Notification.objects.filter(user=request.user, lu=True).delete()
    return Response({'message': f'{count} notifications supprimées'})
