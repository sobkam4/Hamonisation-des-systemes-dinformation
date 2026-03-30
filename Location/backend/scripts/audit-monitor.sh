#!/bin/bash

# Script de monitoring du système d'audit
echo "🔍 Monitoring du système d'audit..."

# Vérifier si le serveur Django est en cours d'exécution
if ! pgrep -f "manage.py runserver" > /dev/null; then
    echo "❌ Le serveur Django n'est pas en cours d'exécution"
    echo "🚀 Démarrage du serveur..."
    python manage.py runserver &
    sleep 5
fi

# Fonction pour afficher les statistiques
show_stats() {
    echo ""
    echo "📊 Statistiques d'audit - $(date)"
    echo "=================================="
    
    python manage.py shell << EOF
from audit.models import AuditLog, SecurityEvent, SystemLog, DataAccessLog
from django.utils import timezone
from datetime import timedelta

# Logs d'audit
total_audit = AuditLog.objects.count()
recent_audit = AuditLog.objects.filter(
    timestamp__gte=timezone.now() - timedelta(hours=24)
).count()

# Événements de sécurité
total_security = SecurityEvent.objects.count()
critical_security = SecurityEvent.objects.filter(
    severity='critical',
    status__in=['new', 'investigating']
).count()

# Logs système
total_system = SystemLog.objects.count()
error_system = SystemLog.objects.filter(
    level__in=['ERROR', 'CRITICAL'],
    timestamp__gte=timezone.now() - timedelta(hours=24)
).count()

# Accès aux données
total_data_access = DataAccessLog.objects.count()
recent_data_access = DataAccessLog.objects.filter(
    timestamp__gte=timezone.now() - timedelta(hours=24)
).count()

print(f"📝 Logs d'audit: {total_audit} total, {recent_audit} dernières 24h")
print(f"🔒 Événements sécurité: {total_security} total, {critical_security} critiques")
print(f"🖥️  Logs système: {total_system} total, {error_system} erreurs récentes")
print(f"💾 Accès données: {total_data_access} total, {recent_data_access} dernières 24h")

# Top 5 des utilisateurs les plus actifs
from django.contrib.auth import get_user_model
User = get_user_model()

top_users = AuditLog.objects.values('user__username').annotate(
    count=models.Count('id')
).order_by('-count')[:5]

print("\n👥 Top 5 utilisateurs actifs:")
for user in top_users:
    if user['user__username']:
        print(f"   {user['user__username']}: {user['count']} actions")

# Événements de sécurité récents
recent_security_events = SecurityEvent.objects.filter(
    timestamp__gte=timezone.now() - timedelta(hours=1)
).order_by('-timestamp')[:5]

if recent_security_events:
    print("\n🚨 Événements de sécurité récents:")
    for event in recent_security_events:
        print(f"   {event.timestamp.strftime('%H:%M:%S')} - {event.get_event_type_display()} ({event.ip_address})")
else:
    print("\n✅ Aucun événement de sécurité récent")

EOF
}

# Fonction pour vérifier les logs d'erreurs
check_errors() {
    echo ""
    echo "🚨 Vérification des erreurs récentes"
    echo "================================="
    
    # Logs Django
    if [ -f "logs/django.log" ]; then
        echo "📋 Dernières erreurs Django:"
        tail -n 20 logs/django.log | grep -i error || echo "   ✅ Aucune erreur Django récente"
    fi
    
    # Logs de sécurité
    if [ -f "logs/security.log" ]; then
        echo "🔒 Derniers événements de sécurité:"
        tail -n 10 logs/security.log || echo "   ✅ Aucun événement de sécurité récent"
    fi
    
    # Logs d'audit
    if [ -f "logs/audit.log" ]; then
        echo "📝 Derniers logs d'audit:"
        tail -n 5 logs/audit.log || echo "   ✅ Aucun log d'audit récent"
    fi
}

# Fonction pour vérifier l'espace disque
check_disk_space() {
    echo ""
    echo "💾 Espace disque utilisé"
    echo "===================="
    
    # Taille des logs
    if [ -d "logs" ]; then
        echo "📁 Taille du répertoire logs:"
        du -sh logs/
        
        echo ""
        echo "📊 Taille par fichier de log:"
        find logs/ -name "*.log" -exec ls -lh {} \; | awk '{print $5, $9}'
    fi
    
    # Espace disque total
    echo ""
    echo "💽 Espace disque total:"
    df -h .
}

# Fonction pour vérifier les performances
check_performance() {
    echo ""
    echo "⚡ Vérification des performances"
    echo "==============================="
    
    python manage.py shell << EOF
from django.db import connection
from django.utils import timezone
from datetime import timedelta
import time

# Test de connexion à la base de données
start_time = time.time()
try:
    from audit.models import AuditLog
    count = AuditLog.objects.count()
    db_time = time.time() - start_time
    print(f"🗄️  Test DB: {count:.0f} logs en {db_time:.3f}s")
except Exception as e:
    print(f"❌ Erreur DB: {e}")

# Requêtes lentes récentes
from audit.models import SystemLog
slow_queries = SystemLog.objects.filter(
    category='performance',
    timestamp__gte=timezone.now() - timedelta(hours=1)
).count()

if slow_queries > 0:
    print(f"⚠️  {slow_queries} requêtes lentes détectées dans la dernière heure")
else:
    print("✅ Aucune requête lente détectée")

EOF
}

# Menu interactif
case "${1:-stats}" in
    "stats")
        show_stats
        ;;
    "errors")
        check_errors
        ;;
    "disk")
        check_disk_space
        ;;
    "performance")
        check_performance
        ;;
    "all")
        show_stats
        check_errors
        check_disk_space
        check_performance
        ;;
    "watch")
        echo "👀 Mode surveillance (Ctrl+C pour arrêter)"
        while true; do
            clear
            echo "🔍 Monitoring en temps réel - $(date)"
            echo "======================================"
            show_stats
            check_errors
            sleep 30
        done
        ;;
    *)
        echo "Usage: $0 {stats|errors|disk|performance|all|watch}"
        echo ""
        echo "Options:"
        echo "  stats      - Afficher les statistiques"
        echo "  errors     - Vérifier les erreurs"
        echo "  disk       - Vérifier l'espace disque"
        echo "  performance- Vérifier les performances"
        echo "  all        - Toutes les vérifications"
        echo "  watch      - Surveillance continue"
        exit 1
        ;;
esac

echo ""
echo "✅ Monitoring terminé"
