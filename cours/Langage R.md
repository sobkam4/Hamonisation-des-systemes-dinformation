Parfait 👍 voici ton **fichier complet, propre, structuré et enrichi** avec toutes les explications ajoutées, prêt à être utilisé comme **cours / fiche de révision**.

---

# 📘 Bases du langage R

## Types de données, structures et fonctions essentielles

---

# 1️⃣ Caractère d’invite de commande

Le caractère d’invite de commande permet d’entrer des instructions R et d’obtenir immédiatement un résultat dans la console.

---

# 2️⃣ Les types de données

### 🔹 numeric

→ Représente les nombres entiers ou décimaux.

### 🔹 character

→ Représente les chaînes de caractères (texte).

### 🔹 logical

→ Représente les valeurs booléennes : TRUE ou FALSE.

---

## Fonctions liées aux types

### `mode(x)`

→ Indique le type interne d’une donnée ou d’un objet.

### `is.numeric(x)`

→ Vérifie si une donnée est numérique et retourne TRUE ou FALSE.

### `as.character(x)`

→ Force la conversion d’une donnée en chaîne de caractères.

---

# 3️⃣ Les structures de données

---

## 🔹 Vecteur

Suite de données du **même type**.

### Création

```r
c(1, 2, 3)
```

### Vérification

```r
is.vector(c(1,2,3))
```

---

## 🔹 Matrice

Tableau à **deux dimensions** contenant un seul type de données.

### Création

```r
matrix(1:9, nrow = 3, ncol = 3, byrow = TRUE)
```

### Paramètres

* `1:9` → valeurs à insérer
* `nrow` → nombre de lignes
* `ncol` → nombre de colonnes
* `byrow = TRUE` → remplissage par ligne
* `byrow = FALSE` → remplissage par colonne

### Vérification

```r
is.matrix(...)
```

---

## 🔹 Array

Tableau à **plus de deux dimensions** contenant un seul type de données.

### Création

```r
array(1:12, c(3, 2, 2))
```

### Signification des dimensions

* 3 → lignes
* 2 → colonnes
* 2 → troisième dimension

---

## 🔹 Data frame

Tableau structuré où :

* chaque ligne = un individu
* chaque colonne = une variable
* les types peuvent varier entre colonnes

### Exemple

```r
data.frame(
  nom = c("A", "B"),
  age = c(20, 25),
  row.names = c("id1", "id2")
)
```

---

## 🔹 Liste

Structure pouvant contenir plusieurs objets de types différents.

```r
list(1, "texte", TRUE)
```

---

## 🔹 Facteur

Vecteur catégoriel utilisé en statistique.

```r
factor(c("Homme", "Femme", "Homme"))
```

### Niveaux

```r
levels(factor(c("Homme", "Femme")))
```

→ Affiche les catégories possibles.

---

# 4️⃣ Fonctions de base

---

## Affectation

Stocker une valeur dans un objet :

```r
a <- b + c
```

---

## Séquences de nombres

### Génération contrôlée

```r
seq(debut, fin, pas)
seq(1, 25, 3)
```

### Génération simple

```r
11:20
```

→ crée une suite avec un pas de 1.

---

## Répétition

```r
rep(2, 5)
```

→ répète la valeur 2 cinq fois.

---

## Fonctions statistiques

```r
vec <- c(8, 12, 3, 2, 5)
```

### Fonctions

* `sum(vec)` → somme totale
* `mean(vec)` → moyenne
* `sd(vec)` → écart-type (dispersion)
* `min(vec)` → plus petite valeur
* `max(vec)` → plus grande valeur
* `length(vec)` → nombre d’éléments

---

## Résumé automatique

```r
summary(vec)
```

→ fournit un résumé statistique adapté à l’objet.

---

# 5️⃣ Extraction et sélection des données

---

## Sur un vecteur

```r
longvec <- 50:150

longvec[24]      # élément 24
longvec[c(24,42)]# éléments 24 et 42
longvec[24:42]   # éléments de 24 à 42
```

---

## Sur une matrice

```r
mat[1, ]   # première ligne
mat[, 2]   # deuxième colonne
mat[1, 2]  # ligne 1, colonne 2
```

---

## Sur un data frame

```r
df[3, 2]       # ligne 3, colonne 2
df$Taille      # colonne Taille
```

---

## Sélection conditionnelle

```r
df[df$Taille > 160, ]
```

→ garde seulement les individus dont la taille est supérieure à 160.

---

# 6️⃣ Scripts et commentaires

---

## Script

Un script est un fichier `.R` qui contient du code R enregistré.

---

## Commentaire

```r
# Ceci est un commentaire
```

→ ligne ignorée par R.

---

# ✅ Conclusion

Ce document constitue une base complète pour :

* comprendre R
* lire du code
* manipuler des données
* réussir un examen ou un TP

---

✅ Si tu veux, je peux maintenant :

* transformer ce fichier en **PDF prêt à imprimer**
* ou ajouter une section **exercices corrigés**
* ou faire une **version ultra-résumé 1 page** 📄
 