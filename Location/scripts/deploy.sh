#!/bin/bash

# Script de déploiement pour l'ERP Location Immobilière
echo "🚀 Déploiement de l'ERP Location Immobilière en production..."

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé. Veuillez copier .env.example vers .env et le configurer."
    exit 1
fi

# Backup avant déploiement
echo "💾 Sauvegarde avant déploiement..."
./scripts/backup.sh

# Mettre à jour le code
echo "📥 Mise à jour du code..."
git pull origin main

# Construire les nouvelles images
echo "🐳 Construction des images Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Arrêter les anciens services
echo "🛑 Arrêt des services actuels..."
docker-compose -f docker-compose.prod.yml down

# Démarrer les nouveaux services
echo "🚀 Démarrage des services de production..."
docker-compose -f docker-compose.prod.yml up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 60

# Vérifier l'état des services
echo "🔍 Vérification de l'état des services..."
docker-compose -f docker-compose.prod.yml ps

# Appliquer les migrations
echo "🗄️  Application des migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

# Collecter les fichiers statiques
echo "📦 Collecte des fichiers statiques..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

# Vérifier que tous les services sont en cours d'exécution
echo "🔍 Vérification finale des services..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Déploiement réussi !"
    echo ""
    echo "🌐 Accès à l'application :"
    echo "   Site: https://yourdomain.com"
    echo "   API: https://yourdomain.com/api"
    echo "   Documentation: https://yourdomain.com/api/docs"
    echo "   Admin: https://yourdomain.com/admin"
else
    echo "❌ Erreur lors du déploiement. Certains services ne sont pas démarrés."
    echo "📋 Logs des services :"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi
