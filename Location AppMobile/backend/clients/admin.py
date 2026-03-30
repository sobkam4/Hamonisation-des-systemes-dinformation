from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['nom_complet', 'email', 'telephone', 'defaut_paiement', 'date_creation']
    list_filter = ['defaut_paiement', 'date_creation', 'piece_identite']
    search_fields = ['nom', 'prenom', 'email', 'telephone']
    ordering = ['nom', 'prenom']
    readonly_fields = ['date_creation', 'date_modification']
    
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('nom', 'prenom', 'email', 'telephone', 'adresse')
        }),
        ('Pièce d\'identité', {
            'fields': ('piece_identite', 'numero_piece_identite')
        }),
        ('Statut', {
            'fields': ('defaut_paiement',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def nom_complet(self, obj):
        return obj.nom_complet
    nom_complet.short_description = 'Nom complet'
