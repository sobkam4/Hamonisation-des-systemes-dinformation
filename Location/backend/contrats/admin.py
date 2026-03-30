from django.contrib import admin
from .models import Contrat

@admin.register(Contrat)
class ContratAdmin(admin.ModelAdmin):
    list_display = ['client_info', 'bien_info', 'montant_mensuel', 'statut', 'date_debut', 'date_fin']
    list_filter = ['statut', 'date_debut', 'date_creation']
    search_fields = ['client__nom', 'client__prenom', 'bien__nom']
    ordering = ['-date_creation']
    readonly_fields = ['date_creation', 'date_modification']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('client', 'bien', 'date_debut', 'date_fin')
        }),
        ('Financier', {
            'fields': ('montant_mensuel', 'caution')
        }),
        ('Statut', {
            'fields': ('statut', 'date_signature')
        }),
        ('Conditions', {
            'fields': ('conditions_particulieres',)
        }),
        ('Timestamps', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def client_info(self, obj):
        return obj.client.nom_complet
    client_info.short_description = 'Client'
    
    def bien_info(self, obj):
        return obj.bien.nom
    bien_info.short_description = 'Bien'
