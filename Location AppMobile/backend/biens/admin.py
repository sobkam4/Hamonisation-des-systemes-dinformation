from django.contrib import admin
from .models import Bien

@admin.register(Bien)
class BienAdmin(admin.ModelAdmin):
    list_display = ['nom', 'type_bien', 'prix_location', 'statut', 'superficie', 'date_creation']
    list_filter = ['type_bien', 'statut', 'date_creation']
    search_fields = ['nom', 'adresse']
    ordering = ['-date_creation']
    readonly_fields = ['date_creation', 'date_modification']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'type_bien', 'adresse', 'description')
        }),
        ('Caractéristiques', {
            'fields': ('prix_location', 'superficie', 'nombre_pieces')
        }),
        ('Statut', {
            'fields': ('statut',)
        }),
        ('Timestamps', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
