# Logique générale

Je te résume les **grandes idées à comprendre** pour pouvoir refaire ce genre de programme avec n’importe quel système (drone, robot, voiture, jeu vidéo, etc.).
---

## 1. Penser en “objets qui collaborent”

Logique à retenir :

* Ton programme = **des acteurs** (objets) qui travaillent ensemble.
* Chaque objet a :

  * des **données** (attributs : `level`, `altitude`, `name`…)
  * des **actions** (méthodes : `arm()`, `read()`, `consume()`…)

👉 Ici :

* `Drone`, `Drone2` = acteurs principaux
* `Battery`, `AltitudeSensor`, `SimulatedFlyghtController` = “services” autour.

### À retenir pour reproduire :

> Toujours te demander : *“Quels sont les acteurs de mon système ? Que sait faire chacun ?”*

---

## 2. Séparer **contrat** et **implémentation**

C’est LE gros truc du code que tu as montré.

* `FlyghtController` et `Sensor` = **contrats** (interfaces / classes abstraites).
* `SimulatedFlyghtController` et `AltitudeSensor` = **implémentations** concrètes.

Logique :

1. D’abord, tu définis **ce qu’un truc doit savoir faire**, pas comment :

   * `Sensor` : doit avoir `read()`
   * `FlyghtController` : doit avoir `arm`, `takeoff`, `go_to`, `land`
2. Ensuite, tu crées **des versions concrètes** qui respectent ce contrat :

   * Simulation
   * Plus tard : version réelle (avec vrai matériel / API)

### À retenir pour reproduire :

Pattern typique :

```python
class ServiceAbstrait(ABC):
    @abstractmethod
    def action(self) -> None:
        pass

class ServiceConcret(ServiceAbstrait):
    def action(self) -> None:
        print("Je fais l'action concrètement")
```

> Toujours : *“Je commence par décrire le contrat (ABC), puis je code une ou plusieurs versions concrètes.”*

---

## 3. Injection de dépendances (très important pour scaler)

Regarde les `__init__` des drones :

```python
def __init__(self, name: str, controller: FlyghtController, battery: Battery, altitude_sensor: Sensor | None = None):
    self.controller = controller
    self.battery = battery
    self.altitude_sensor = altitude_sensor
```

Logique :

* Le drone ne crée **pas** lui-même la batterie, le contrôleur, le capteur.
* On lui **donne** ces objets prêts à l’emploi → c’est de **l’injection de dépendances**.

Avantage :

* Tu peux changer le comportement **de l’extérieur** :

  * Simu vs réel
  * Batterie pleine vs faible
  * Capteur vrai vs capteur de test

### À retenir pour reproduire :

> Au lieu de faire `self.controller = SimulatedFlyghtController()` *dans* la classe,
> tu passes le contrôleur en paramètre du `__init__`.

---

## 4. Modéliser l’**état** et les **effets**

Exemples :

* `Battery.level` = **état** qui change avec `consume()`.
* `AltitudeSensor.altitude` = état lu via `read()`.
* `Drone2.run_simple_mission()` = une **suite d’actions** qui font évoluer l’état.

Logique :

1. Les **objets** stockent l’état (batterie, altitude, position…)
2. Les **méthodes** transforment cet état (consommer, lire, se déplacer…)
3. Tu ajoutes des **règles** :

   * Si batterie < 20 → mission annulée.
   * Si capteur présent → lire et afficher.

### À retenir pour reproduire :

> Pour chaque partie de ton système :
>
> * Quel état doit être mémorisé ?
> * Quelles méthodes peuvent modifier ou lire cet état ?
> * Quelles règles métier je mets autour ?

---

## 5. Écrire des **scénarios de test** dans `if __name__ == "__main__":`

Bloc de fin :

```python
if __name__ == "__main__":
    controller = SimulatedFlyghtController()
    simple_drone = Drone("DroneSimple-01", controller)
    simple_drone.run_simple_mission()
    ...
```

Logique :

* Ce bloc sert à **jouer des scénarios** :

  * Drone simple
  * Drone avec batterie OK
  * Drone avec batterie faible
* Ça te permet de vérifier la logique **sans framework de test** au début.

### À retenir pour reproduire :

> Toujours te faire un petit “laboratoire” à la fin du fichier avec différents cas :
>
> * cas normal
> * cas limite
> * cas erreur

---

## 6. Le pattern général que tu peux réutiliser partout

Tu peux quasiment boilerplate ça pour n’importe quel projet objet.

### Étape A – Définir les contrats

* Quels services génériques y a-t-il ?

  * Ex : `StockageFichiers`, `Paiement`, `Notification`, `Capteur`, `MoteurJeu`, etc.
* Pour chaque service :
  → tu fais une `class ... (ABC)` avec des `@abstractmethod`.

### Étape B – Créer les implémentations

* Version simulée (tests, dev)
* Version réelle (prod, hardware)
* Version fake (tests unitaires)

### Étape C – Créer l’“orchestrateur”

* Ici : `Drone`, `Drone2`
* Dans un autre projet : `GameEngine`, `OrderService`, `Robot`

Lui :

* reçoit les dépendances dans le `__init__`
* écrit des méthodes haut niveau genre `run_simple_mission`, `execute_order`, `play_turn`, etc.

### Étape D – Scénarios d’utilisation

* Dans `if __name__ == "__main__":` :

  * créer des objets
  * les connecter entre eux
  * exécuter des scénarios.

---

## 7. Résumé en mode “cheat sheet mental”

Pour reproduire ce genre de programme, garde ces réflexes :

1. **Qui sont les acteurs ?**
   → je crée une classe par acteur (drone, batterie, capteur, contrôleur).

2. **Quels sont les contrats ?**
   → je mets `ABC` + `@abstractmethod` pour décrire les interfaces.

3. **Qui parle à qui ?**
   → l’objet principal (Drone) reçoit les autres en paramètre (`__init__`).

4. **Où est l’état ?**
   → dans les attributs (`self.level`, `self.altitude`, `self.name`).

5. **Quel est le scénario ?**
   → j’écris une méthode “haut niveau” (`run_simple_mission`) qui appelle les petites briques dans l’ordre.

6. **Comment je teste ?**
   → bloc `if __name__ == "__main__":` avec plusieurs cas différents.

---

Si tu veux, je peux te faire un **template générique** (vide, mais avec la même structure) que tu pourras copier-coller pour d'autres projets (par exemple un robot au sol, un système de paiement, un jeu, etc.).

"""

# algorithme
"""
Parfait, on passe en **mode algo** 🧠📋

### 🔧 Objectif

Ajouter un **capteur de distance** que le drone pourra utiliser pour détecter des obstacles devant lui.

---

## Algorithme : ajout d’un capteur de distance

1. **Définir le rôle du capteur**
   1.1. Le capteur doit mesurer une distance en mètres.
   1.2. Il doit retourner une valeur numérique (float).
   1.3. Il doit respecter le contrat général `Sensor` (méthode `read()`).

2. **Créer une classe de capteur de distance**
   2.1. Déclarer une classe `DistanceSensor` qui hérite de `Sensor`.
   2.2. Dans le constructeur (`__init__`), initialiser :

   * une valeur de distance (par exemple `distance_initiale`)
   * éventuellement un nom ou un id du capteur.
     2.3. Implémenter la méthode `read()` :
   * lire la distance actuelle (par exemple `self.distance`)
   * afficher la valeur (pour debug/simulation)
   * retourner la valeur.

3. **Décider comment le drone utilise ce capteur**
   3.1. Choisir dans quelle classe de drone l’ajouter :

   * soit modifier `Drone2`
   * soit créer un `Drone3` plus avancé.
     3.2. Ajouter un nouvel attribut dans le constructeur du drone :
   * paramètre `distance_sensor: Sensor | None = None`
   * le stocker dans `self.distance_sensor`.

4. **Intégrer le capteur dans la mission**
   4.1. Choisir à quel moment vérifier la distance :

   * avant le déplacement (`go_to`)
   * ou pendant, selon le scénario.
     4.2. Dans `run_simple_mission` :
   * si `self.distance_sensor` n’est pas `None` :

     * appeler `distance = self.distance_sensor.read()`
     * afficher la distance.
     * si `distance` est inférieur à un seuil (ex: 5 m) :

       * afficher “Obstacle détecté, annulation ou modification de la trajectoire”.
       * soit : arrêter la mission (`return`)
       * soit : changer les coordonnées de `go_to`.

5. **Mettre à jour la consommation de batterie**
   5.1. Après chaque lecture de capteur, décider si ça consomme de la batterie.
   5.2. Si oui : appeler `self.battery.consume(valeur)` après `read()`.

6. **Créer des scénarios de test**
   6.1. Dans le bloc `if __name__ == "__main__":` :

   * créer une instance de `DistanceSensor` avec une distance “safe” (ex : 10 m).
   * créer un drone avec ce capteur → vérifier que la mission se déroule normalement.
     6.2. Créer un autre `DistanceSensor` avec une distance “dangereuse” (ex : 2 m).
   * créer un drone avec ce capteur → vérifier que la mission se coupe ou change de comportement.
---

Si tu veux, prochaine étape : on prend cet algorithme et on l’implémente **ensemble** en Python, bloc par bloc 💻. Tu veux commencer par la classe `DistanceSensor` ou par la modification du drone ?
"""


from abc import ABC, abstractmethod


# ==========================
# Étape 1 : Interfaces (abstraction)
# ==========================
```python
class FlyghtController(ABC):
    """
    Contrat pour un contrôleur de vol.
    Le drone ne sait PAS comment on arme/décolle/bouge/atterrit,
    il délègue tout à un objet qui implémente cette interface.
    """

    @abstractmethod
    def arm(self) -> None:
        """Armer les moteurs."""
        pass

    @abstractmethod
    def takeoff(self, altitude: float) -> None:
        """Décoller jusqu'à une certaine altitude (en mètres)."""
        pass

    @abstractmethod
    def go_to(self, x: float, y: float, z: float) -> None:
        """Aller à une position 3D (x, y, z)."""
        pass

    @abstractmethod
    def land(self) -> None:
        """Atterrir."""
        pass


class Sensor(ABC):
    """
    Contrat générique pour un capteur.
    Chaque capteur doit pouvoir "lire" une valeur numérique.
    """

    @abstractmethod
    def read(self) -> float:
        """Retourne la valeur mesurée par le capteur."""
        pass


# ==========================
# Étape 2 : Implémentations concrètes (simulation)
# ==========================

class SimulatedFlyghtController(FlyghtController):
    """Contrôleur de vol simulé : on affiche juste des messages."""

    def arm(self) -> None:
        print("[SIM] Armement des moteurs du drone")

    def takeoff(self, altitude: float) -> None:
        print(f"[SIM] Décollage jusqu'à {altitude} m")

    def go_to(self, x: float, y: float, z: float) -> None:
        print(f"[SIM] Déplacement vers ({x}, {y}, {z})")

    def land(self) -> None:
        print("[SIM] Atterrissage du drone")


class AltitudeSensor(Sensor):
    """
    Capteur d'altitude simulé.
    Pour l'instant, il renvoie juste une valeur stockée.
    """

    def __init__(self, initial_altitude: float = 0.0) -> None:
        self.altitude = initial_altitude

    def read(self) -> float:
        print(f"[CAPTEUR] Altitude actuelle : {self.altitude} m")
        return self.altitude


# ==========================
# Étape 3 : Composants partagés (batterie)
# ==========================

class Battery:
    """
    Représente une batterie simple avec un niveau en pourcentage (0 à 100).
    """

    def __init__(self, level: float = 100.0) -> None:
        self.level = level

    def consume(self, amount: float) -> None:
        """Consomme une certaine quantité de batterie."""
        if amount <= 0:
            return  # rien à faire

        self.level -= amount

        if self.level < 0:
            # on évite les valeurs négatives
            self.level = 0

    def is_low(self) -> bool:
        """Retourne True si la batterie est faible (< 20%)."""
        return self.level < 20


# ==========================
# Étape 4 : Premier drone simple (sans batterie ni capteur)
# ==========================

class Drone:
    """
    Version minimale du drone : il a juste un contrôleur de vol.
    """

    def __init__(self, name: str, controller: FlyghtController) -> None:
        self.name = name
        self.controller = controller

    def run_simple_mission(self) -> None:
        """Mission très simple : décoller, se déplacer, atterrir."""
        print(f"[{self.name}] Démarrage de la mission (sans gestion batterie)")
        self.controller.arm()
        self.controller.takeoff(10)
        self.controller.go_to(50, 30, 10)
        self.controller.land()
        print(f"[{self.name}] Mission terminée\n")


# ==========================
# Étape 5 : Drone2 avec batterie + capteur d'altitude
# ==========================

class Drone2:
    """
    Drone plus évolué :
      - dépend d'un contrôleur de vol (abstraction)
      - surveille sa batterie
      - peut lire un capteur d'altitude si on lui en fournit un
    """

    def __init__(
        self,
        name: str,
        controller: FlyghtController,
        battery: Battery,
        altitude_sensor: Sensor | None = None,
    ) -> None:
        self.name = name
        self.controller = controller
        self.battery = battery
        self.altitude_sensor = altitude_sensor

    def run_simple_mission(self) -> None:
        """
        Mission :
          1. Vérifier la batterie
          2. Armer
          3. Décoller
          4. Lire l'altitude via le capteur (si présent)
          5. Aller à un point
          6. Atterrir
        À chaque étape, on consomme de la batterie.
        """

        # 1) Vérification batterie
        if self.battery.is_low():
            print(
                f"[{self.name}] Batterie trop faible, mission annulée "
                f"(niveau: {self.battery.level}%)"
            )
            return

        print(
            f"[{self.name}] Démarrage de la mission "
            f"(batterie: {self.battery.level}%)"
        )

        # 2) Armement
        self.controller.arm()
        self.battery.consume(5)

        # 3) Décollage
        self.controller.takeoff(10)
        self.battery.consume(10)

        # 4) Lecture du capteur d'altitude (si disponible)
        if self.altitude_sensor is not None:
            current_alt = self.altitude_sensor.read()
            # On pourrait ici prendre des décisions en fonction de current_alt
            print(f"[{self.name}] Altitude lue après décollage : {current_alt} m")

        # 5) Déplacement
        self.controller.go_to(50, 30, 10)
        self.battery.consume(15)

        # 6) Atterrissage
        self.controller.land()
        self.battery.consume(5)

        print(
            f"[{self.name}] Mission terminée "
            f"(batterie restante: {self.battery.level}%)\n"
        )


# ==========================
# Étape 6 : Scénarios de test
# ==========================

if __name__ == "__main__":
    # Création d'un contrôleur de vol simulé
    controller = SimulatedFlyghtController()

    # --- Test du Drone "simple" (sans batterie ni capteur) ---
    simple_drone = Drone("DroneSimple-01", controller)
    simple_drone.run_simple_mission()

    # Création d'un capteur d'altitude simulé
    altitude_sensor = AltitudeSensor(initial_altitude=0.0)

    # --- Cas 1 : batterie pleine (100%) ---
    full_battery = Battery(100)
    drone_ok = Drone2(
        name="Drone2-OK",
        controller=controller,
        battery=full_battery,
        altitude_sensor=altitude_sensor,
    )
    drone_ok.run_simple_mission()

    # --- Cas 2 : batterie faible (10%) ---
    low_battery = Battery(10)
    drone_low = Drone2(
        name="Drone2-Low",
        controller=controller,
        battery=low_battery,
        altitude_sensor=altitude_sensor,
    )
    drone_low.run_simple_mission()

python
#==================================================================================================================
Parfait, voici ton **template générique** à réutiliser pour n’importe quel projet (drone, robot, app métier, etc.).
Tu peux juste **remplacer les noms** et la logique métier.


#```python
from abc import ABC, abstractmethod

# ==========================
# Étape 1 : Contrats / Interfaces
# ==========================

class MainController(ABC):
    """
    Contrat pour le "cerveau" qui exécute des actions de base.
    Exemple : contrôleur de drone, moteur de jeu, service de paiement, etc.
    """

    @abstractmethod
    def start(self) -> None:
        """Démarrer quelque chose (session, moteur, mission...)."""
        pass

    @abstractmethod
    def do_action(self, *args, **kwargs) -> None:
        """Effectuer une action principale (à définir selon ton domaine)."""
        pass

    @abstractmethod
    def stop(self) -> None:
        """Arrêter proprement."""
        pass


class SensorBase(ABC):
    """
    Contrat générique pour un capteur ou une source d'info.
    Exemple : capteur physique, API externe, base de données...
    """

    @abstractmethod
    def read(self) -> float:
        """Lire une valeur numérique (ou adapter le type selon le besoin)."""
        pass


# ==========================
# Étape 2 : Implémentations concrètes (simulation / fake)
# ==========================

class SimulatedController(MainController):
    """
    Version simulée du contrôleur.
    Sert pour tester la logique sans vrai matériel ni vraie infra.
    """

    def start(self) -> None:
        print("[SIM] Démarrage du contrôleur")

    def do_action(self, *args, **kwargs) -> None:
        print(f"[SIM] Action principale exécutée avec args={args}, kwargs={kwargs}")

    def stop(self) -> None:
        print("[SIM] Arrêt du contrôleur")


class FakeSensor(SensorBase):
    """
    Capteur simulé : renvoie une valeur fixe ou préconfigurée.
    Pratique pour les tests.
    """

    def __init__(self, value: float = 0.0) -> None:
        self.value = value

    def read(self) -> float:
        print(f"[CAPTEUR FAKE] Valeur lue : {self.value}")
        return self.value


# ==========================
# Étape 3 : Ressource partagée (ex : Batterie / Crédit / Stock, etc.)
# ==========================

class Resource:
    """
    Représente une ressource limitée.
    Tu peux réutiliser ce pattern pour :
      - batterie
      - crédits API
      - nombre de requêtes restantes
      - budget, etc.
    """

    def __init__(self, amount: float = 100.0) -> None:
        self.amount = amount

    def consume(self, value: float) -> None:
        """Consommer une partie de la ressource."""
        if value <= 0:
            return

        self.amount -= value
        if self.amount < 0:
            self.amount = 0

    def is_low(self, threshold: float = 20.0) -> bool:
        """Retourne True si la ressource est sous un seuil donné."""
        return self.amount < threshold


# ==========================
# Étape 4 : Orchestrateur / Service métier principal
# ==========================

class ApplicationService:
    """
    Service haut niveau qui orchestre :
      - un contrôleur
      - une ressource (ex : batterie)
      - un capteur (optionnel)
    C'est ici que tu codes la "story" métier : scénario, mission, workflow...
    """

    def __init__(
        self,
        name: str,
        controller: MainController,
        resource: Resource | None = None,
        sensor: SensorBase | None = None,
    ) -> None:
        self.name = name
        self.controller = controller
        self.resource = resource
        self.sensor = sensor

    def run_scenario(self) -> None:
        """
        Exemple de scénario générique :
          1) Vérifier la ressource (si présente)
          2) Démarrer le contrôleur
          3) Effectuer une action principale
          4) Lire un capteur (si présent)
          5) Arrêter le contrôleur
        Adapter ce squelette selon ton domaine.
        """

        # 1) Vérifier la ressource
        if self.resource is not None and self.resource.is_low():
            print(
                f"[{self.name}] Ressource trop faible, scénario annulé "
                f"(niveau: {self.resource.amount})"
            )
            return

        print(
            f"[{self.name}] Démarrage du scénario "
            f"(ressource: {self.resource.amount if self.resource else 'N/A'})"
        )

        # 2) Démarrage
        self.controller.start()
        if self.resource is not None:
            self.resource.consume(5)

        # 3) Action principale
        self.controller.do_action(action="EXEMPLE", param1=42)
        if self.resource is not None:
            self.resource.consume(10)

        # 4) Lecture capteur
        if self.sensor is not None:
            value = self.sensor.read()
            print(f"[{self.name}] Valeur capteur lue : {value}")
            # Ici tu peux prendre une décision métier selon `value`.

        # 5) Arrêt
        self.controller.stop()
        if self.resource is not None:
            self.resource.consume(5)

        print(
            f"[{self.name}] Scénario terminé "
            f"(ressource restante: {self.resource.amount if self.resource else 'N/A'})\n"
        )


# ==========================
# Étape 5 : Scénarios de test
# ==========================

if __name__ == "__main__":
    # 1) Créer une implémentation concrète du contrôleur (ici : simulé)
    controller = SimulatedController()

    # 2) Créer une ressource (ex : batterie, crédits, etc.)
    resource_full = Resource(100)

    # 3) Créer un capteur simulé
    sensor_ok = FakeSensor(value=10.0)

    # 4) Scénario normal
    app_ok = ApplicationService(
        name="App-OK",
        controller=controller,
        resource=resource_full,
        sensor=sensor_ok,
    )
    app_ok.run_scenario()

    # 5) Scénario avec ressource faible
    resource_low = Resource(5)
    sensor_low = FakeSensor(value=2.0)

    app_low = ApplicationService(
        name="App-LOW",
        controller=controller,
        resource=resource_low,
        sensor=sensor_low,
    )
    app_low.run_scenario()
```

---

### Comment l’utiliser dans un nouveau projet

1. **Tu renommes :**

   * `MainController` → `DroneController`, `GameEngine`, `PaymentGateway`, etc.
   * `SensorBase` → `TemperatureSensor`, `PlayerInput`, `StockReader`, etc.
   * `Resource` → `Battery`, `ApiQuota`, `WalletBalance`, etc.
   * `ApplicationService` → `Drone`, `GameService`, `OrderService`, etc.

2. **Tu adaptes :**

   * les méthodes de `MainController` (`start`, `do_action`, `stop`)
   * le type retourné par `SensorBase.read()` si nécessaire (pas obligé de rester en `float`)
   * les règles métier dans `run_scenario`.

3. **Tu gardes la structure :**

   * interfaces (ABC)
   * implémentations concrètes
   * orchestrateur
   * scénarios de test dans `if __name__ == "__main__":`

Si tu veux, on peut maintenant prendre un autre domaine (par ex : **système de paiement**, ou **jeu simple**) et remplir ce template ensemble.
# ==================================================================================================================================

Parfait, on transforme ton drone en **système de paiement** 💳

Je te donne :

* la **structure complète en code**
* avec la **même logique** que ton exemple drone (interfaces → implémentations → ressource → service → scénarios)

---

## 🧱 Système de paiement (version objet & testable)

```python
from abc import ABC, abstractmethod

# ==========================
# Étape 1 : Contrats / Interfaces
# ==========================

class PaymentGateway(ABC):
    """
    Contrat pour une passerelle de paiement (Stripe, PayPal, OrangeMoney...).
    Le service métier ne sait pas COMMENT on paie, il délègue au gateway.
    """

    @abstractmethod
    def start_session(self) -> None:
        """Préparer une session de paiement (connexion, logs, etc.)."""
        pass

    @abstractmethod
    def authorize(self, amount: float, currency: str) -> str:
        """
        Autoriser un paiement.
        Retourne un identifiant de transaction si OK.
        """
        pass

    @abstractmethod
    def capture(self, transaction_id: str) -> None:
        """Capturer (valider) un paiement déjà autorisé."""
        pass

    @abstractmethod
    def cancel(self, transaction_id: str) -> None:
        """Annuler une transaction autorisée."""
        pass

    @abstractmethod
    def end_session(self) -> None:
        """Clore proprement la session de paiement."""
        pass


class RiskEngine(ABC):
    """
    Contrat pour un moteur de risque / anti-fraude.
    """

    @abstractmethod
    def score(self, user_id: str, amount: float) -> float:
        """
        Retourne un score de risque entre 0 et 1.
        0 = aucun risque, 1 = très risqué.
        """
        pass


# ==========================
# Étape 2 : Implémentations concrètes (simulation)
# ==========================

class SimulatedPaymentGateway(PaymentGateway):
    """
    Gateway simulée pour les tests.
    Ne parle à aucune vraie banque, juste des prints.
    """

    def __init__(self) -> None:
        self._session_open = False

    def start_session(self) -> None:
        print("[GATEWAY SIM] Ouverture de session de paiement")
        self._session_open = True

    def authorize(self, amount: float, currency: str) -> str:
        if not self._session_open:
            raise RuntimeError("Session non ouverte")

        print(f"[GATEWAY SIM] Autorisation de {amount} {currency}")
        # on simule un id de transaction
        return "SIM-TRANSACTION-123"

    def capture(self, transaction_id: str) -> None:
        if not self._session_open:
            raise RuntimeError("Session non ouverte")

        print(f"[GATEWAY SIM] Capture de la transaction {transaction_id}")

    def cancel(self, transaction_id: str) -> None:
        if not self._session_open:
            raise RuntimeError("Session non ouverte")

        print(f"[GATEWAY SIM] Annulation de la transaction {transaction_id}")

    def end_session(self) -> None:
        print("[GATEWAY SIM] Fermeture de session de paiement")
        self._session_open = False


class SimpleRiskEngine(RiskEngine):
    """
    Moteur de risque très simplifié.
    Règle débile mais pratique pour la démo :
      - si montant > 1000 => risque élevé (0.9)
      - sinon => risque faible (0.1)
    """

    def score(self, user_id: str, amount: float) -> float:
        if amount > 1000:
            score = 0.9
        else:
            score = 0.1

        print(f"[RISK] user={user_id}, amount={amount}, score={score}")
        return score


# ==========================
# Étape 3 : Ressource (Wallet marchand)
# ==========================

class MerchantWallet:
    """
    Représente le wallet / compte du marchand.
    On va juste simuler le solde disponible.
    """

    def __init__(self, balance: float = 0.0) -> None:
        self.balance = balance

    def credit(self, amount: float) -> None:
        """Créditer le wallet (réception d'argent)."""
        if amount <= 0:
            return
        self.balance += amount

    def can_receive(self, amount: float) -> bool:
        """
        Dans un cas réel, on aurait d'autres contraintes (plafonds journaliers, etc.).
        Ici on accepte toujours.
        """
        return True


# ==========================
# Étape 4 : Service métier principal (PaymentService)
# ==========================

class PaymentService:
    """
    Orchestrateur des paiements :
      - demande une autorisation au gateway
      - vérifie le risque
      - crédite le merchant si tout va bien
    """

    def __init__(
        self,
        gateway: PaymentGateway,
        risk_engine: RiskEngine,
        merchant_wallet: MerchantWallet,
        risk_threshold: float = 0.8,
    ) -> None:
        self.gateway = gateway
        self.risk_engine = risk_engine
        self.merchant_wallet = merchant_wallet
        self.risk_threshold = risk_threshold

    def process_payment(self, user_id: str, amount: float, currency: str) -> None:
        """
        Scénario de paiement :
          1) Ouvrir une session gateway
          2) Vérifier le risque
          3) Si risque trop élevé => refuser
          4) Sinon => autoriser puis capturer
          5) Créditer le wallet marchand
          6) Fermer la session
        """

        print(
            f"[PAYMENT] Début du paiement user={user_id}, "
            f"amount={amount} {currency}, wallet={self.merchant_wallet.balance}"
        )

        # 1) Session gateway
        self.gateway.start_session()

        # 2) Score de risque
        risk_score = self.risk_engine.score(user_id, amount)
        if risk_score > self.risk_threshold:
            print(
                f"[PAYMENT] Paiement refusé pour cause de risque élevé "
                f"(score={risk_score})"
            )
            self.gateway.end_session()
            return

        # 3) Autorisation
        transaction_id = self.gateway.authorize(amount, currency)

        # Ici on pourrait encore faire des vérifs (stock, plafond, etc.)
        if not self.merchant_wallet.can_receive(amount):
            print("[PAYMENT] Problème côté merchant, annulation de la transaction")
            self.gateway.cancel(transaction_id)
            self.gateway.end_session()
            return

        # 4) Capture
        self.gateway.capture(transaction_id)

        # 5) Crédit du wallet
        self.merchant_wallet.credit(amount)

        # 6) Fin de session
        self.gateway.end_session()

        print(
            f"[PAYMENT] Paiement réussi, nouveau solde marchand = "
            f"{self.merchant_wallet.balance}\n"
        )


# ==========================
# Étape 5 : Scénarios de test
# ==========================

if __name__ == "__main__":
    # Implémentations concrètes
    gateway = SimulatedPaymentGateway()
    risk_engine = SimpleRiskEngine()
    merchant_wallet = MerchantWallet(balance=0.0)

    service = PaymentService(
        gateway=gateway,
        risk_engine=risk_engine,
        merchant_wallet=merchant_wallet,
        risk_threshold=0.8,
    )

    # --- Cas 1 : petit montant, risque faible -> paiement OK ---
    service.process_payment(user_id="user-123", amount=150, currency="EUR")

    # --- Cas 2 : gros montant, risque élevé -> paiement refusé ---
    service.process_payment(user_id="user-456", amount=5000, currency="EUR")
```

---

### Ce que tu dois surtout voir :

* `PaymentGateway` = ton `FlyghtController`
* `RiskEngine` = ton `Sensor`
* `MerchantWallet` = ta `Battery`
* `PaymentService` = ton `Drone2`
* Bloc `if __name__ == "__main__":` = tes scénarios de test (batterie faible / risque élevé / etc.)

Si tu veux, on peut faire la même logique pour un **jeu vidéo simple** (player, engine, input, etc.) pour bien ancrer le pattern.








































