from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    type_notification_display = serializers.CharField(source='get_type_notification_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type_notification', 'type_notification_display', 'titre', 
            'message', 'priorite', 'priorite_display', 'lu', 'date_creation', 
            'date_lecture', 'bien_id', 'client_id', 'contrat_id', 'paiement_id', 
            'metadata'
        ]
        read_only_fields = ['id', 'date_creation', 'date_lecture']

class NotificationListSerializer(serializers.ModelSerializer):
    type_notification_display = serializers.CharField(source='get_type_notification_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type_notification', 'type_notification_display', 'titre', 
            'message', 'priorite', 'priorite_display', 'lu', 'date_creation',
            'bien_id', 'client_id', 'contrat_id', 'paiement_id'
        ]


class NotificationMessageResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class NotificationCountResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
