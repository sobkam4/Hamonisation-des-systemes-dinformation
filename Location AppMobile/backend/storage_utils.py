"""
Utilitaires pour le stockage MinIO/S3
"""
import os
from django.core.files.storage import default_storage
from django.conf import settings
import boto3
from botocore.exceptions import ClientError, NoCredentialsError


class MinIOStorage:
    """Classe utilitaire pour gérer le stockage MinIO"""
    
    def __init__(self):
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        self.client = None
        self._init_client()
    
    def _init_client(self):
        """Initialise le client MinIO"""
        if settings.USE_S3:
            try:
                self.client = boto3.client(
                    's3',
                    endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME,
                )
            except NoCredentialsError:
                print("Erreur: Credentials MinIO non trouvés")
    
    def create_bucket(self):
        """Crée le bucket s'il n'existe pas"""
        if not self.client:
            return False
        
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            print(f"Bucket {self.bucket_name} existe déjà")
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                try:
                    self.client.create_bucket(Bucket=self.bucket_name)
                    print(f"Bucket {self.bucket_name} créé avec succès")
                    return True
                except ClientError as create_error:
                    print(f"Erreur lors de la création du bucket: {create_error}")
                    return False
            else:
                print(f"Erreur lors de la vérification du bucket: {e}")
                return False
    
    def set_bucket_public(self):
        """Rend le bucket public"""
        if not self.client:
            return False
        
        try:
            # Configuration de la politique publique
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": f"arn:aws:s3:::{self.bucket_name}/*"
                    }
                ]
            }
            
            self.client.put_bucket_policy(
                Bucket=self.bucket_name,
                Policy=str(policy).replace("'", '"')
            )
            print(f"Bucket {self.bucket_name} rendu public")
            return True
        except ClientError as e:
            print(f"Erreur lors de la configuration du bucket public: {e}")
            return False
    
    def upload_file(self, file_path, object_name=None):
        """Upload un fichier vers MinIO"""
        if not self.client:
            return False
        
        if object_name is None:
            object_name = os.path.basename(file_path)
        
        try:
            self.client.upload_file(file_path, self.bucket_name, object_name)
            print(f"Fichier {file_path} uploadé vers {object_name}")
            return True
        except ClientError as e:
            print(f"Erreur lors de l'upload: {e}")
            return False
    
    def list_files(self, prefix=''):
        """Liste les fichiers dans le bucket"""
        if not self.client:
            return []
        
        try:
            response = self.client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            return [obj['Key'] for obj in response.get('Contents', [])]
        except ClientError as e:
            print(f"Erreur lors de la liste des fichiers: {e}")
            return []
    
    def get_file_url(self, object_name, expires_in=3600):
        """Génère une URL pré-signée pour un fichier"""
        if not self.client:
            return None
        
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            print(f"Erreur lors de la génération de l'URL: {e}")
            return None
    
    def delete_file(self, object_name):
        """Supprime un fichier du bucket"""
        if not self.client:
            return False
        
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=object_name)
            print(f"Fichier {object_name} supprimé")
            return True
        except ClientError as e:
            print(f"Erreur lors de la suppression: {e}")
            return False


def setup_minio_storage():
    """Configure le stockage MinIO au démarrage"""
    if settings.USE_S3:
        storage = MinIOStorage()
        
        # Créer le bucket
        storage.create_bucket()
        
        # Rendre le bucket public
        storage.set_bucket_public()
        
        print("Configuration MinIO terminée")
        return storage
    else:
        print("MinIO désactivé, utilisation du stockage local")
        return None


def get_storage_info():
    """Retourne les informations sur le stockage configuré"""
    if settings.USE_S3:
        return {
            'type': 'MinIO/S3',
            'bucket': settings.AWS_STORAGE_BUCKET_NAME,
            'endpoint': settings.AWS_S3_ENDPOINT_URL,
            'region': settings.AWS_S3_REGION_NAME,
            'media_url': settings.MEDIA_URL,
            'static_url': settings.STATIC_URL,
        }
    else:
        return {
            'type': 'Local',
            'media_root': settings.MEDIA_ROOT,
            'static_root': settings.STATIC_ROOT,
            'media_url': settings.MEDIA_URL,
            'static_url': settings.STATIC_URL,
        }


# Test du stockage
def test_storage():
    """Test la configuration du stockage"""
    print("=== Test du stockage ===")
    
    info = get_storage_info()
    print(f"Type de stockage: {info['type']}")
    
    if settings.USE_S3:
        storage = MinIOStorage()
        
        # Test de connexion
        if storage.client:
            print("✅ Connexion MinIO réussie")
            
            # Test de bucket
            if storage.create_bucket():
                print("✅ Bucket accessible")
                
                # Test d'upload
                test_file = "test.txt"
                with open(test_file, 'w') as f:
                    f.write("Test file")
                
                if storage.upload_file(test_file, "test/test.txt"):
                    print("✅ Upload réussi")
                    
                    # Test de liste
                    files = storage.list_files("test/")
                    if files:
                        print(f"✅ Fichiers trouvés: {files}")
                    
                    # Nettoyage
                    storage.delete_file("test/test.txt")
                    os.remove(test_file)
                    print("✅ Nettoyage terminé")
                else:
                    print("❌ Upload échoué")
            else:
                print("❌ Bucket inaccessible")
        else:
            print("❌ Connexion MinIO échouée")
    else:
        print("✅ Stockage local configuré")
    
    print("=== Fin du test ===")
