#!/bin/bash

# Script de test d'intégration pour l'ERP Location Immobilière
echo "🧪 Test d'intégration de l'ERP Location Immobilière..."

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Test 1: Construction des images
echo "🏗️  Test 1: Construction des images Docker..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Construction des images réussie"
else
    echo "❌ Échec de la construction des images"
    exit 1
fi

# Test 2: Démarrage des services
echo "🚀 Test 2: Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Test 3: Vérification de l'état des services
echo "🔍 Test 3: Vérification de l'état des services..."
services=("db" "redis" "backend" "frontend")

for service in "${services[@]}"; do
    status=$(docker-compose ps -q $service | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null)
    if [ "$status" = "running" ]; then
        echo "✅ $service: En cours d'exécution"
    else
        echo "❌ $service: Arrêté (status: $status)"
    fi
done

# Test 4: Connexion à la base de données
echo "🗄️  Test 4: Connexion à la base de données..."
docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Base de données accessible"
else
    echo "❌ Base de données inaccessible"
fi

# Test 5: API Backend
echo "🔌 Test 5: API Backend..."
sleep 10

# Test du schéma API
if curl -f http://localhost:8000/api/schema/ > /dev/null 2>&1; then
    echo "✅ API Backend accessible"
else
    echo "❌ API Backend inaccessible"
fi

# Test 6: Frontend
echo "🌐 Test 6: Frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend inaccessible"
fi

# Test 7: Documentation Swagger
echo "📚 Test 7: Documentation Swagger..."
if curl -f http://localhost:8000/api/docs/ > /dev/null 2>&1; then
    echo "✅ Documentation Swagger accessible"
else
    echo "❌ Documentation Swagger inaccessible"
fi

# Test 8: Admin Django
echo "👤 Test 8: Admin Django..."
if curl -f http://localhost:8000/admin/ > /dev/null 2>&1; then
    echo "✅ Admin Django accessible"
else
    echo "❌ Admin Django inaccessible"
fi

# Test 9: Migration de la base de données
echo "🔄 Test 9: Migration de la base de données..."
docker-compose exec -T backend python manage.py migrate --noinput

if [ $? -eq 0 ]; then
    echo "✅ Migration réussie"
else
    echo "❌ Échec de la migration"
fi

# Test 10: Création du superutilisateur (si nécessaire)
echo "👤 Test 10: Vérification du superutilisateur..."
user_count=$(docker-compose exec -T db psql -U postgres -d location_erp -t -c "SELECT COUNT(*) FROM authentication_utilisateur WHERE is_superuser = true;" 2>/dev/null | tr -d ' ')

if [ "$user_count" -gt 0 ]; then
    echo "✅ Superutilisateur existant"
else
    echo "⚠️  Aucun superutilisateur. Créez-en un avec:"
    echo "   docker-compose exec backend python manage.py createsuperuser"
fi

# Test 11: Collecte des fichiers statiques
echo "📦 Test 11: Collecte des fichiers statiques..."
docker-compose exec -T backend python manage.py collectstatic --noinput

if [ $? -eq 0 ]; then
    echo "✅ Fichiers statiques collectés"
else
    echo "❌ Échec de la collecte des fichiers statiques"
fi

# Test 12: Vérification des logs d'erreurs
echo "📋 Test 12: Vérification des logs d'erreurs..."
error_logs=$(docker-compose logs --tail=50 | grep -i error | wc -l)

if [ "$error_logs" -eq 0 ]; then
    echo "✅ Aucune erreur détectée dans les logs récents"
else
    echo "⚠️  $error_logs erreurs détectées dans les logs récents"
fi

# Résumé final
echo ""
echo "📊 Résumé des tests:"
echo "=================="
echo "🌐 Accès à l'application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000/api"
echo "   Documentation: http://localhost:8000/api/docs"
echo "   Admin Django: http://localhost:8000/admin"
echo ""
echo "📚 Commandes utiles:"
echo "   Voir les logs: docker-compose logs -f"
echo "   Arrêter: docker-compose down"
echo "   Redémarrer: docker-compose restart"
echo "   Mettre à jour: docker-compose pull && docker-compose up -d --build"
echo ""
echo "✅ Tests d'intégration terminés !"
