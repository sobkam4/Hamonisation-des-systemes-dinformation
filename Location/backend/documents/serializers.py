from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    type_document_display = serializers.CharField(source='get_type_document_display', read_only=True)
    fichier_url = serializers.SerializerMethodField()
    taille_fichier = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'type_document', 'type_document_display', 'titre', 'description',
            'fichier', 'fichier_url', 'taille_fichier', 'bien', 'client', 'contrat',
            'paiement', 'created_by', 'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification', 'created_by']
    
    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_fichier_url(self, obj):
        if obj.fichier:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.fichier.url)
            return obj.fichier.url
        return None
    
    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_taille_fichier(self, obj):
        if obj.fichier:
            try:
                return obj.fichier.size
            except:
                return None
        return None
