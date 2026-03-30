from django.contrib import admin
from .models import Paiement

@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ['contrat_info', 'date_echeance', 'montant_du', 'montant', 
                   'statut', 'type_paiement', 'solde_restant']
    list_filter = ['statut', 'type_paiement', 'date_echeance', 'date_creation']
    search_fields = ['contrat__client__nom', 'contrat__client__prenom', 
                    'contrat__bien__nom', 'reference_paiement']
    ordering = ['-date_echeance']
    readonly_fields = ['date_creation', 'date_modification', 'solde_restant', 'jours_retard']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('contrat', 'date_echeance', 'date_paiement')
        }),
        ('Montants', {
            'fields': ('montant_du', 'montant')
        }),
        ('Type et statut', {
            'fields': ('type_paiement', 'statut', 'reference_paiement')
        }),
        ('Informations supplémentaires', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def contrat_info(self, obj):
        return f"{obj.contrat.client.nom_complet} - {obj.contrat.bien.nom}"
    contrat_info.short_description = 'Contrat'
    
    def solde_restant(self, obj):
        return obj.solde_restant
    solde_restant.short_description = 'Solde restant'
    
    def jours_retard(self, obj):
        return obj.jours_retard
    jours_retard.short_description = 'Jours de retard'
