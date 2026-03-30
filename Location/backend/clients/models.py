from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth import get_user_model

User = get_user_model()

class Client(models.Model):
    telephone_validator = RegexValidator(
        regex=r'^\+?[\d\s-]{9,15}$',
        message="Le numéro de téléphone n'est pas valide."
    )
    
    nom = models.CharField(max_length=200)
    prenom = models.CharField(max_length=200)
    telephone = models.CharField(
        max_length=20, 
        validators=[telephone_validator],
        help_text="Format: +221 77 123 45 67"
    )
    email = models.EmailField(unique=True)
    adresse = models.TextField()
    piece_identite = models.CharField(
        max_length=50,
        help_text="CNI, Passeport, etc."
    )
    numero_piece_identite = models.CharField(max_length=50, blank=True, null=True)
    defaut_paiement = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients_crees')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ['nom', 'prenom']
    
    def __str__(self):
        return f"{self.prenom} {self.nom}"
    
    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"
    
    def marquer_defaut_paiement(self):
        self.defaut_paiement = True
        self.save()
    
    def lever_defaut_paiement(self):
        self.defaut_paiement = False
        self.save()
    
    def get_contrats_actifs(self):
        return self.contrat_set.filter(statut='actif')
    
    def get_nombre_contrats_actifs(self):
        return self.get_contrats_actifs().count()
    
    def _mettre_a_jour_defaut_paiement(self):
        """Met à jour automatiquement le statut defaut_paiement basé sur les paiements en retard"""
        from paiements.models import Paiement
        from django.utils import timezone
        
        # Récupérer tous les contrats actifs du client
        contrats_actifs = self.get_contrats_actifs()
        
        # Vérifier s'il y a des paiements en retard pour ces contrats
        paiements_en_retard = Paiement.objects.filter(
            contrat__in=contrats_actifs,
            statut='en_retard'
        ).exists()
        
        # Mettre à jour defaut_paiement
        if paiements_en_retard and not self.defaut_paiement:
            self.defaut_paiement = True
        elif not paiements_en_retard and self.defaut_paiement:
            # Optionnel : on peut garder le flag même si plus de retard
            # ou le réinitialiser automatiquement
            # self.defaut_paiement = False
            pass
    
    def save(self, *args, **kwargs):
        # Éviter la boucle infinie : si on est déjà en train de mettre à jour, ne pas recalculer
        skip_status_calc = kwargs.pop('skip_status_calc', False)
        
        # Ne pas mettre à jour le statut lors de la création (quand l'objet n'a pas encore d'ID)
        # ou si explicitement demandé
        if not skip_status_calc and self.pk:
            self._mettre_a_jour_defaut_paiement()
        
        super().save(*args, **kwargs)
