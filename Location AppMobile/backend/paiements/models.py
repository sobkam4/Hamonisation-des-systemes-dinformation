from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.contrib.auth import get_user_model
from contrats.models import Contrat

User = get_user_model()

class Paiement(models.Model):
    TYPE_PAIEMENT_CHOICES = [
        ('especes', 'Espèces'),
        ('virement', 'Virement bancaire'),
        ('mobile_money', 'Mobile Money'),
        ('cheque', 'Chèque'),
    ]
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('partiel', 'Partiel'),
        ('paye', 'Payé'),
        ('en_retard', 'En retard'),
        ('annule', 'Annulé'),
    ]
    
    contrat = models.ForeignKey(Contrat, on_delete=models.CASCADE)
    date_paiement = models.DateField()
    date_echeance = models.DateField()
    mois_paye = models.CharField(max_length=20, blank=True, null=True, help_text="Mois pour lequel le paiement est effectué (format: YYYY-MM)")
    montant = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    montant_du = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    type_paiement = models.CharField(max_length=20, choices=TYPE_PAIEMENT_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    reference_paiement = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='paiements_crees')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        ordering = ['-date_echeance']
    
    def __str__(self):
        return f"Paiement {self.id} - {self.contrat.client.nom_complet} - {self.montant} GNF"
    
    def save(self, *args, **kwargs):
        if not self.montant_du:
            self.montant_du = self.contrat.montant_mensuel
        
        # Éviter la boucle infinie : si on est déjà en train de mettre à jour le statut, ne pas recalculer
        updating_status = kwargs.pop('updating_status', False)
        
        # Calculer le nouveau statut avant la sauvegarde
        if not updating_status:
            self._calculer_statut()
        
        # Sauvegarder
        super().save(*args, **kwargs)
    
    def _calculer_statut(self):
        """Calcule et met à jour le statut du paiement en fonction du montant et de la date d'échéance"""
        today = timezone.now().date()
        
        # Ne pas modifier si le statut est 'annule'
        if self.statut == 'annule':
            return
        
        # Vérifier d'abord le montant
        if self.montant >= self.montant_du:
            nouveau_statut = 'paye'
        elif self.montant > 0:
            nouveau_statut = 'partiel'
        elif self.date_echeance < today:
            nouveau_statut = 'en_retard'
        else:
            nouveau_statut = 'en_attente'
        
        # Mettre à jour seulement si le statut a changé
        if nouveau_statut and nouveau_statut != self.statut:
            self.statut = nouveau_statut
    
    @property
    def solde_restant(self):
        return max(0, self.montant_du - self.montant)
    
    @property
    def est_en_retard(self):
        return self.statut == 'en_retard' or (
            self.statut == 'en_attente' and self.date_echeance < timezone.now().date()
        )
    
    @property
    def jours_retard(self):
        if self.est_en_retard:
            return (timezone.now().date() - self.date_echeance).days
        return 0
    
    def marquer_paye(self, montant_paye=None):
        if montant_paye:
            self.montant = montant_paye
        self._calculer_statut()
        self.save(updating_status=True)
    
    def generer_reference(self):
        import uuid
        self.reference_paiement = f"PAY-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        self.save(update_fields=['reference_paiement'])
