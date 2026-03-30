#!/bin/bash

# Script pour créer les migrations du module d'audit
echo "🔄 Création des migrations pour le module d'audit..."

# Créer les migrations pour le module audit
python manage.py makemigrations audit

echo "✅ Migrations créées avec succès !"

# Appliquer les migrations
echo "🗄️ Application des migrations..."
python manage.py migrate

echo "✅ Migrations appliquées avec succès !"

# Créer le répertoire de logs s'il n'existe pas
echo "📁 Création du répertoire de logs..."
mkdir -p logs

echo "✅ Configuration de l'audit terminée !"
