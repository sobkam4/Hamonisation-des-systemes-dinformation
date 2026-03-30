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


class ContratPaiementListItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date_echeance = serializers.DateField(allow_null=True)
    date_paiement = serializers.DateField(allow_null=True)
    montant_du = serializers.DecimalField(max_digits=20, decimal_places=2)
    montant = serializers.DecimalField(max_digits=20, decimal_places=2)
    solde_restant = serializers.DecimalField(max_digits=20, decimal_places=2)
    statut = serializers.CharField()
    statut_display = serializers.CharField()
    type_paiement = serializers.CharField()
    jours_retard = serializers.IntegerField()


class ContratResilierResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    motif = serializers.CharField(allow_blank=True)
    statut = serializers.CharField()


class ContratSoldeResponseSerializer(serializers.Serializer):
    solde_total = serializers.DecimalField(max_digits=20, decimal_places=2)
    montant_total_du = serializers.DecimalField(max_digits=20, decimal_places=2)
    duree_mois = serializers.IntegerField()


class ContratErrorSerializer(serializers.Serializer):
    error = serializers.CharField()
