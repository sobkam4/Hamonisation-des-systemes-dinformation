# User = get_user_model()

    Est une fonction fournie par Django qui retourne le modèle utilisateur actif (celui configuré dans settings.AUTH_USER_MODEL).

# slug = models.SlugField(unique=True, max_length=255, db_index=True)

# db_index=True

    Crée un index sur ce champ dans la base de données.
    Rend les recherches par slug plus rapides (par exemple, retrouver un article via son slug dans l’URL).


# queryset = Page.objects.filter(deleted_at__isnull=True)
<!-- deleted_at__isnull=True -->
    C’est une syntaxe Django ORM qui signifie : le champ deleted_at est NULL.
Autrement dit, on récupère uniquement les objets non supprimés (puisque ceux qui ont une valeur dans deleted_at sont considérés comme supprimés logiquement).


# 📌 Contexte
    Dans beaucoup d’applications, on ne supprime pas réellement une ligne en base de données.

    On utilise un champ deleted_at (souvent un DateTimeField) pour marquer la date de suppression.

    Si deleted_at est NULL → l’objet est actif.

    Si deleted_at contient une date → l’objet est supprimé (mais conservé pour l’historique ou audit).



# filter_backends = [filters.SearchFilter, filters.OrderingFilter] 

# 🧑‍💻 Contexte
    On est dans Django REST Framework (DRF).

    Les filter backends sont des classes qui permettent d’ajouter des fonctionnalités de filtrage, recherche et tri aux vues API.

    On les définit généralement dans une ViewSet ou une GenericAPIView.

# def perform_destroy(self, instance):
    C’est une méthode qu’on définit dans un ViewSet DRF pour personnaliser la suppression d’un objet  au lieu d’un delete() classique

    
# class Page(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=50)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['deleted_at']),
        ]


# Qu’est-ce qu’un index ?
    Un index est une structure en base de données qui accélère les recherches sur un champ.

    Sans index, la base doit parcourir toutes les lignes (scan complet).

    Avec un index, elle peut retrouver rapidement les enregistrements correspondant à une valeur.

    Ici, Django va créer un index SQL sur la colonne status.
    Cela rend plus rapide les requêtes comme :

    Page.objects.filter(status="published")
    Page.objects.filter(status="draft")




# from django.db.models import F
# def increment_views(self):
    self.views_count = F("views_count") + 1
    self.save(update_fields=["views_count"])
    self.refresh_from_db(fields=["views_count"])


#   self représente l’instance du modèle
#   views_count
    C’est un champ dans ton modèle Django (souvent un IntegerField) qui sert à compter le nombre de fois qu’un objet a été consulté.

#   self.save(update_fields=["views_count"])
        On sauvegarde uniquement le champ views_count dans la base de données.

        Cela évite de mettre à jour inutilement les autres champs.

        Plus efficace que self.save() qui met à jour tous les champs.
#   refresh_from_db
    Méthode d’instance des modèles Django.

    Elle permet de recharger les données de l’objet depuis la base de données.

#   F (Expressions F)
    Importé depuis django.db.models import F.

    Sert à faire référence à la valeur actuelle d’un champ directement en base de données.

    F → permet de manipuler les champs directement en base (opérations atomiques).

    Utile quand tu as fait une mise à jour en base (par exemple avec une expression F()) et que l’instance en mémoire n’a pas encore la bonne valeur.

#   Operation atomique:
    En informatique, une opération atomique est une séquence d’instructions qui ne peut pas être interrompue par un autre processus ou thread.

    un thread fait référence à la manière dont le serveur web qui gère l’exécution simultanée des requêtes.

    une action qui s’exécute entièrement, sans jamais être interrompue ni divisée

    Cela garantit que les données restent cohérentes, même dans un environnement concurrent (plusieurs utilisateurs ou programmes accèdent aux mêmes données en même temps).


### 📌 Comparaison
| Situation | Non atomique | Atomique |
|-----------|--------------|----------|
| Incrémentation naïve | Lire `views_count = 10`, ajouter 1, sauvegarder → risque que deux threads lisent 10 et écrivent 11 | La base fait directement `views_count = views_count + 1` → résultat correct (12) |
| Transfert bancaire | Débiter un compte puis créditer un autre → si interruption au milieu, argent "disparaît" | Débit + crédit exécutés comme une seule transaction indivisible |

---

### 🚨 Pourquoi c’est important ?
- **Bases de données** : les transactions doivent être atomiques pour éviter des incohérences (ex. argent débité mais pas crédité).  
- **Programmation concurrente** : évite les "race conditions" (deux threads qui modifient la même donnée en même temps).  
- **Fiabilité** : garantit que les opérations critiques sont toujours complètes ou annulées.

# Pattern standard pour une fonction atomique (synchronisée)

from django.db import transaction

def update_order_and_stock(order_id, items):
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        # modifications sur order et stock
        order.save()


# Points clés : 
utiliser `select_for_update()` pour verrouiller les lignes si nécessaire et regrouper toutes les écritures dans le bloc atomic.


# Important : transaction.atomic() lève SynchronousOnlyOperation si utilisé directement dans un contexte async. 

# Bonnes pratiques et décisions
Paralléliser I/O (APIs externes) hors du bloc atomic pour réduire la durée de la transaction.

Utiliser `transaction.on_commit()` pour déclencher actions post-commit (ex. envoi d’événements). 

Pour tâches longues ou CPU-bound, déléguer à des workers (Celery) plutôt que d’étendre la transaction.

# Gestion des erreurs et nesting
Nesting : les `atomic()` imbriqués créent des savepoints ; un rollback interne revient au savepoint sans forcément annuler l’outer si géré correctement. Testez les comportements attendus. 

# Risques et recommandations
Risque de blocage si la transaction reste ouverte pendant des appels réseau ou des opérations lentes. Réduisez la fenêtre transactionnelle.

En `async`, mal encapsuler l’ORM peut provoquer SynchronousOnlyOperation et des blocages du thread pool ; préférez sync_to_async ou gardez la logique DB synchrone. 


La différence entre **Async** et **Threads** est subtile mais cruciale, surtout dans Django où tu peux choisir entre les deux approches pour gérer la concurrence.  

---

## 🔹 Threads
- **Principe** : plusieurs *threads* s’exécutent en parallèle dans un même processus.  
- **Caractéristiques** :
  - Chaque thread peut bloquer le CPU (par ex. une requête longue ou une opération I/O).
  - Les threads partagent la mémoire du processus → attention aux variables globales.
  - Plus adaptés quand tu veux exécuter du code **CPU-bound** (calculs lourds).
- **Exemple Django** : si ton serveur gère 10 requêtes simultanées, il peut lancer 10 threads, chacun traitant une requête.

---

## 🔹 Async (asynchrone)
- **Principe** : basé sur une boucle d’événements (*event loop*).  
- **Caractéristiques** :
  - Une seule tâche active à la fois, mais elle peut être suspendue quand elle attend une opération I/O (ex. appel API, requête DB).
  - Pendant ce temps, l’event loop passe à une autre tâche → pas de blocage.
  - Plus adaptés pour du **I/O-bound** (beaucoup d’attente réseau ou disque).
- **Exemple Django** : une vue `async def` peut lancer une requête externe et, pendant qu’elle attend la réponse, Django continue à traiter d’autres requêtes.

---

## Comparaison rapide

| Aspect              | Threads 🧵 | Async ⚡ |
|---------------------|------------|---------|
| **Modèle**          | Plusieurs threads en parallèle | Une boucle d’événements |
| **Mémoire**         | Partagée entre threads | Une seule pile d’exécution |
| **Idéal pour**      | Calculs lourds (CPU-bound) | Attentes réseau/disque (I/O-bound) |
| **Complexité**      | Gestion des verrous, race conditions | Gestion des coroutines, await/async |
| **Django support**  | Oui (via WSGI, workers multi-threads) | Oui (depuis Django 3.1 avec ASGI) |

---

En pratique :  
- Si tu fais beaucoup de **requêtes externes** (APIs, DB, fichiers), l’**async** est plus efficace.  
- Si tu fais des **calculs lourds** (ex. traitement d’image avec OpenCV, algo de ML), les **threads/processus** sont plus adaptés.  

# Vue asynchrone simple
from django.http import JsonResponse

async def my_async_view(request):
    data = await fetch_remote_data()  # I/O non bloquant
    return JsonResponse(data)

---

Vu ton profil orienté backend et KYC pipelines, je pense que tu pourrais tirer parti de l’**async** pour les appels API (OCR, DeepFace, etc.), et des **threads/processes** pour les traitements lourds (image, vidéo).  


**DjangoFilterBackend**, fait partie de l’intégration entre **django-filter** et **Django REST Framework (DRF)**.  

---

### 🧑‍💻 Qu’est-ce que `DjangoFilterBackend` ?
- C’est une **classe de backend de filtrage** fournie par `django_filters.rest_framework`.  
- Elle permet d’ajouter des **filtres dynamiques** aux endpoints DRF, basés sur les paramètres de requête (`?param=value`).  
- Elle s’appuie sur la librairie **django-filter**, qui est un outil puissant pour générer des filtres à partir des modèles.



### Exemple d’utilisation
```python
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from .models import Page
from .serializers import PageSerializer

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'deleted_at']
```

 Ici :
- `filter_backends = [DjangoFilterBackend]` → active le filtrage.  
- `filterset_fields = ['status', 'deleted_at']` → permet de filtrer sur ces champs.  

---

### ⚡ Exemple de requêtes API
- `GET /pages/?status=published` → retourne uniquement les pages publiées.  
- `GET /pages/?deleted_at__isnull=True` → retourne uniquement les pages non supprimées.  
- `GET /pages/?status=draft&deleted_at__isnull=True` → combine plusieurs filtres.

---

### 🚀 Avantages
- Évite d’écrire manuellement des conditions dans chaque vue.  
- Permet de générer automatiquement des filtres basés sur les champs du modèle.  
- Peut être étendu avec des **FilterSet personnalisés** pour des logiques plus complexes.

---

 En résumé : `DjangoFilterBackend` est le moteur qui connecte **django-filter** à DRF pour que tes endpoints puissent être filtrés facilement via des paramètres d’URL.  







Très bon exemple 👇 tu combines deux points essentiels dans un **ViewSet DRF** : filtrage du queryset et incrémentation des vues.  

#### 1. `get_queryset`
```python
def get_queryset(self):
    qs = Post.objects.filter(deleted_at__isnull=True).select_related('author', 'category')
    if not self.request.user.is_authenticated:
        qs = qs.filter(status="published")
    return qs
```

- **`Post.objects.filter(deleted_at__isnull=True)`**  
  → On récupère uniquement les posts non supprimés (soft delete).  

- **`.select_related('author', 'category')`**  
  → Optimisation des requêtes SQL : charge en une seule requête les relations `author` et `category` (évite le problème du N+1).  

- **Condition sur l’utilisateur**  
  → Si l’utilisateur **n’est pas authentifié**, on limite aux posts publiés (`status="published"`).  
  → Si l’utilisateur est connecté, il peut voir aussi les brouillons ou autres statuts.

---

#### 2. `retrieve`
```python
def retrieve(self, request, *args, **kwargs):
    instance = self.get_object()
    instance.increment_views()
    return super().retrieve(request, *args, **kwargs)
```

- **`instance = self.get_object()`**  
  → Récupère l’objet demandé (par son `pk` ou `slug`).  

- **`instance.increment_views()`**  
  → Appelle la méthode du modèle qui incrémente le compteur de vues (`views_count`).  
  → Exemple dans ton modèle :
    ```python
    def increment_views(self):
        from django.db.models import F
        self.views_count = F("views_count") + 1
        self.save(update_fields=["views_count"])
        self.refresh_from_db(fields=["views_count"])
    ```

- **`return super().retrieve(...)`**  
  → Retourne la réponse standard DRF (le `serializer` de l’objet).

---

### ⚡ Résultat
- Les utilisateurs **non connectés** ne voient que les posts publiés.  
- Les utilisateurs **connectés** voient tous les posts actifs.  
- Chaque fois qu’un post est consulté via `retrieve`, son compteur de vues est incrémenté de manière **atomique** et fiable.

---

### 🚀 Amélioration possible
Tu peux rendre ton code encore plus lisible avec un **Manager personnalisé** :

```python
class PostManager(models.Manager):
    def active(self):
        return self.filter(deleted_at__isnull=True)

class Post(models.Model):
    ...
    objects = PostManager()
```

Puis dans ton ViewSet :
```python
def get_queryset(self):
    qs = Post.objects.active().select_related('author', 'category')
    if not self.request.user.is_authenticated:
        qs = qs.filter(status="published")
    return qs
```

 Ça rend ton code plus expressif et évite de répéter `deleted_at__isnull=True` partout.



#### 1. `validate_file_type(file)`
```python
def validate_file_type(file):
    allowed_types = ["application/pdf", "application/msword",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                     "text/plain"]
    import mimetypes
    file_type, _ = mimetypes.guess_type(file.name)
    if file_type not in allowed_types:
        raise ValidationError("Type de fichier non autorisé.")
```

- **But** : vérifier que le fichier uploadé est bien d’un type autorisé.  
- **`mimetypes.guess_type(file.name)`** → devine le type MIME du fichier à partir de son extension.  
- **`allowed_types`** → liste des types acceptés (PDF, Word, DOCX, TXT).  
- Si le type n’est pas dans la liste → `ValidationError`.

 Exemple :  
- `rapport.pdf` → accepté.  
- `image.png` → rejeté avec `"Type de fichier non autorisé."`.

---

#### 2. `validate_file_size(file)`
```python
def validate_file_size(file):
    max_size = 20 * 1024 * 1024  # 20 MB
    if file.size > max_size:
        raise ValidationError("La taille du fichier dépasse 20 MB.")
```

- **But** : vérifier que le fichier ne dépasse pas une taille maximale.  
- **`file.size`** → taille du fichier en octets.  
- **`max_size = 20 * 1024 * 1024`** → limite fixée à 20 Mo.  
- Si la taille est trop grande → `ValidationError`.

 Exemple :  
- Fichier de 5 Mo → accepté.  
- Fichier de 25 Mo → rejeté avec `"La taille du fichier dépasse 20 MB."`.

---

### ⚡ Utilisation dans un modèle
Tu peux les brancher sur un champ `FileField` ou `FileField` dans ton modèle :

```python
from django.db import models
from .validators import validate_file_type, validate_file_size

class Document(models.Model):
    file = models.FileField(
        upload_to="documents/",
        validators=[validate_file_type, validate_file_size]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

 Résultat :  
- Lorsqu’un utilisateur upload un fichier, Django appelle automatiquement tes validateurs.  
- Si le fichier est trop gros ou d’un type non autorisé → erreur de validation.

---

### 🚀 Amélioration possible
- Utiliser une **librairie spécialisée** (comme `python-magic`) pour détecter le type MIME réel du fichier (plus fiable que `mimetypes` qui se base sur l’extension).  
- Ajouter un message d’erreur plus précis (ex. `"Seuls PDF, DOC, DOCX et TXT sont autorisés"`).  



```python
# utils/email_service.py
from django.core.mail import send_mail
from django.conf import settings

def send_contact_notification(contact):
    subject = f"Nouveau message de contact : {contact.subject}"
    message = f"De: {contact.name} <{contact.email}>\n\n{contact.message}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [settings.ADMIN_EMAIL])
```

- **`send_mail`**  
  - Fonction utilitaire de Django pour envoyer un email.  
  - Signature :  
    ```python
    send_mail(subject, message, from_email, recipient_list)
    ```

- **`settings.DEFAULT_FROM_EMAIL`**  
  - Adresse expéditeur par défaut (configurée dans `settings.py`).  
  - Exemple : `"no-reply@monapp.com"`

- **`settings.ADMIN_EMAIL`**  
  - Adresse du destinataire (ici l’admin).  
  - Tu dois définir cette variable dans ton `settings.py`, par exemple :  
    ```python
    ADMIN_EMAIL = "admin@monapp.com"
    ```

- **`subject`**  
  - Sujet de l’email : `"Nouveau message de contact : <sujet du formulaire>"`.

- **`message`**  
  - Corps du message : inclut le nom, l’email et le contenu du message envoyé par l’utilisateur.

---

### ⚡ Exemple d’utilisation
Supposons que tu aies un modèle ou un serializer `Contact` :

```python
class Contact:
    def __init__(self, name, email, subject, message):
        self.name = name
        self.email = email
        self.subject = subject
        self.message = message

contact = Contact("NG", "ng@example.com", "Support", "Bonjour, j’ai un problème...")
send_contact_notification(contact)
```

👉 Résultat : un email est envoyé à l’admin avec toutes les infos du contact.

---

### 🚀 Améliorations possibles
1. **Ajouter un champ `fail_silently=False`** pour voir les erreurs d’envoi :
   ```python
   send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [settings.ADMIN_EMAIL], fail_silently=False)
   ```

2. **Envoyer en HTML** (plus joli qu’un simple texte brut) :
   ```python
   from django.core.mail import EmailMessage

   def send_contact_notification(contact):
       subject = f"Nouveau message de contact : {contact.subject}"
       body = f"<p><strong>De:</strong> {contact.name} &lt;{contact.email}&gt;</p><p>{contact.message}</p>"
       email = EmailMessage(subject, body, settings.DEFAULT_FROM_EMAIL, [settings.ADMIN_EMAIL])
       email.content_subtype = "html"
       email.send()
   ```

3. **Envoyer à plusieurs admins** :
   ```python
   send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, settings.ADMINS)
   ```
   (où `ADMINS` est une liste définie dans `settings.py`).

---

👉 En résumé : ton fonction `send_contact_notification` est un **service utilitaire** qui envoie un email à l’admin quand un utilisateur soumet un formulaire de contact.  




Tu es en train de configurer ton **backend d’email** dans Django pour utiliser Gmail comme serveur SMTP. Ton snippet est presque correct, mais il y a une petite erreur à la fin (`ADMIN_EMAIL = "admin` qui est incomplet).  

---

###  Configuration complète dans `settings.py`
```python
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "ton_email@gmail.com"        # ton adresse Gmail
EMAIL_HOST_PASSWORD = "mot_de_passe"          # ton mot de passe ou App Password
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
ADMIN_EMAIL = "admin@exemple.com"             # adresse de l’admin qui reçoit les mails
```

---

###  Points importants
1. **Mot de passe Gmail**  
   - Si tu utilises Gmail, il faut générer un **App Password** (mot de passe spécifique à l’application) dans ton compte Google.  
   - Les mots de passe classiques ne fonctionnent plus avec SMTP Gmail (sécurité renforcée).

2. **Sécurité**  
   - Ne mets jamais ton mot de passe en clair dans `settings.py`.  
   - Utilise des **variables d’environnement** :
     ```python
     import os

     EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
     EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
     ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
     ```

3. **Test d’envoi**  
   Tu peux tester avec la commande Django :
   ```bash
   python manage.py shell
   ```
   ```python
   from django.core.mail import send_mail
   send_mail(
       "Test",
       "Ceci est un email de test",
       "ton_email@gmail.com",
       ["admin@exemple.com"],
       fail_silently=False,
   )
   ```

---

 En résumé : tu configures Gmail comme serveur SMTP, mais il faut corriger `ADMIN_EMAIL` et utiliser un **App Password** pour que l’envoi fonctionne.  



# definir et récuperer q (mot-clé réservé) comme terme de recherche

def search_view(request):
    query = request.GET.get("q") # → lit la valeur passée dans l’URL


# Ajouter des paramètres types comme : all, posts, pages, documents
    type_param = request.GET.get("type", "all") # valeur par défaut = all


# filtrage par type:
    results = MyModel.objects.all()
    if query:
        results = results.filter(title__icontains=query)
    # Filtrage par type
    if type_param != "all":
        results = results.filter(content_type=type_param)

# Pagination
    paginatior = Paginator(results, 10) # retourne 10 résultats par page
    page_obj = paginator.get_page(page_number)

# Format de reponse (JSON) :
    data = {
        "query": query,
        "type": type_param,
        "page": page_obj.number,
        "total_pages": paginatior.num_pages,
        "results": [
            {"id": item.id, "title": item.title, "content": item.content}
            for item in page_obj
        ]
    }
    return JsonResponse(data)

```python
from django.http import JsonResponse
from django.db.models import Q
from django.core.paginator import Paginator
from pages.models import Page
from posts.models import Post
from documents.models import Document

def global_search(request):
    query = request.GET.get("q", "")
    type_param = request.GET.get("type", "all")
    page_number = request.GET.get("page", 1)

    results = {"pages": [], "posts": [], "documents": []}

    # Recherche dans Pages
    if type_param in ["all", "pages"]:
        qs = Page.objects.filter(
            Q(title__icontains=query) | Q(content__icontains=query)
        )
        qs = qs.filter(status="published")
        paginator = Paginator(qs, 10)
        page_obj = paginator.get_page(page_number)
        results["pages"] = [
            {"id": p.id, "title": p.title, "content": p.content[:200]}
            for p in page_obj
        ]

    # Recherche dans Posts
    if type_param in ["all", "posts"]:
        qs = Post.objects.filter(
            Q(title__icontains=query) | Q(content__icontains=query) | Q(excerpt__icontains=query)
        )
        qs = qs.filter(status="published")
        paginator = Paginator(qs, 10)
        page_obj = paginator.get_page(page_number)
        results["posts"] = [
            {"id": p.id, "title": p.title, "excerpt": p.excerpt}
            for p in page_obj
        ]

    # Recherche dans Documents
    if type_param in ["all", "documents"]:
        qs = Document.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        )
        qs = qs.filter(status="published")
        paginator = Paginator(qs, 10)
        page_obj = paginator.get_page(page_number)
        results["documents"] = [
            {"id": d.id, "title": d.title, "description": d.description}
            for d in page_obj
        ]

    return JsonResponse({
        "query": query,
        "type": type_param,
        "page": int(page_number),
        "results": results
    })
```

# Configuration SMTP dans settings.py

1. **Installer `python-decouple` ou utiliser `django-environ`** pour charger les variables depuis `.env`.
2. **Ajouter la configuration email** dans `settings.py` :

```python
# settings.py
import os
from dotenv import load_dotenv

load_dotenv()  # si tu utilises python-dotenv

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)
```

3. **Définir les variables dans `.env`** :

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=ton.email@gmail.com
EMAIL_HOST_PASSWORD=ton_mot_de_passe_ou_token_app
DEFAULT_FROM_EMAIL=ton.email@gmail.com
```

---

## 🔹 Tâche 4.5.2 : Choix du service email
### ✅ Options courantes
- **Gmail**  
  - Simple à configurer, mais nécessite un **App Password** (si 2FA activé).
  - Limité en volume (environ 500 mails/jour).
- **SendGrid**  
  - API + SMTP, fiable pour gros volumes.
  - Offre gratuite avec quota.
- **Mailgun**  
  - Spécialisé dans les envois transactionnels.
  - Très bon pour la délivrabilité.
👉 Pour un projet pro, **SendGrid ou Mailgun** sont préférables. Pour un projet perso/test, **Gmail** suffit.

---

## 🔹 Tester la connexion SMTP

### ✅ Exemple de test rapide
Dans un shell Django (`python manage.py shell`) :

```python
from django.core.mail import send_mail

send_mail(
    subject="Test SMTP",
    message="Ceci est un test d'envoi SMTP depuis Django.",
    from_email="ton.email@gmail.com",
    recipient_list=["destinataire@example.com"],
    fail_silently=False,
)
```

Si tout est bien configuré :
- Tu reçois l’email ✅
- Sinon, Django te renvoie une erreur SMTP (ex. authentification, port bloqué, etc.)



# Industrialiser l’envoi d’emails avec un service réutilisable.

## 🔹 Avantages de cette approche
- **Centralisation** : toute la logique email est dans `utils/email_service.py`.
- **Réutilisable** : tu appelles simplement `send_contact_notification()` ou `send_newsletter_confirmation()` depuis tes vues.
- **Templates HTML** : emails stylés et personnalisés.
- **Fallback texte** : `strip_tags()` assure un contenu lisible même si HTML est désactivé.

---

## 🔹 Fichier `utils/email_service.py`
```python
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_email(subject, template_name, context, recipient_list):
    """
    Fonction générique pour envoyer un email basé sur un template HTML.
    - subject : sujet de l'email
    - template_name : chemin du template HTML (ex: 'emails/contact.html')
    - context : dictionnaire de variables pour le template
    - recipient_list : liste des destinataires
    """
    html_message = render_to_string(template_name, context)
    plain_message = strip_tags(html_message)

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )


def send_contact_notification(contact_data):
    """
    Notification lorsqu’un utilisateur envoie un message via le formulaire de contact.
    """
    subject = f"Nouveau message de contact : {contact_data.get('name')}"
    context = {
        "name": contact_data.get("name"),
        "email": contact_data.get("email"),
        "message": contact_data.get("message"),
    }
    send_email(subject, "emails/contact_notification.html", context, [settings.DEFAULT_FROM_EMAIL])


def send_newsletter_confirmation(user_email):
    """
    Confirmation d’inscription à la newsletter.
    """
    subject = "Confirmation d'inscription à la newsletter"
    context = {"email": user_email}
    send_email(subject, "emails/newsletter_confirmation.html", context, [user_email])


def send_password_reset(user_email, reset_link):
    """
    Envoi d’un email de réinitialisation de mot de passe.
    """
    subject = "Réinitialisation de votre mot de passe"
    context = {"reset_link": reset_link}
    send_email(subject, "emails/password_reset.html", context, [user_email])
```

---

## 🔹 Organisation des templates
Dans `templates/emails/` tu crées :
- `contact_notification.html`
- `newsletter_confirmation.html`
- `password_reset.html`

---



Transformer tes fonctions (`send_contact_notification`, `send_newsletter_confirmation`, etc.) en **endpoints API REST** avec validation des données et réponses structurées.

---

## 🔹 Étape 1 : Serializer pour valider les données
Dans `utils/serializers.py` :

```python
from rest_framework import serializers

class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    message = serializers.CharField()

class NewsletterSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    reset_link = serializers.URLField()
```

---

## 🔹 Étape 2 : Views avec DRF
Dans `utils/views.py` :

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils.serializers import ContactSerializer, NewsletterSerializer, PasswordResetSerializer
from utils.email_service import send_contact_notification, send_newsletter_confirmation, send_password_reset


class ContactEmailView(APIView):
    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        if serializer.is_valid():
            send_contact_notification(serializer.validated_data)
            return Response({"message": "Email de contact envoyé"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NewsletterEmailView(APIView):
    def post(self, request):
        serializer = NewsletterSerializer(data=request.data)
        if serializer.is_valid():
            send_newsletter_confirmation(serializer.validated_data["email"])
            return Response({"message": "Confirmation newsletter envoyée"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetEmailView(APIView):
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            send_password_reset(serializer.validated_data["email"], serializer.validated_data["reset_link"])
            return Response({"message": "Email de réinitialisation envoyé"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

---

## 🔹 Étape 3 : URLs
Dans `config/urls.py` :

```python
from django.urls import path
from utils.views import ContactEmailView, NewsletterEmailView, PasswordResetEmailView

urlpatterns = [
    path("api/emails/contact/", ContactEmailView.as_view(), name="contact_email"),
    path("api/emails/newsletter/", NewsletterEmailView.as_view(), name="newsletter_email"),
    path("api/emails/password-reset/", PasswordResetEmailView.as_view(), name="password_reset_email"),
]
```

---

## 🔹 Étape 4 : Exemple d’appel depuis le frontend
### Contact
```javascript
fetch("/api/emails/contact/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Alice",
    email: "alice@example.com",
    message: "Bonjour, j’ai une question..."
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Newsletter
```javascript
fetch("/api/emails/newsletter/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "bob@example.com" })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Password Reset
```javascript
fetch("/api/emails/password-reset/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "charlie@example.com",
    reset_link: "https://frontend.com/reset/abc123"
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## ⚡ Résultat
- ✅ Endpoints REST sécurisés et validés par DRF.  
- ✅ Frontend peut envoyer des requêtes JSON simples.  
- ✅ Backend gère l’envoi SMTP et loggue les emails.  
- ✅ Réponses structurées (`200 OK` ou `400 Bad Request`).  

---


# Hashé un mot de passe:

Quand tu utilises AbstractUser (ou AbstractBaseUser), Django gère déjà le champ password et son hachage. Tu n’as donc pas besoin d’écrire ton propre champ ni ton propre mécanisme de hashage. Voici comment ça fonctionne :
👉 Le champ password est hérité de AbstractUser. Il est prévu pour stocker un mot de passe haché.

# Créer un utilisateur avec mot de passe haché
user = CustomUser(username="ng", email="ng@example.com")
user.set_password("monmotdepasse123")  # hachage automatique
user.save()

👉 set_password() applique le hachage (PBKDF2 par défaut) et stocke le résultat dans user.password.
if user.check_password("monmotdepasse123"): = Vérifier un mot de passe




#  Utiliser le manager create_user
Django fournit aussi un manager qui gère le hachage automatiquement :
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.create_user(username="ng", password="monmotdepasse123")

# 👉 Ici, create_user() appelle set_password() en interne, donc ton mot de passe est bien haché.
`Bonnes pratiques`
- Toujours utiliser set_password() ou create_user().
- Ne jamais stocker ni comparer les mots de passe en clair.
- Laisse Django gérer le hachage : il est robuste et configurable via PASSWORD_HASHERS dans settings.py. = Définir quels algorithmes de hachage

`Par défaut, Django utilise PBKDF2 avec SHA256 (très sécurisé)`

# settings.py
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',          # par défaut
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',      # rétrocompatibilité
    'django.contrib.auth.hashers.Argon2PasswordHasher',          # option moderne et robuste
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',    # option populaire
    'django.contrib.auth.hashers.ScryptPasswordHasher',          # option sécurisée
]

# ✅ Bonnes pratiques
- Mets l’algorithme le plus sécurisé en premier (souvent Argon2 ou PBKDF2).
- Laisse les autres pour assurer la compatibilité avec d’anciens comptes.
Exemple recommandé aujourd’hui :


PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]