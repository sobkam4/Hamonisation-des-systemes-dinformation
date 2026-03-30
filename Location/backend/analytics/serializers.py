from rest_framework import serializers
from .models import RapportMensuel, IndicateurPerformance

class RapportMensuelSerializer(serializers.ModelSerializer):
    class Meta:
        model = RapportMensuel
        fields = ['id', 'annee', 'mois', 'revenus_total', 'depenses_total', 
                 'cashflow', 'taux_occupation', 'nombre_biens_loues', 
                 'nombre_biens_total', 'date_creation']
        read_only_fields = ['id', 'date_creation']

class IndicateurPerformanceSerializer(serializers.ModelSerializer):
    type_indicateur_display = serializers.CharField(source='get_type_indicateur_display', read_only=True)
    
    class Meta:
        model = IndicateurPerformance
        fields = ['id', 'type_indicateur', 'type_indicateur_display', 'valeur', 
                 'periode_debut', 'periode_fin', 'date_calcul']
        read_only_fields = ['id', 'date_calcul']


class ErrorDetailSerializer(serializers.Serializer):
    error = serializers.CharField()


class CalculerRoiRequestSerializer(serializers.Serializer):
    periode_debut = serializers.CharField(help_text='Format YYYY-MM-DD')
    periode_fin = serializers.CharField(help_text='Format YYYY-MM-DD')
