#!/bin/bash

# Script de configuration pour l'ERP Location Immobilière
echo "🚀 Configuration de l'ERP Location Immobilière..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p nginx/logs
mkdir -p nginx/ssl
mkdir -p backups

# Copier le fichier d'environnement
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "⚠️  Veuillez éditer le fichier .env avec vos configurations."
fi

# Donner les permissions nécessaires
echo "🔐 Configuration des permissions..."
chmod +x scripts/*.sh
chmod 755 nginx/logs

# Construire les images Docker
echo "🐳 Construction des images Docker..."
docker-compose build

# Lancer les services
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier l'état des services
echo "🔍 Vérification de l'état des services..."
docker-compose ps

# Créer le superutilisateur Django
echo "👤 Création du superutilisateur Django..."
docker-compose exec backend python manage.py createsuperuser

# Appliquer les migrations
echo "🗄️  Application des migrations..."
docker-compose exec backend python manage.py migrate

# Collecter les fichiers statiques
echo "📦 Collecte des fichiers statiques..."
docker-compose exec backend python manage.py collectstatic --noinput

echo "✅ Configuration terminée !"
echo ""
echo "🌐 Accès à l'application :"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000/api"
echo "   Documentation API: http://localhost:8000/api/docs"
echo "   Admin Django: http://localhost:8000/admin"
echo ""
echo "📚 Commandes utiles :"
echo "   Voir les logs: docker-compose logs -f"
echo "   Arrêter: docker-compose down"
echo "   Redémarrer: docker-compose restart"
echo "   Mettre à jour: docker-compose pull && docker-compose up -d --build"
