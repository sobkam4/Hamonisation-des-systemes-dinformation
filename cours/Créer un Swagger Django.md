Voici une version **organisée et structurée** de ton guide pour intégrer **Swagger/OpenAPI dans Django REST Framework**. J’ai mis en forme les étapes pour que ce soit plus lisible et directement exploitable 👇  

---

# 🚀 Guide complet : Intégrer Swagger/OpenAPI dans Django REST Framework

## ✅ Étape 1 : Vérifier les prérequis
- Projet Django avec **Django REST Framework** installé  
- **Python 3.7+**  
- Environnement virtuel activé (recommandé)  
- Vérifier que `djangorestframework` est dans `requirements.txt` :
```txt
djangorestframework==3.16.1
```

---

## 📦 Étape 2 : Installer `drf-yasg`
1. Ajouter la dépendance dans `requirements.txt` :
```txt
drf-yasg==1.21.7
```
2. Installer le package :
```bash
pip install drf-yasg==1.21.7
# ou
pip install -r requirements.txt
```

---

## ⚙️ Étape 3 : Configurer `settings.py`
1. Ajouter `drf_yasg` dans `INSTALLED_APPS` :
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'drf_yasg',  # ← Ajout
]
```

2. (Optionnel) Configurer Swagger pour JWT :
```python
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Format: Bearer <token>'
        }
    },
    'USE_SESSION_AUTH': False,
    'JSON_EDITOR': True,
    'SUPPORTED_SUBMIT_METHODS': ['get','post','put','delete','patch'],
    'OPERATIONS_SORTER': 'alpha',
    'TAGS_SORTER': 'alpha',
    'DOC_EXPANSION': 'none',
    'DEEP_LINKING': True,
    'SHOW_EXTENSIONS': True,
    'DEFAULT_MODEL_RENDERING': 'example'
}

REDOC_SETTINGS = {
    'LAZY_RENDERING': False,
}
```

---

## 🌐 Étape 4 : Configurer les URLs
1. Ouvrir `urls.py` principal  
2. Ajouter les imports :
```python
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
```

3. Créer la vue du schéma :
```python
schema_view = get_schema_view(
   openapi.Info(
      title="Mon API",
      default_version='v1',
      description="Documentation de mon API",
      contact=openapi.Contact(email="votre-email@example.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)
```

4. Ajouter les routes Swagger :
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/', include('your_app.urls')),
]
```

---

## 🧪 Étape 5 : Tester l’installation
1. Démarrer le serveur :
```bash
python manage.py runserver
```
2. Accéder à la documentation :
- Swagger UI → [http://localhost:8000/swagger/](http://localhost:8000/swagger/)  
- ReDoc → [http://localhost:8000/redoc/](http://localhost:8000/redoc/)  
- JSON Schema → [http://localhost:8000/swagger.json](http://localhost:8000/swagger.json)  
- YAML Schema → [http://localhost:8000/swagger.yaml](http://localhost:8000/swagger.yaml)  

---

## 🎨 Étape 6 : Personnalisation avancée (optionnel)
- **Tags pour organiser les endpoints** :
```python
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class MyView(APIView):
    @swagger_auto_schema(
        tags=['Authentication'],
        operation_summary="Connexion utilisateur",
        operation_description="Permet à un utilisateur de se connecter",
        responses={200: 'Succès', 400: 'Erreur de validation'}
    )
    def post(self, request):
        pass
```

- **Documenter les schémas de réponse** :
```python
@swagger_auto_schema(
    method='get',
    responses={
        200: openapi.Response(
            description="Liste des utilisateurs",
            schema=UserSerializer(many=True)
        ),
        401: 'Non authentifié',
        403: 'Accès interdit'
    }
)
def my_view(request):
    pass
```

- **Masquer certains endpoints** avec `swagger_auto_schema`.

---