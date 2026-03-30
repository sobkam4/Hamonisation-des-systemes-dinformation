from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator

User = get_user_model()

class Document(models.Model):
    TYPE_CHOICES = [
        ('contrat', 'Contrat de location'),
        ('quittance', 'Quittance de loyer'),
        ('facture', 'Facture'),
        ('recu', 'Reçu de paiement'),
        ('piece_identite', 'Pièce d\'identité'),
        ('justificatif', 'Justificatif'),
        ('photo', 'Photo'),
        ('autre', 'Autre'),
    ]
    
    type_document = models.CharField(max_length=50, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    fichier = models.FileField(
        upload_to='documents/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'])]
    )
    
    # Relations optionnelles
    bien = models.ForeignKey('biens.Bien', on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    client = models.ForeignKey('clients.Client', on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    contrat = models.ForeignKey('contrats.Contrat', on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    paiement = models.ForeignKey('paiements.Paiement', on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents_crees')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['type_document']),
            models.Index(fields=['bien']),
            models.Index(fields=['client']),
        ]
    
    def __str__(self):
        return f"{self.titre} - {self.get_type_document_display()}"
