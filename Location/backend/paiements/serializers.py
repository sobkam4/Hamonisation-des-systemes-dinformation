from rest_framework import serializers
from .models import Paiement

class PaiementSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source='contrat.client.nom_complet', read_only=True)
    bien_nom = serializers.CharField(source='contrat.bien.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    type_paiement_display = serializers.CharField(source='get_type_paiement_display', read_only=True)
    solde_restant = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    est_en_retard = serializers.BooleanField(read_only=True)
    jours_retard = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Paiement
        fields = ['id', 'contrat', 'client_nom', 'bien_nom', 'date_paiement', 
                 'date_echeance', 'mois_paye', 'montant', 'montant_du', 'solde_restant',
                 'type_paiement', 'type_paiement_display', 'statut', 'statut_display',
                 'reference_paiement', 'est_en_retard', 'jours_retard', 'date_creation']
        read_only_fields = ['id', 'date_creation']

class PaiementDetailSerializer(PaiementSerializer):
    montant_du = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    mois_paye = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    
    class Meta(PaiementSerializer.Meta):
        fields = PaiementSerializer.Meta.fields + ['notes', 'date_modification']
    
    def create(self, validated_data):
        # Si montant_du n'est pas fourni, le récupérer depuis le contrat
        if 'montant_du' not in validated_data or not validated_data.get('montant_du'):
            contrat = validated_data.get('contrat')
            if contrat:
                validated_data['montant_du'] = contrat.montant_mensuel
        return super().create(validated_data)


class PaiementStatisticsSerializer(serializers.Serializer):
    total_paiements = serializers.IntegerField()
    paiements_payes = serializers.IntegerField()
    paiements_en_retard = serializers.IntegerField()
    paiements_en_attente = serializers.IntegerField()
    total_encaisse = serializers.DecimalField(max_digits=20, decimal_places=2)
    total_du = serializers.DecimalField(max_digits=20, decimal_places=2)
    solde_restant_total = serializers.DecimalField(max_digits=20, decimal_places=2)
    paiements_ce_mois = serializers.IntegerField()


class GenererEcheancesResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    echeances_crees = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
    )


class GenererEcheancesErrorSerializer(serializers.Serializer):
    error = serializers.CharField()


class PaiementGenererReferenceResponseSerializer(serializers.Serializer):
    reference_paiement = serializers.CharField(allow_blank=True)
    message = serializers.CharField()