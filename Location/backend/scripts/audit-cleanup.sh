#!/bin/bash

# Script de nettoyage des logs d'audit
echo "🧹 Nettoyage des logs d'audit..."

# Configuration
RETENTION_DAYS=${1:-90}  # Période de rétention par défaut: 90 jours
DRY_RUN=${2:-false}     # Mode simulation par défaut

echo "📅 Période de rétention: $RETENTION_DAYS jours"
echo "🔍 Mode simulation: $DRY_RUN"

# Fonction pour nettoyer les logs de la base de données
cleanup_database_logs() {
    echo ""
    echo "🗄️ Nettoyage des logs en base de données"
    echo "======================================"
    
    python manage.py shell << EOF
from django.utils import timezone
from datetime import timedelta
from audit.models import AuditLog, SecurityEvent, SystemLog, DataAccessLog

# Date limite
cutoff_date = timezone.now() - timedelta(days=$RETENTION_DAYS)
print(f"📅 Date limite: {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")

# Logs d'audit
audit_count = AuditLog.objects.filter(timestamp__lt=cutoff_date).count()
print(f"📝 Logs d'audit à supprimer: {audit_count}")

if not $DRY_RUN:
    deleted_audit = AuditLog.objects.filter(timestamp__lt=cutoff_date).delete()[0]
    print(f"✅ {deleted_audit} logs d'audit supprimés")

# Événements de sécurité (conservation plus longue)
security_count = SecurityEvent.objects.filter(
    timestamp__lt=cutoff_date,
    status='resolved'
).count()
print(f"🔒 Événements sécurité résolus à supprimer: {security_count}")

if not $DRY_RUN:
    deleted_security = SecurityEvent.objects.filter(
        timestamp__lt=cutoff_date,
        status='resolved'
    ).delete()[0]
    print(f"✅ {deleted_security} événements sécurité supprimés")

# Logs système
system_count = SystemLog.objects.filter(timestamp__lt=cutoff_date).count()
print(f"🖥️  Logs système à supprimer: {system_count}")

if not $DRY_RUN:
    deleted_system = SystemLog.objects.filter(timestamp__lt=cutoff_date).delete()[0]
    print(f"✅ {deleted_system} logs système supprimés")

# Logs d'accès aux données
data_access_count = DataAccessLog.objects.filter(timestamp__lt=cutoff_date).count()
print(f"💾 Logs d'accès données à supprimer: {data_access_count}")

if not $DRY_RUN:
    deleted_data_access = DataAccessLog.objects.filter(timestamp__lt=cutoff_date).delete()[0]
    print(f"✅ {deleted_data_access} logs d'accès données supprimés")

EOF
}

# Fonction pour nettoyer les fichiers de logs
cleanup_log_files() {
    echo ""
    echo "📁 Nettoyage des fichiers de logs"
    echo "==============================="
    
    # Répertoire des logs
    LOG_DIR="logs"
    
    if [ ! -d "$LOG_DIR" ]; then
        echo "ℹ️  Répertoire $LOG_DIR non trouvé"
        return
    fi
    
    echo "📋 Fichiers de logs plus anciens que $RETENTION_DAYS jours:"
    
    # Trouver les anciens fichiers de logs
    find "$LOG_DIR" -name "*.log" -type f -mtime +$RETENTION_DAYS -print | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "   📄 $file ($size)"
        
        if [ "$DRY_RUN" = false ]; then
            # Archiver avant de supprimer
            archive_file="${file}.archive.$(date +%Y%m%d)"
            mv "$file" "$archive_file"
            gzip "$archive_file"
            echo "   ✅ Archivé: $archive_file.gz"
        fi
    done
    
    # Nettoyer les archives très anciennes (1 an)
    echo ""
    echo "🗃️  Nettoyage des archives (> 1 an):"
    find "$LOG_DIR" -name "*.log.archive.*.gz" -type f -mtime +365 -print | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "   📄 $file ($size)"
        
        if [ "$DRY_RUN" = false ]; then
            rm "$file"
            echo "   🗑️  Supprimé: $file"
        fi
    done
}

# Fonction pour optimiser la base de données
optimize_database() {
    echo ""
    echo "⚡ Optimisation de la base de données"
    echo "==================================="
    
    if [ "$DRY_RUN" = false ]; then
        echo "🔧 VACUUM de la base de données..."
        python manage.py dbshell << EOF
VACUUM ANALYZE;
EOF
        echo "✅ Base de données optimisée"
    else
        echo "ℹ️  VACUUM serait exécuté en mode normal"
    fi
}

# Fonction pour afficher les statistiques avant/après
show_statistics() {
    echo ""
    echo "📊 Statistiques actuelles"
    echo "======================"
    
    python manage.py shell << EOF
from audit.models import AuditLog, SecurityEvent, SystemLog, DataAccessLog

print(f"📝 Logs d'audit: {AuditLog.objects.count()}")
print(f"🔒 Événements sécurité: {SecurityEvent.objects.count()}")
print(f"🖥️  Logs système: {SystemLog.objects.count()}")
print(f"💾 Accès données: {DataAccessLog.objects.count()}")

# Taille estimée de la base de données
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()));")
    db_size = cursor.fetchone()[0]
    print(f"💽 Taille base de données: {db_size}")

EOF
}

# Vérification des permissions
check_permissions() {
    echo ""
    echo "🔐 Vérification des permissions"
    echo "============================="
    
    # Vérifier si l'utilisateur a les droits nécessaires
    if [ ! -w "logs" ]; then
        echo "❌ Pas d'accès en écriture au répertoire logs"
        return 1
    fi
    
    if [ ! -r "logs" ]; then
        echo "❌ Pas d'accès en lecture au répertoire logs"
        return 1
    fi
    
    echo "✅ Permissions vérifiées"
    return 0
}

# Menu principal
main() {
    echo "🧹 Script de nettoyage des logs d'audit"
    echo "====================================="
    
    # Vérifier les permissions
    if ! check_permissions; then
        echo "❌ Erreur de permissions"
        exit 1
    fi
    
    # Afficher les statistiques avant
    echo "📊 Statistiques avant nettoyage:"
    show_statistics
    
    # Nettoyer la base de données
    cleanup_database_logs
    
    # Nettoyer les fichiers
    cleanup_log_files
    
    # Optimiser la base de données
    optimize_database
    
    # Afficher les statistiques après
    if [ "$DRY_RUN" = false ]; then
        echo ""
        echo "📊 Statistiques après nettoyage:"
        show_statistics
    fi
    
    echo ""
    echo "✅ Nettoyage terminé"
    
    if [ "$DRY_RUN" = true ]; then
        echo "ℹ️  Mode simulation - Aucune modification effectuée"
        echo "🚀 Pour exécuter réellement: $0 $RETENTION_DAYS false"
    else
        echo "🗃️  Les anciens logs ont été archivés ou supprimés"
        echo "💾 La base de données a été optimisée"
    fi
}

# Aide
show_help() {
    echo "Usage: $0 [JOURS] [DRY_RUN]"
    echo ""
    echo "Arguments:"
    echo "  JOURS     - Période de rétention en jours (défaut: 90)"
    echo "  DRY_RUN   - 'true' pour simulation, 'false' pour exécution (défaut: false)"
    echo ""
    echo "Exemples:"
    echo "  $0              - Nettoie les logs de plus de 90 jours"
    echo "  $0 30           - Nettoie les logs de plus de 30 jours"
    echo "  $0 365 true     - Simulation pour les logs de plus de 1 an"
    echo ""
}

# Vérifier les arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Convertir DRY_RUN en booléen
if [ "$2" = "true" ]; then
    DRY_RUN=true
elif [ "$2" = "false" ]; then
    DRY_RUN=false
fi

# Exécuter le nettoyage
main
