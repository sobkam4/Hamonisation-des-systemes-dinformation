#!/bin/bash
# Script pour appliquer les migrations des nouvelles apps

echo "Application des migrations pour notifications et documents..."

# Si vous utilisez Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "Utilisation de Docker Compose..."
    docker-compose exec backend python manage.py migrate notifications
    docker-compose exec backend python manage.py migrate documents
    docker-compose exec backend python manage.py migrate
else
    # Si vous exécutez directement
    echo "Exécution directe..."
    python manage.py migrate notifications
    python manage.py migrate documents
    python manage.py migrate
fi

echo "Migrations appliquées avec succès!"
