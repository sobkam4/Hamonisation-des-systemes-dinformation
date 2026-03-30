#!/usr/bin/env python
"""
Script de test pour le stockage MinIO/S3
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'location_erp.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from storage_utils import MinIOStorage, setup_minio_storage, test_storage, get_storage_info


def test_minio_connection():
    """Test la connexion à MinIO"""
    print("=== Test de connexion MinIO ===")
    
    storage = MinIOStorage()
    
    if not storage.client:
        print("❌ Client MinIO non initialisé")
        return False
    
    try:
        # Test de listing des buckets
        buckets = storage.client.list_buckets()
        print(f"✅ Connexion réussie - Buckets disponibles: {[b['Name'] for b in buckets['Buckets']]}")
        return True
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False


def test_file_operations():
    """Test les opérations sur fichiers"""
    print("\n=== Test des opérations sur fichiers ===")
    
    storage = MinIOStorage()
    
    # Créer un fichier de test
    test_content = b"Contenu de test pour MinIO"
    test_file = SimpleUploadedFile("test.txt", test_content)
    
    # Test d'upload
    try:
        # Sauvegarder avec le storage Django
        file_path = default_storage.save('test/test.txt', test_file)
        print(f"✅ Fichier uploadé: {file_path}")
        
        # Vérifier que le fichier existe
        if default_storage.exists(file_path):
            print("✅ Fichier vérifié dans le storage")
            
            # Générer une URL
            url = storage.get_file_url(file_path)
            if url:
                print(f"✅ URL générée: {url}")
            else:
                print("❌ Erreur lors de la génération de l'URL")
            
            # Nettoyer
            default_storage.delete(file_path)
            print("✅ Fichier supprimé")
            
            return True
        else:
            print("❌ Fichier non trouvé dans le storage")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors des opérations: {e}")
        return False


def test_django_models():
    """Test l'intégration avec les modèles Django"""
    print("\n=== Test d'intégration Django ===")
    
    try:
        from biens.models import Bien
        from django.core.files import File
        
        # Créer un bien de test avec image
        test_image_content = b"fake image content"
        test_image = SimpleUploadedFile("test.jpg", test_image_content, content_type="image/jpeg")
        
        # Simuler la sauvegarde (sans créer réellement le bien)
        image_path = default_storage.save('biens/test.jpg', test_image)
        print(f"✅ Image de bien sauvegardée: {image_path}")
        
        # Vérifier l'accès
        if default_storage.exists(image_path):
            print("✅ Image accessible")
            
            # Nettoyer
            default_storage.delete(image_path)
            print("✅ Image supprimée")
            
            return True
        else:
            print("❌ Image non accessible")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test Django: {e}")
        return False


def main():
    """Fonction principale de test"""
    print("🧪 Test complet du stockage MinIO/S3")
    print("=" * 50)
    
    # Afficher la configuration actuelle
    info = get_storage_info()
    print(f"Configuration actuelle: {info['type']}")
    print(f"Bucket: {info.get('bucket', 'N/A')}")
    print(f"Endpoint: {info.get('endpoint', 'N/A')}")
    
    if not settings.USE_S3:
        print("\n⚠️  MinIO n'est pas activé (USE_S3=False)")
        print("Activez-le avec: export USE_S3=true")
        return
    
    # Tests
    tests = [
        ("Connexion MinIO", test_minio_connection),
        ("Opérations fichiers", test_file_operations),
        ("Intégration Django", test_django_models),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
            results.append((test_name, False))
    
    # Résumé
    print("\n" + "=" * 50)
    print("📊 Résumé des tests:")
    
    success_count = 0
    for test_name, success in results:
        status = "✅ SUCCÈS" if success else "❌ ÉCHEC"
        print(f"  {test_name}: {status}")
        if success:
            success_count += 1
    
    print(f"\n🎯 Résultat: {success_count}/{len(results)} tests réussis")
    
    if success_count == len(results):
        print("🎉 Tous les tests sont passés ! Le stockage MinIO est fonctionnel.")
    else:
        print("⚠️  Certains tests ont échoué. Vérifiez la configuration MinIO.")


if __name__ == "__main__":
    main()
