from django.contrib.auth.models import AbstractUser
from django.db import models

class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('gestionnaire', 'Gestionnaire'),
        ('comptable', 'Comptable'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='gestionnaire')
    telephone = models.CharField(max_length=20, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def has_module_permission(self, module):
        permissions = {
            'admin': ['biens', 'clients', 'contrats', 'paiements', 'depenses', 'analytics'],
            'gestionnaire': ['biens', 'clients', 'contrats', 'paiements'],
            'comptable': ['paiements', 'depenses', 'analytics'],
        }
        return module in permissions.get(self.role, [])
