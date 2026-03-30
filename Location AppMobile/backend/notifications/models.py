from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Notification(models.Model):
    TYPE_CHOICES = [
        ('paiement_retard', 'Paiement en retard'),
        ('echeance_proche', 'Échéance proche'),
        ('contrat_expiration', 'Contrat expirant'),
        ('maintenance_requise', 'Maintenance requise'),
        ('nouveau_paiement', 'Nouveau paiement'),
        ('nouveau_contrat', 'Nouveau contrat'),
        ('document_ajoute', 'Document ajouté'),
        ('systeme', 'Système'),
        ('autre', 'Autre'),
    ]
    
    PRIORITE_CHOICES = [
        ('faible', 'Faible'),
        ('normale', 'Normale'),
        ('haute', 'Haute'),
        ('urgente', 'Urgente'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type_notification = models.CharField(max_length=50, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200)
    message = models.TextField()
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='normale')
    lu = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_lecture = models.DateTimeField(null=True, blank=True)
    
    # Liens vers les entités concernées (optionnels)
    bien_id = models.IntegerField(null=True, blank=True)
    client_id = models.IntegerField(null=True, blank=True)
    contrat_id = models.IntegerField(null=True, blank=True)
    paiement_id = models.IntegerField(null=True, blank=True)
    
    # Données supplémentaires (JSON)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['user', 'lu']),
            models.Index(fields=['type_notification']),
        ]
    
    def __str__(self):
        return f"{self.titre} - {self.user.username}"
    
    def marquer_comme_lu(self):
        if not self.lu:
            self.lu = True
            self.date_lecture = timezone.now()
            self.save(update_fields=['lu', 'date_lecture'])
