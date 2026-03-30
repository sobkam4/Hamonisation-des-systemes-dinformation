#!/bin/bash

# Script de configuration complète du système d'audit
echo "🔍 Configuration du système d'audit et traçabilité..."

# Vérifier si les dépendances sont installées
echo "📦 Vérification des dépendances..."
pip install django-auditlog django-ipware user-agents django-extensions

# Créer les migrations
echo "🔄 Création des migrations..."
python manage.py makemigrations audit

# Appliquer les migrations
echo "🗄️ Application des migrations..."
python manage.py migrate

# Créer les répertoires de logs
echo "📁 Création des répertoires de logs..."
mkdir -p logs
mkdir -p logs/security
mkdir -p logs/audit
mkdir -p logs/system

# Créer un superutilisateur pour les tests
echo "👤 Création d'un superutilisateur de test..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(username='audit_admin').exists():
    User.objects.create_superuser(
        username='audit_admin',
        email='admin@audit.com',
        password='Audit123!',
        role='admin'
    )
    print("✅ Superutilisateur 'audit_admin' créé")
else:
    print("ℹ️  Superutilisateur 'audit_admin' existe déjà")
EOF

# Tester le système d'audit
echo "🧪 Test du système d'audit..."
python manage.py shell << EOF
from authentication.models import Utilisateur
from audit.models import AuditLog, SecurityEvent
from django.utils import timezone

# Créer un utilisateur de test
if not Utilisateur.objects.filter(username='test_user').exists():
    user = Utilisateur.objects.create_user(
        username='test_user',
        email='test@test.com',
        password='Test123!',
        role='gestionnaire'
    )
    print("✅ Utilisateur de test créé")
else:
    user = Utilisateur.objects.get(username='test_user')
    print("ℹ️  Utilisateur de test existe déjà")

# Tester le logging d'audit
from audit.models import AuditLog
log = AuditLog.log_action(
    user=user,
    action_type='create',
    content_object=user,
    severity='low',
    ip_address='127.0.0.1',
    user_agent='Test Agent'
)
print(f"✅ Log d'audit créé: {log}")

# Tester un événement de sécurité
event = SecurityEvent.create_event(
    event_type='failed_login',
    ip_address='192.168.1.100',
    description='Test de connexion échouée',
    severity='warning',
    details={'username': 'test_user'}
)
print(f"✅ Événement de sécurité créé: {event}")

# Vérifier les logs
audit_count = AuditLog.objects.count()
security_count = SecurityEvent.objects.count()
print(f"📊 Total logs d'audit: {audit_count}")
print(f"📊 Total événements sécurité: {security_count}")
EOF

# Afficher les informations de configuration
echo ""
echo "📋 Configuration terminée !"
echo "=========================="
echo ""
echo "🌐 Accès à l'interface d'administration:"
echo "   URL: http://localhost:8000/admin/"
echo "   Utilisateur: audit_admin"
echo "   Mot de passe: Audit123!"
echo ""
echo "📊 Endpoints API d'audit:"
echo "   Logs: http://localhost:8000/api/audit/logs/"
echo "   Sécurité: http://localhost:8000/api/audit/security/"
echo "   Statistiques: http://localhost:8000/api/audit/logs/statistics/"
echo ""
echo "📁 Fichiers de logs:"
echo "   Audit: logs/audit.log"
echo "   Sécurité: logs/security.log"
echo "   Système: logs/django.log"
echo ""
echo "🔧 Commandes utiles:"
echo "   Voir les logs: tail -f logs/audit.log"
echo "   Vérifier les migrations: python manage.py showmigrations audit"
echo "   Créer des logs de test: python manage.py shell"
echo ""
echo "✅ Système d'audit prêt à l'utilisation !"
