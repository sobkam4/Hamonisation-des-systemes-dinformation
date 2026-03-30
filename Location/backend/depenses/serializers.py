from rest_framework import serializers
from .models import Depense, CategorieDepense


class CategorieDepenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieDepense
        fields = ['id', 'nom', 'description', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class DepenseSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé pour la lecture (liste / détail).
    """
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    type_depense_display = serializers.CharField(source='get_type_depense_display', read_only=True)
    bien_nom = serializers.CharField(source='bien.nom', read_only=True)
    
    class Meta:
        model = Depense
        fields = [
            'id',
            'date',
            'categorie',
            'categorie_nom',
            'description',
            'montant',
            'type_depense',
            'type_depense_display',
            'bien',
            'bien_nom',
            'fournisseur',
            'numero_facture',
            'date_creation',
        ]
        read_only_fields = ['id', 'date_creation']


class DepenseDetailSerializer(DepenseSerializer):
    class Meta(DepenseSerializer.Meta):
        fields = DepenseSerializer.Meta.fields + ['facture', 'notes', 'date_modification']


class DepenseCreateSerializer(serializers.Serializer):
    """
    Serializer dédié à la création / mise à jour depuis le frontend.
    Il accepte une catégorie texte (ex: \"Maintenance\") et déduit type_depense.
    """
    id = serializers.IntegerField(read_only=True)
    date = serializers.DateField()
    categorie = serializers.CharField()
    description = serializers.CharField()
    montant = serializers.DecimalField(max_digits=10, decimal_places=2)
    bien = serializers.IntegerField(required=False, allow_null=True)
    fournisseur = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    numero_facture = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def _map_type_depense(self, categorie_nom: str) -> str:
        """
        Mappe la catégorie 'fonctionnelle' du frontend vers le type_depense stocké.
        """
        mapping = {
            'maintenance': 'entretien',
            'taxes': 'taxe',
            'assurance': 'assurance',
            'travaux': 'reparation',
            'charges': 'service',
            'autre': 'autre',
        }
        key = (categorie_nom or '').strip().lower()
        return mapping.get(key, 'autre')

    def create(self, validated_data):
        request = self.context.get('request')

        # Gérer la catégorie par nom (création si nécessaire)
        categorie_nom = validated_data.pop('categorie')
        categorie_obj, _ = CategorieDepense.objects.get_or_create(
            nom=categorie_nom,
            defaults={'description': f'Catégorie créée automatiquement ({categorie_nom})'}
        )

        # Déduire le type_depense à partir de la catégorie
        type_depense = self._map_type_depense(categorie_nom)

        bien_id = validated_data.pop('bien', None)
        bien = None
        if bien_id:
            try:
                from biens.models import Bien
                bien = Bien.objects.get(id=bien_id)
            except Bien.DoesNotExist:
                bien = None

        # Retirer created_by de validated_data s'il est présent (il sera passé explicitement)
        validated_data.pop('created_by', None)

        depense = Depense.objects.create(
            categorie=categorie_obj,
            type_depense=type_depense,
            bien=bien,
            created_by=getattr(request, 'user', None),
            **validated_data,
        )
        return depense

    def update(self, instance: Depense, validated_data):
        # Mise à jour de la catégorie si fournie
        categorie_nom = validated_data.pop('categorie', None)
        if categorie_nom:
            categorie_obj, _ = CategorieDepense.objects.get_or_create(
                nom=categorie_nom,
                defaults={'description': f'Catégorie créée automatiquement ({categorie_nom})'}
            )
            instance.categorie = categorie_obj
            instance.type_depense = self._map_type_depense(categorie_nom)

        bien_id = validated_data.pop('bien', None)
        if bien_id is not None:
            try:
                from biens.models import Bien
                instance.bien = Bien.objects.get(id=bien_id)
            except Bien.DoesNotExist:
                instance.bien = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class DepenseParCategorieStatSerializer(serializers.Serializer):
    categorie__nom = serializers.CharField(allow_null=True, required=False)
    total = serializers.DecimalField(max_digits=20, decimal_places=2)
    count = serializers.IntegerField()


class DepenseParTypeStatSerializer(serializers.Serializer):
    type_depense = serializers.CharField(allow_blank=True)
    total = serializers.DecimalField(max_digits=20, decimal_places=2)
    count = serializers.IntegerField()


class DepenseStatisticsSerializer(serializers.Serializer):
    total_depenses = serializers.IntegerField()
    total_montant = serializers.DecimalField(max_digits=20, decimal_places=2)
    depenses_ce_mois = serializers.IntegerField()
    montant_ce_mois = serializers.DecimalField(max_digits=20, decimal_places=2)
    par_categorie = DepenseParCategorieStatSerializer(many=True)
    par_type = DepenseParTypeStatSerializer(many=True)
    moyenne_mensuelle = serializers.DecimalField(max_digits=20, decimal_places=2)


class ImportDepensesCSVRequestSerializer(serializers.Serializer):
    file = serializers.FileField(required=False)
    csv_file = serializers.FileField(required=False)


class ImportDepensesCSVResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    depenses_importees = serializers.ListField(child=serializers.IntegerField())
    erreurs = serializers.ListField(child=serializers.CharField())
    total_lignes = serializers.IntegerField()


class ImportDepensesCSVErrorSerializer(serializers.Serializer):
    error = serializers.CharField()
