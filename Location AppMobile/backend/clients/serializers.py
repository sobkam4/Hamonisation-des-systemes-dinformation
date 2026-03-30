from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(read_only=True)
    nombre_contrats_actifs = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Client
        fields = ['id', 'nom', 'prenom', 'nom_complet', 'email', 'telephone',
                 'defaut_paiement', 'nombre_contrats_actifs', 'date_creation']
        read_only_fields = ['id', 'date_creation']

class ClientDetailSerializer(ClientSerializer):
    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + [
            'adresse', 'piece_identite', 'numero_piece_identite', 
            'notes', 'date_modification'
        ]
