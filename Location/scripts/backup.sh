#!/bin/bash

# Script de sauvegarde pour l'ERP Location Immobilière
echo "💾 Sauvegarde de l'ERP Location Immobilière..."

# Créer le répertoire de backup
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Sauvegarder la base de données
echo "📊 Sauvegarde de la base de données..."
docker-compose exec -T db pg_dump -U postgres location_erp > "$BACKUP_DIR/database.sql"

# Sauvegarder les fichiers médias
echo "📁 Sauvegarde des fichiers médias..."
docker run --rm -v location_media_volume:/data -v "$PWD/$BACKUP_DIR":/backup alpine tar czf /backup/media.tar.gz -C /data .

# Sauvegarder les fichiers statiques
echo "📦 Sauvegarde des fichiers statiques..."
docker run --rm -v location_static_volume:/data -v "$PWD/$BACKUP_DIR":/backup alpine tar czf /backup/static.tar.gz -C /data .

# Sauvegarder la configuration
echo "⚙️  Sauvegarde de la configuration..."
cp .env "$BACKUP_DIR/.env"
cp docker-compose.prod.yml "$BACKUP_DIR/docker-compose.prod.yml"
cp nginx/nginx.conf "$BACKUP_DIR/nginx.conf"

# Créer un archive complète
echo "📦 Création de l'archive complète..."
tar czf "$BACKUP_DIR.tar.gz" -C ./backups "$(basename $BACKUP_DIR)"

# Nettoyer le répertoire temporaire
rm -rf "$BACKUP_DIR"

# Nettoyer les anciens backups (garder 7 jours)
echo "🧹 Nettoyage des anciennes sauvegardes..."
find ./backups -name "*.tar.gz" -mtime +7 -delete

echo "✅ Sauvegarde terminée : $BACKUP_DIR.tar.gz"
echo "💾 Espace utilisé : $(du -h "$BACKUP_DIR.tar.gz" | cut -f1)"

# Afficher les backups disponibles
echo ""
echo "📋 Sauvegardes disponibles :"
ls -lh ./backups/*.tar.gz 2>/dev/null || echo "Aucune sauvegarde trouvée"
