#!/bin/bash

# Script de configuration pour MinIO
echo "🗄️  Configuration de MinIO pour l'ERP Location Immobilière"

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker."
    exit 1
fi

# Démarrer les services MinIO
echo "🚀 Démarrage des services MinIO..."
docker-compose up -d minio

# Attendre que MinIO soit prêt
echo "⏳ Attente du démarrage de MinIO..."
sleep 10

# Vérifier si MinIO est accessible
echo "🔍 Vérification de MinIO..."
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO API accessible"
else
    echo "❌ MinIO API non accessible"
    exit 1
fi

# Créer le bucket
echo "📦 Création du bucket..."
docker-compose run --rm minio-setup

# Vérifier la console MinIO
echo "🖥️  Vérification de la console MinIO..."
if curl -f http://localhost:9001 > /dev/null 2>&1; then
    echo "✅ Console MinIO accessible"
else
    echo "❌ Console MinIO non accessible"
fi

# Afficher les informations d'accès
echo ""
echo "📋 Informations d'accès MinIO:"
echo "==============================="
echo "🌐 API MinIO: http://localhost:9000"
echo "🖥️  Console MinIO: http://localhost:9001"
echo "👤 Utilisateur: minioadmin"
echo "🔑 Mot de passe: minioadmin123"
echo "📦 Bucket: location-erp"
echo ""
echo "🔧 Configuration Django:"
echo "======================="
echo "USE_S3=true"
echo "AWS_ACCESS_KEY_ID=minioadmin"
echo "AWS_SECRET_ACCESS_KEY=minioadmin123"
echo "AWS_STORAGE_BUCKET_NAME=location-erp"
echo "AWS_S3_ENDPOINT_URL=http://minio:9000"
echo ""
echo "📚 Commandes utiles:"
echo "==================="
echo "# Lister les buckets:"
echo "docker-compose exec minio mc ls myminio"
echo ""
echo "# Lister les fichiers dans le bucket:"
echo "docker-compose exec minio mc ls myminio/location-erp"
echo ""
echo "# Upload un fichier:"
echo "docker-compose exec minio mc cp /path/to/file myminio/location-erp/"
echo ""
echo "# Télécharger un fichier:"
echo "docker-compose exec minio mc cp myminio/location-erp/filename /path/to/destination"
echo ""
echo "✅ Configuration MinIO terminée !"
