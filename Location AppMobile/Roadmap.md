# Roadmap Detaillee pour Developper une Application Android en Kotlin

Cette roadmap est concue pour creer une application de location immobiliere 100% mobile cote usage, uniquement sur Android, developpee en Kotlin, et connectee a une API distante existante ou a construire separement.

L'application sera native Android, avec une interface moderne, un stockage local pour ameliorer l'experience utilisateur, et une synchronisation avec Internet pour recuperer et envoyer les donnees.

## Objectif du projet

Construire une application Android native en Kotlin pour gerer :
- l'authentification des utilisateurs
- les biens immobiliers
- les clients
- les contrats
- les paiements
- les depenses
- les statistiques
- les notifications et rappels

## Architecture cible

```text
Plateforme: Android uniquement
Langage: Kotlin
UI: Jetpack Compose
Architecture: MVVM + Repository
Navigation: Navigation Compose
Stockage local: Room + DataStore
Reseau: Retrofit + OkHttp + Kotlinx Serialization
Injection de dependances: Hilt
Taches en arriere-plan: WorkManager
Cartes et localisation: Google Maps SDK + Fused Location Provider
Notifications: Firebase Cloud Messaging
Source de verite metier: API distante
Mode de fonctionnement: Online avec cache local
```

---

## Phase 0 : Cadrage fonctionnel et technique

### 0.1 Definir le perimetre mobile Android
- lister tous les ecrans necessaires dans l'application
- definir les roles utilisateur : admin, agent, gestionnaire, autre
- prioriser les modules a developper dans la premiere version
- identifier les donnees indispensables en consultation hors connexion

### 0.2 Definir la relation avec l'API distante
- inventorier toutes les routes API necessaires
- verifier les formats de reponse JSON
- definir la methode d'authentification : JWT ou session token
- etablir les regles de synchronisation entre donnees distantes et cache local

### 0.3 Choix techniques Android
- Kotlin pour tout le projet
- Jetpack Compose pour l'interface
- MVVM pour separer logique metier et affichage
- Room pour memoriser localement les donnees utiles
- DataStore pour stocker le token, les preferences et certains etats simples
- Retrofit pour les appels HTTP
- WorkManager pour les synchros automatiques

Livrables :
- liste des fonctionnalites MVP
- schema des ecrans
- liste des endpoints API
- convention de structure du projet Android

---

## Phase 1 : Initialisation du projet Android Kotlin

### 1.1 Creation du projet
- creer le projet dans Android Studio
- choisir `Empty Activity`
- activer Jetpack Compose
- configurer `minSdk`, `targetSdk`, signatures et variantes debug/release

### 1.2 Configuration Gradle de base

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    kotlin("kapt")
    kotlin("plugin.serialization")
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.activity:activity-compose:1.9.1")

    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    debugImplementation("androidx.compose.ui:ui-tooling")

    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")

    implementation("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-compiler:2.51.1")

    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.jakewharton.retrofit:retrofit2-kotlinx-serialization-converter:1.0.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.1")

    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
}
```

### 1.3 Structure recommandee

```text
app/
  ui/
    navigation/
    screens/
    components/
    theme/
  data/
    remote/
    local/
    repository/
    mapper/
  domain/
    model/
    usecase/
  di/
  worker/
  utils/
```

Livrables :
- projet Android compilable
- architecture de dossiers en place
- dependances installees
- ecran de demarrage minimal

---

## Phase 2 : Architecture applicative Android

### 2.1 Pattern recommande
- `UI Compose` pour afficher les donnees
- `ViewModel` pour gerer les etats d'ecran
- `Repository` pour centraliser acces reseau et local
- `Data source distante` pour l'API
- `Data source locale` pour le cache et le mode degrade

### 2.2 Exemple de flux de donnees

```text
Ecran Compose
-> ViewModel
-> UseCase
-> Repository
-> API distante + base locale Room
-> retour vers ViewModel
-> mise a jour de l'UI
```

### 2.3 Gestion des etats
- `loading`
- `success`
- `empty`
- `error`
- `offline`

Livrables :
- base MVVM operationnelle
- classes communes pour la gestion des etats
- base de navigation entre ecrans

---

## Phase 3 : Connexion a l'API distante

### 3.1 Couche reseau
- configurer `Retrofit`
- ajouter `OkHttp Interceptor` pour le token
- gerer timeout, journalisation et erreurs API
- definir DTO de requete et de reponse

### 3.2 Authentification
- ecran de connexion Android
- recuperation du token depuis l'API
- sauvegarde du token avec `DataStore`
- ajout automatique du token dans les requetes
- gestion de deconnexion et expiration de session

### 3.3 Exemple d'interface API

```kotlin
interface AuthApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse
}

interface BienApiService {
    @GET("biens")
    suspend fun getBiens(): List<BienDto>

    @GET("biens/{id}")
    suspend fun getBienById(@Path("id") id: Long): BienDto

    @POST("biens")
    suspend fun createBien(@Body request: BienCreateRequest): BienDto

    @PUT("biens/{id}")
    suspend fun updateBien(
        @Path("id") id: Long,
        @Body request: BienUpdateRequest
    ): BienDto
}
```

Livrables :
- client API fonctionnel
- authentification complete
- gestion des erreurs reseau
- persistence du token utilisateur

---

## Phase 4 : Stockage local et cache mobile

### 4.1 Base locale Android
- creer les entites Room pour les modules principaux
- creer les DAO
- creer les mappers entre DTO, entites locales et modeles domaine

### 4.2 Strategie de cache
- charger les donnees depuis Room au demarrage
- rafraichir depuis l'API quand Internet est disponible
- mettre a jour la base locale apres chaque synchronisation
- afficher les donnees en cache si le reseau est indisponible

### 4.3 Exemple d'entite Room

```kotlin
@Entity(tableName = "biens")
data class BienEntity(
    @PrimaryKey val id: Long,
    val nom: String,
    val typeBien: String,
    val statut: String,
    val montantMensuel: Double,
    val adresse: String,
    val updatedAt: String
)
```

### 4.4 Preferences simples
- token utilisateur
- theme clair/sombre
- filtre par defaut
- dernier ecran visite si utile

Livrables :
- base Room operationnelle
- cache local pour les ecrans principaux
- lecture offline des donnees deja synchronisees

---

## Phase 5 : Developpement des modules metier

### 5.1 Authentification
- connexion
- deconnexion
- affichage du profil
- gestion du role utilisateur

### 5.2 Module Biens
- liste des biens
- details d'un bien
- creation d'un bien
- modification
- recherche et filtres
- photo du bien si l'API le permet

### 5.3 Module Clients
- liste des clients
- fiche client
- ajout et modification
- recherche rapide

### 5.4 Module Contrats
- liste des contrats
- details
- creation
- suivi du statut

### 5.5 Module Paiements
- historique des paiements
- paiement en attente
- paiement recu
- filtres par periode

### 5.6 Module Depenses
- enregistrement des depenses
- consultation par bien
- regroupement par categorie

### 5.7 Tableau de bord
- total des biens
- taux d'occupation
- paiements recents
- indicateurs principaux

Livrables :
- ecrans principaux disponibles
- navigation complete
- traitements metier relies a l'API

---

## Phase 6 : Fonctionnalites purement mobiles Android

### 6.1 Geolocalisation
- permission de localisation
- recuperation de la position utilisateur
- affichage des biens sur carte
- ouverture d'itineraire si necessaire

### 6.2 Carte et adresses
- integrer Google Maps SDK
- afficher un bien sur une carte
- geocoder une adresse si besoin

### 6.3 Camera et galerie
- ajouter des photos depuis la camera
- selectionner une image depuis la galerie
- compresser l'image avant upload

### 6.4 Notifications
- notifications push via Firebase Cloud Messaging
- rappels de paiement
- alertes sur contrats ou echeances

### 6.5 Taches en arriere-plan
- synchronisation reguliere avec WorkManager
- reprise des uploads echoues
- mise a jour locale apres retour du reseau

Livrables :
- localisation fonctionnelle
- upload photo possible
- systeme de notification pret
- synchro en arriere-plan stable

---

## Phase 7 : Interface utilisateur et experience mobile

### 7.1 UI Android moderne
- Material 3
- theme clair et sombre
- composants Compose reutilisables
- ecrans optimises pour smartphone

### 7.2 Gestion des etats utilisateur
- ecrans de chargement
- erreurs claires
- etats vides
- banniere hors ligne
- message de succes apres action

### 7.3 Ergonomie
- formulaires simples et rapides
- validation locale avant envoi API
- liste fluide avec pagination si necessaire
- actions principales accessibles rapidement

Livrables :
- design system simple
- composants reutilisables
- UX coherente sur tous les modules

---

## Phase 8 : Securite mobile

### 8.1 Protection des donnees
- stocker proprement le token
- eviter les informations sensibles dans les logs
- utiliser HTTPS uniquement
- proteger les appels reseau

### 8.2 Controle de session
- deconnexion si token invalide
- gestion du refresh token si disponible
- protection des ecrans non authentifies

### 8.3 Durcissement Android
- verifier les permissions demandees
- restreindre les exports inutiles dans le manifest
- utiliser ProGuard ou R8 pour la release

Livrables :
- mecanismes de session fiables
- configuration release plus sure

---

## Phase 9 : Tests et qualite

### 9.1 Tests unitaires
- ViewModel
- UseCase
- Repository
- mappers

### 9.2 Tests UI
- tests Compose sur les ecrans critiques
- verification des etats loading, success, error

### 9.3 Tests d'integration
- appels API avec mocks
- comportement Room
- synchronisation locale et distante

### 9.4 Controle qualite
- ktlint ou detekt
- verification manuelle sur plusieurs tailles d'ecran
- test en mode reseau lent ou coupe

Livrables :
- socle minimal de tests
- validation des parcours critiques

---

## Phase 10 : Build, livraison et publication

### 10.1 Versions de build
- configurer `debug`, `staging`, `release`
- differencier les URL API selon l'environnement
- preparer la signature de l'application

### 10.2 Generation de livrables
- APK pour test interne
- AAB pour publication Play Store

### 10.3 Mise en production
- icone application
- splash screen
- nom du package final
- regles ProGuard
- fiche Play Store
- politique de confidentialite si necessaire

Livrables :
- build de recette
- build de production
- package pret pour publication

---

## Timeline estimee

| Phase | Duree estimee |
|-------|----------------|
| Phase 0 : Cadrage | 3 a 5 jours |
| Phase 1 : Initialisation Android | 3 a 5 jours |
| Phase 2 : Architecture | 4 a 6 jours |
| Phase 3 : API et authentification | 1 a 2 semaines |
| Phase 4 : Stockage local | 4 a 6 jours |
| Phase 5 : Modules metier | 4 a 8 semaines |
| Phase 6 : Fonctions mobiles | 1 a 2 semaines |
| Phase 7 : UI et UX | 1 a 2 semaines |
| Phase 8 : Securite | 3 a 5 jours |
| Phase 9 : Tests | 1 a 2 semaines |
| Phase 10 : Livraison | 3 a 5 jours |
| **Total** | **10 a 17 semaines** |

---

## Recommandations finales

1. Commencer par l'authentification, la navigation et le module Biens.
2. Construire rapidement une version MVP avant d'ajouter toutes les fonctions secondaires.
3. Mettre en place Room des le debut pour ameliorer la fluidite de l'application.
4. Garder une separation claire entre `remote`, `local`, `domain` et `ui`.
5. Tester tres tot les appels API reels sur appareil Android.
6. Prevoir un mode degrade lorsque la connexion Internet est instable.

## Conclusion

Cette roadmap permet de construire une application Android native en Kotlin, 100% mobile dans son usage, tout en restant connectee a une API distante. Elle est adaptee a un projet professionnel de gestion immobiliere et pose une base moderne, maintenable et evolutive.
