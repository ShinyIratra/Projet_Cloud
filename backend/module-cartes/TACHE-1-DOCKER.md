# TÂCHE 1 — Initialisation de l'environnement Docker

## ✅ Ce qui a été fait

### 1. Installation des prérequis
- Docker Desktop installé (vérifiable via `docker --version`)
- Docker Compose intégré à Docker Desktop

### 2. Création du fichier docker-compose.yml
**Emplacement** : `backend/module-cartes/docker-compose.yml`

**Configuration** :
- **Image** : `overv/openstreetmap-tile-server:latest`
- **Conteneur** : `osm-tile-server`
- **Port** : 8080 (host) → 80 (conteneur)
- **Volumes** :
  - `osm-data` : stockage de la base de données PostgreSQL/PostGIS
  - `./` monté sur `/data/region/` : pour accéder aux fichiers .osm.pbf
- **Variables d'environnement** :
  - `THREADS=2` : utilisation de 2 threads pour le rendu
  - `OSM2PGSQL_EXTRA_ARGS=-C 2048` : 2 GB de cache pour l'import

### 3. Commandes pour lancer le serveur

#### Première initialisation (import des données)
```powershell
# Se placer dans le dossier module-cartes
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes

# Lancer l'import (TÂCHE 2 - voir fichier correspondant)
docker-compose run --rm osm-tile-server import

# Démarrer le serveur
docker-compose up -d
```

#### Démarrage après initialisation
```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes
docker-compose up -d
```

#### Vérification
```powershell
# Vérifier que le conteneur tourne
docker ps --filter "name=osm-tile-server"

# Voir les logs
docker logs osm-tile-server --tail 50

# Arrêter le serveur
docker-compose down
```

### 4. Preuves que le conteneur fonctionne

**Commande de vérification** :
```powershell
docker ps --filter "name=osm-tile-server"
```

**Résultat attendu** :
```
NAMES             STATUS        PORTS
osm-tile-server   Up X minutes  0.0.0.0:8080->80/tcp
```

**URL d'accès** :
- Serveur : `http://localhost:8080`
- Test d'une tuile : `http://localhost:8080/tile/0/0/0.png`

---

## ❌ Ce qui n'a PAS été fait (volontairement)

### 1. Aucune donnée importée
L'import des données est traité dans la **TÂCHE 2**.

### 2. Aucun test Leaflet
Le test d'affichage est traité dans la **TÂCHE 3**.

### 3. Aucune logique métier
Pas d'intégration avec Firebase, pas de gestion des signalements, pas d'API.

---

## 📝 Pourquoi cette approche ?

### Séparation des responsabilités
- **TÂCHE 1** = Infrastructure Docker uniquement
- **TÂCHE 2** = Données
- **TÂCHE 3** = Validation visuelle

### Avantages
1. **Testabilité** : Chaque tâche peut être validée indépendamment
2. **Débogage** : Si un problème survient, on sait dans quelle couche chercher
3. **Réutilisabilité** : Le Docker peut servir pour d'autres villes/régions

---

## 🔍 Validation de la TÂCHE 1

### Checklist
- [x] Docker Desktop installé
- [x] Fichier `docker-compose.yml` créé
- [x] Configuration du serveur de tuiles définie
- [x] Commandes documentées
- [ ] Conteneur démarré (à faire après TÂCHE 2)

**⚠️ IMPORTANT** : Le conteneur ne peut pas démarrer correctement tant que les données ne sont pas importées (TÂCHE 2).

---

## 📌 Prochaine étape

→ **TÂCHE 2** : Télécharger et importer les données OSM d'Antananarivo
