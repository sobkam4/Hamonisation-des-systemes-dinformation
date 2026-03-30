from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['titre', 'type_document', 'bien', 'client', 'created_by', 'date_creation']
    list_filter = ['type_document', 'date_creation']
    search_fields = ['titre', 'description']
    readonly_fields = ['date_creation', 'date_modification']
