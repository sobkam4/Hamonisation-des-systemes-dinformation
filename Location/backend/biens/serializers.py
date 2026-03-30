from rest_framework import serializers
from .models import Bien

class BienSerializer(serializers.ModelSerializer):
    type_bien_display = serializers.CharField(source='get_type_bien_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    est_disponible = serializers.BooleanField(read_only=True)
    peut_etre_loue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Bien
        fields = ['id', 'nom', 'type_bien', 'type_bien_display', 'adresse', 
                 'prix_location', 'statut', 'statut_display', 'superficie',
                 'nombre_pieces', 'description', 'date_creation', 'est_disponible',
                 'peut_etre_loue']
        read_only_fields = ['id', 'date_creation']

class BienDetailSerializer(BienSerializer):
    class Meta(BienSerializer.Meta):
        fields = BienSerializer.Meta.fields + ['date_modification']
