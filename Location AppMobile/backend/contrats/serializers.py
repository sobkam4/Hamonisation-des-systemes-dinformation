from rest_framework import serializers
from .models import Contrat
from biens.serializers import BienSerializer
from clients.serializers import ClientSerializer

class ContratSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source='client.nom_complet', read_only=True)
    bien_nom = serializers.CharField(source='bien.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    est_actif = serializers.BooleanField(read_only=True)
    est_expire = serializers.BooleanField(read_only=True)
    duree_mois = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Contrat
        fields = ['id', 'client', 'client_nom', 'bien', 'bien_nom', 
                 'date_debut', 'date_fin', 'montant_mensuel', 'caution',
                 'statut', 'statut_display', 'est_actif', 'est_expire',
                 'duree_mois', 'date_creation']
        read_only_fields = ['id', 'date_creation']

class ContratDetailSerializer(ContratSerializer):
    client = ClientSerializer(read_only=True)
    bien = BienSerializer(read_only=True)
    
    class Meta(ContratSerializer.Meta):
        fields = ContratSerializer.Meta.fields + [
            'conditions_particulieres', 'date_modification', 'date_signature'
        ]
