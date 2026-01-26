# 🗺️ Guide Complet : Carte Hors-Ligne avec OpenStreetMap

**Projet** : RoadAlert - Carte hors-ligne pour Madagascar  
**Date** : Janvier 2026  
**Technologies** : Docker, PostgreSQL/PostGIS, OSM Tile Server, React + Vite + Leaflet

---

## 🎯 Pour une nouvelle personne : Que télécharger IMPÉRATIVEMENT ?

Si tu donnes ce projet à quelqu'un d'autre, voici **exactement** ce qu'il/elle doit installer :

### 1️⃣ Docker Desktop (OBLIGATOIRE)
- **Télécharger** : https://www.docker.com/products/docker-desktop/
- **Version** : Windows (si sur Windows), Mac (si sur Mac)
- **Taille** : ~500 MB
- **Pourquoi** : Fait tourner les serveurs PostgreSQL et OSM Tile Server
- **Installation** : Suivre l'assistant d'installation, redémarrer si demandé

### 2️⃣ Node.js (OBLIGATOIRE)
- **Télécharger** : https://nodejs.org/
- **Version recommandée** : LTS (Long Term Support) - actuellement v20.x ou v18.x
- **Taille** : ~50 MB
- **Pourquoi** : Nécessaire pour le frontend (Vite/React)
- **Vérification après installation** : `node --version` et `npm --version` dans PowerShell

### 3️⃣ Fichier region.osm.pbf (OBLIGATOIRE)
- **C'est quoi** : Données cartographiques OpenStreetMap de Madagascar
- **Taille** : ~50-200 MB selon la région
- **Où l'obtenir** : 
  - **Option A** : Télécharger depuis Geofabrik : https://download.geofabrik.de/africa/madagascar.html
  - **Option B** : Tu lui fournis directement ton fichier `region.osm.pbf`
- **Où le mettre** : `backend/module-cartes/region.osm.pbf` (créer le dossier `module-cartes` si nécessaire)
- **Pourquoi** : Contient TOUTES les données de routes, bâtiments, points d'intérêt de Madagascar

### 4️⃣ Le code du projet (OBLIGATOIRE)
- **Comment** : 
  - Clone du repository Git : `git clone <url-du-repo>`
  - Ou copie complète du dossier `Projet_Cloud`
- **Dossiers importants à vérifier** :
  - `backend/module-cartes/leaflet/` (CSS, JS, images Leaflet)
  - `docker-compose.yml` (à la racine)
  - `frontend-web/roadAlert/` (code React)

### 5️⃣ Git (OPTIONNEL mais recommandé)
- **Télécharger** : https://git-scm.com/download/win
- **Pourquoi** : Pour cloner le repo et gérer les versions
- **Alternative** : Télécharger le projet en ZIP

---

## ⚠️ CE QUI NE DOIT PAS être téléchargé manuellement

**Pas besoin de télécharger séparément** :
- ❌ Leaflet (déjà dans `backend/module-cartes/leaflet/`)
- ❌ PostgreSQL (fourni par Docker)
- ❌ OSM Tile Server (fourni par Docker)
- ❌ Dépendances npm (installées avec `npm install`)
- ❌ Images Docker (téléchargées automatiquement par `docker-compose`)

---

## 📦 Récapitulatif - Checklist installation nouvelle personne

**Avant de commencer** :
- [ ] Docker Desktop installé et démarré
- [ ] Node.js installé (vérifier : `node --version`)
- [ ] Fichier `region.osm.pbf` placé dans `backend/module-cartes/`
- [ ] Code du projet complet (clone Git ou copie)
- [ ] Navigateur web moderne (Chrome/Firefox/Edge)

**Total espace disque requis** : ~2-3 GB (Docker images + données OSM + node_modules)

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Architecture du système](#architecture-du-système)
3. [Étape 1 : Vérification Docker](#étape-1--vérification-docker)
4. [Étape 2 : Import des données OSM (une seule fois)](#étape-2--import-des-données-osm-une-seule-fois)
5. [Étape 3 : Démarrage des services Docker](#étape-3--démarrage-des-services-docker)
6. [Étape 4 : Vérification du serveur de tuiles](#étape-4--vérification-du-serveur-de-tuiles)
7. [Étape 5 : Installation et démarrage du frontend](#étape-5--installation-et-démarrage-du-frontend)
8. [Étape 6 : Test dans le navigateur](#étape-6--test-dans-le-navigateur)
9. [Étape 7 : Test hors-ligne](#étape-7--test-hors-ligne)
10. [Commandes récapitulatives](#commandes-récapitulatives)
11. [Résolution des problèmes](#résolution-des-problèmes)
12. [Arrêt des services](#arrêt-des-services)

---

## Prérequis

### Logiciels requis

- ✅ **Docker Desktop** (version récente avec docker-compose)
- ✅ **Node.js** (version 16+)
- ✅ **npm** (inclus avec Node.js)
- ✅ **Navigateur web** (Chrome, Firefox, Edge)
- ✅ **PowerShell** (inclus dans Windows)

### Fichiers requis

- ✅ `region.osm.pbf` : Fichier de données OSM pour Madagascar (doit être dans `backend/module-cartes/`)
- ✅ `docker-compose.yml` : Configuration des services Docker (à la racine)
- ✅ Dossier `backend/module-cartes/leaflet/` : Assets Leaflet (CSS, JS, images)
- ✅ Frontend modifié : `frontend-web/roadAlert/src/pages/Home.tsx`

### Vérification des fichiers

```powershell
# À exécuter depuis la racine du projet
Test-Path "docker-compose.yml"  # Doit afficher True
Test-Path "backend/module-cartes/region.osm.pbf"  # Doit afficher True
Test-Path "frontend-web/roadAlert/public/leaflet/leaflet.css"  # Doit afficher True
```

---

## Architecture du système

```
┌─────────────────────────────────────────────────────────┐
│                    NAVIGATEUR WEB                        │
│              http://localhost:5173                       │
│                    (React + Vite)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Requêtes tuiles
                     │ http://localhost:8080/tile/{z}/{x}/{y}.png
                     ▼
┌─────────────────────────────────────────────────────────┐
│              OSM TILE SERVER (Docker)                    │
│                   Port 8080                              │
│         Rendu des tuiles à la demande                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Requêtes SQL
                     │ PostgreSQL
                     ▼
┌─────────────────────────────────────────────────────────┐
│          POSTGRESQL + POSTGIS (Docker)                   │
│                   Port 5433                              │
│       Base de données 'gis' avec données OSM             │
└─────────────────────────────────────────────────────────┘
```

**Principe** : Le frontend charge des tuiles depuis le serveur local (localhost:8080), qui les génère à partir de la base PostgreSQL contenant les données OSM de Madagascar.

---

## Étape 1 : Vérification Docker

### 1.1 Vérifier que Docker est installé et démarré

```powershell
docker --version
docker-compose --version
```

**Attendu** :
```
Docker version 24.x.x ou supérieur
Docker Compose version v2.x.x ou supérieur
```

### 1.2 Vérifier que Docker Desktop est en cours d'exécution

- Cherche l'icône Docker dans la barre des tâches Windows
- Elle doit afficher "Docker Desktop is running"
- Si Docker n'est pas démarré, lance Docker Desktop et attends qu'il soit prêt

### 1.3 Tester Docker

```powershell
docker ps
```

**Attendu** : Commande s'exécute sans erreur (même si aucun conteneur n'est en cours)

---

## Étape 2 : Import des données OSM (une seule fois)

> ⚠️ **IMPORTANT** : Cette étape ne doit être faite **qu'une seule fois**. Elle peut prendre **10-20 minutes** selon la taille du fichier .osm.pbf.

### 2.1 Naviguer vers la racine du projet

```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud
```

### 2.2 Vérifier la présence du fichier OSM

```powershell
Test-Path "backend\module-cartes\region.osm.pbf"
```

**Attendu** : `True`  
**Si False** : Le fichier `region.osm.pbf` est manquant. Consulte `backend/module-cartes/TELECHARGER-DONNEES-OSM.md`

### 2.3 Lancer l'import

```powershell
docker-compose run --rm osm-tile-server import
```

**Ce que fait cette commande** :
1. Crée le conteneur PostgreSQL s'il n'existe pas
2. Lance le processus d'import OSM (osm2pgsql)
3. Lit le fichier `region.osm.pbf`
4. Crée les tables PostgreSQL : `planet_osm_point`, `planet_osm_line`, `planet_osm_polygon`, `planet_osm_roads`
5. Crée les index pour optimiser les requêtes
6. Télécharge des données supplémentaires (water polygons, ice sheets) - **optionnel, peut être interrompu**

### 2.4 Suivi de l'import

**Pendant l'import tu verras** :
```
** WARNING: 19:35:11.520: Detected database cluster in /var/lib/postgresql/...
** INFO: 19:35:11.738: Initialising to database gis as user renderer
Using projection SRS 3857 (Spherical Mercator)
...
Processing: Node(xxxk xxxk/s) Way(xxxk xxxk/s) Relation(xxx xxx/s)
...
node cache: stored: ...
...
osm2pgsql took 838s (13m 58s) overall
```

**Progression** :
- Nodes : Lecture des nœuds OSM (points GPS)
- Ways : Lecture des chemins (routes, bâtiments)
- Relations : Lecture des relations (zones complexes)

### 2.5 Import terminé

**Message de succès** :
```
osm2pgsql took XXXs overall
```

**Si le téléchargement externe (water_polygons, icesheet) bloque** :
- Tu peux l'interrompre avec `Ctrl+C`
- L'import principal des données OSM est déjà fait
- Ces données externes ne sont pas critiques pour Madagascar

### 2.6 Vérification de l'import

```powershell
docker-compose run --rm postgres psql -U renderer -d gis -c "\dt"
```

**Attendu** : Liste des tables incluant `planet_osm_point`, `planet_osm_line`, `planet_osm_polygon`, `planet_osm_roads`

---

## Étape 3 : Démarrage des services Docker

### 3.1 Naviguer vers la racine (si pas déjà fait)

```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud
```

### 3.2 Démarrer PostgreSQL + OSM Tile Server

```powershell
docker-compose up -d postgres osm-tile-server
```

**Ce que fait cette commande** :
- `-d` : Mode détaché (arrière-plan)
- Démarre le conteneur PostgreSQL sur le port **5433**
- Démarre le conteneur osm-tile-server sur le port **8080**

**Attendu** :
```
[+] Running 2/2
 ✔ Container roadalert_db         Started
 ✔ Container osm-tile-server      Started
```

### 3.3 Vérifier que les conteneurs sont démarrés

```powershell
docker ps --filter "name=osm-tile-server" --filter "name=roadalert_db"
```

**Attendu** :
```
CONTAINER ID   IMAGE                                   STATUS          PORTS
xxxxx          overv/openstreetmap-tile-server        Up X minutes    0.0.0.0:8080->80/tcp
xxxxx          postgis/postgis:15-3.4-alpine          Up X minutes    0.0.0.0:5433->5432/tcp
```

**Vérifications** :
- ✅ STATUS doit être **Up** pour les deux conteneurs
- ✅ PORTS : `0.0.0.0:8080->80/tcp` (tile server) et `0.0.0.0:5433->5432/tcp` (postgres)

### 3.4 Vérifier les logs (optionnel)

```powershell
# Logs du serveur de tuiles
docker logs osm-tile-server --tail 30

# Logs PostgreSQL
docker logs roadalert_db --tail 30
```

**Attendu pour osm-tile-server** :
```
** INFO: Running in foreground mode...
** INFO: Loading parameterization function for
```

**Erreurs normales à ignorer** :
```
ERROR: relation "icesheet_polygons" does not exist
```
> Ces erreurs concernent des données externes non critiques (glaces, antarctique). Le serveur fonctionne normalement malgré ces messages.

---

## Étape 4 : Vérification du serveur de tuiles

### 4.1 Test HTTP simple

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/" -Method Get
```

**Attendu** : Réponse HTML de la page d'accueil du serveur (peut afficher du code HTML)

### 4.2 Test d'une tuile (dans le navigateur)

Ouvre ton navigateur et va sur :
```
http://localhost:8080/tile/10/527/512.png
```

**Attendu** : 
- ✅ Une image PNG s'affiche (tuile de carte)
- ✅ Pas de message d'erreur 404

> **Note** : Les tuiles sont générées **à la demande** (on-the-fly). La première demande peut prendre quelques secondes. Les tuiles suivantes seront en cache.

### 4.3 Vérifier la génération de tuiles

Si la tuile s'affiche, le serveur fonctionne ! Sinon :

```powershell
# Vérifier les logs en temps réel
docker logs osm-tile-server --follow
```

Puis recharge la page navigateur. Tu devrais voir dans les logs :
```
DEBUG: START TILE default ...
DEBUG: DONE TILE default ...
```

---

## Étape 5 : Installation et démarrage du frontend

### 5.1 Naviguer vers le dossier frontend

```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\frontend-web\roadAlert
```

### 5.2 Installer les dépendances (première fois seulement)

```powershell
npm install
```

**Durée** : ~30 secondes à 1 minute

**Attendu** :
```
added 774 packages, and audited 775 packages in XXs
```

**Warnings à ignorer** :
- `deprecated whatwg-encoding`
- `deprecated abab`
- `X vulnerabilities` : Normal pour un projet de développement

### 5.3 Démarrer le serveur Vite

```powershell
npm run dev
```

**Attendu** :
```
VITE v5.4.21  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

> ⚠️ **NE FERME PAS CETTE FENÊTRE** : Le serveur doit rester actif. Ouvre un nouveau terminal PowerShell si tu as besoin d'exécuter d'autres commandes.

### 5.4 Vérifier le serveur

Ouvre ton navigateur et va sur :
```
http://localhost:5173
```

**Attendu** : L'application RoadAlert s'affiche

---

## Étape 6 : Test dans le navigateur

### 6.1 Accéder à la page Home

Dans le navigateur sur `http://localhost:5173`, navigue vers la **page Home** (route `/home` ou bouton Home dans l'interface).

### 6.2 Ouvrir DevTools

- **Windows/Linux** : Appuie sur `F12`
- **Ou** : Clic droit → "Inspecter" ou "Inspecter l'élément"

### 6.3 Aller dans l'onglet Network

1. Clique sur l'onglet **Network** (Réseau)
2. Dans le champ de filtre, tape : `localhost:8080` ou `tile`

### 6.4 Recharger la page

Appuie sur `F5` pour recharger la page

### 6.5 Vérifications

**Dans l'onglet Network tu dois voir** :

✅ **Requêtes vers les tuiles** :
```
http://localhost:8080/tile/13/4225/4107.png    Status: 200   Type: png
http://localhost:8080/tile/13/4226/4107.png    Status: 200   Type: png
http://localhost:8080/tile/13/4225/4108.png    Status: 200   Type: png
...
```

**Détails importants** :
- **Status** : Doit être **200 OK** (ou **304 Not Modified** si en cache)
- **Type** : `png` ou `image/png`
- **Size** : Quelques Ko à plusieurs dizaines de Ko par tuile

✅ **Sur la carte elle-même** :
- Tuiles de carte affichées (rues, bâtiments, noms de lieux)
- Carte centrée sur **Antananarivo** (coordonnées : -18.8792, 47.5079)
- Zoom/pan fonctionnel

### 6.6 En cas de problème

**Si tu vois des erreurs 404 sur les tuiles** :
1. Vérifie que `docker ps` montre bien osm-tile-server en **Up**
2. Teste manuellement : `http://localhost:8080/tile/10/527/512.png`
3. Vérifie les logs : `docker logs osm-tile-server --tail 50`

**Si la carte est vide ou affiche uniquement le fond** :
1. Vérifie dans DevTools → Console pour des erreurs JavaScript
2. Vérifie que le fichier `public/leaflet/leaflet.css` existe
3. Vérifie l'import CSS dans `Home.tsx` : `import '/leaflet/leaflet.css'`

---

## Étape 7 : Test hors-ligne

### 7.1 État de départ

Assure-toi que :
- ✅ La carte s'affiche correctement avec les tuiles
- ✅ Tu vois les requêtes `localhost:8080/tile/...` dans Network (étape 6)

### 7.2 Vider le cache du navigateur (optionnel mais recommandé)

1. Dans DevTools, reste sur l'onglet **Network**
2. **Clic droit** sur la liste des requêtes → **Clear browser cache**
3. Ou appuie sur `Ctrl+Shift+Delete` → Vider le cache

### 7.3 Déconnecter Internet

**Windows** :
- **Wi-Fi** : Clique sur l'icône réseau dans la barre des tâches → Désactive Wi-Fi
- **Ethernet** : Débranche le câble réseau
- **Ou** : Mode Avion (si disponible)

**Vérification** :
- L'icône réseau doit montrer "Déconnecté" ou "Pas d'Internet"

### 7.4 Recharger la page

Appuie sur `Ctrl+F5` (rechargement complet, ignore le cache)

### 7.5 Vérification du mode hors-ligne

**✅ SUCCÈS - La carte doit toujours s'afficher** :
- Tuiles visibles
- Zoom/pan fonctionnel
- Requêtes `localhost:8080/tile/...` dans Network avec Status **200 OK**

**Explication** : Les tuiles proviennent du serveur **local** (localhost), donc pas besoin d'Internet !

**❌ ÉCHEC - Si la carte ne s'affiche pas** :
- Vérifie que Docker Desktop est toujours en cours d'exécution
- Vérifie `docker ps` : les conteneurs doivent être **Up**
- Consulte la section [Résolution des problèmes](#résolution-des-problèmes)

### 7.6 Reconnecter Internet

Une fois le test terminé, réactive ta connexion Internet.

---

## Commandes récapitulatives

### Ordre d'exécution complet (après la première installation)

```powershell
# 1. Démarrer Docker Desktop (interface graphique)

# 2. Démarrer les services Docker (racine du projet)
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud
docker-compose up -d postgres osm-tile-server

# 3. Vérifier les conteneurs
docker ps

# 4. Démarrer le frontend (nouveau terminal)
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\frontend-web\roadAlert
npm run dev

# 5. Ouvrir le navigateur
# → http://localhost:5173
```

### Commandes utiles

```powershell
# Voir tous les conteneurs en cours
docker ps

# Voir les logs d'un service
docker logs osm-tile-server
docker logs roadalert_db

# Voir les logs en temps réel (Ctrl+C pour arrêter)
docker logs osm-tile-server --follow

# Redémarrer un service
docker-compose restart osm-tile-server

# Arrêter tous les services
docker-compose down

# Vérifier l'espace disque utilisé par Docker
docker system df
```

---

## Résolution des problèmes

### Problème 1 : Tuiles affichent 404 Not Found

**Symptôme** : Dans Network, les requêtes `localhost:8080/tile/...` renvoient **404**

**Causes possibles** :
1. L'import OSM n'a pas été fait ou a échoué
2. Le conteneur osm-tile-server n'accède pas à la base PostgreSQL

**Solutions** :

```powershell
# Vérifier les logs du tile server
docker logs osm-tile-server --tail 50

# Si tu vois "ERROR: connection to server failed", redémarre les services
docker-compose restart postgres osm-tile-server

# Si l'import n'a jamais été fait, lance-le :
docker-compose run --rm osm-tile-server import
```

### Problème 2 : Conteneur osm-tile-server en crash/exit

**Symptôme** : `docker ps` ne montre pas osm-tile-server, ou STATUS = **Exited**

**Diagnostic** :

```powershell
# Voir tous les conteneurs (y compris arrêtés)
docker ps -a

# Voir les logs de démarrage
docker logs osm-tile-server
```

**Causes fréquentes** :
- Fichier `region.osm.pbf` introuvable ou chemin incorrect dans docker-compose.yml
- Erreur PostgreSQL (nom de base, utilisateur)

**Solution** :

```powershell
# Supprimer et recréer le conteneur
docker-compose down
docker-compose up -d postgres osm-tile-server

# Vérifier les logs en temps réel
docker logs osm-tile-server --follow
```

### Problème 3 : CSS Leaflet non chargé

**Symptôme** : Carte affichée mais sans styles (marqueurs invisibles, pas de zoom controls)

**Vérification** :

```powershell
# Vérifier que le fichier CSS existe
Test-Path "D:\ITU_V2\Mr_Rojo\Projet_Cloud\frontend-web\roadAlert\public\leaflet\leaflet.css"
```

**Attendu** : `True`

**Si False** :

```powershell
# Copier les assets Leaflet depuis le module backend
Copy-Item -Path "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes\leaflet" `
          -Destination "D:\ITU_V2\Mr_Rojo\Projet_Cloud\frontend-web\roadAlert\public\" `
          -Recurse -Force
```

**Vérifier dans Home.tsx** :
- Ligne ~6 : `import '/leaflet/leaflet.css'` (et NON `import 'leaflet/dist/leaflet.css'`)

### Problème 4 : Port 8080 déjà utilisé

**Symptôme** : Erreur au démarrage : `port is already allocated` ou `address already in use`

**Solution** :

```powershell
# Trouver quel processus utilise le port 8080
netstat -ano | findstr :8080

# Note le PID (dernière colonne)
# Arrêter le processus (remplace <PID> par le numéro)
taskkill /PID <PID> /F

# Ou changer le port dans docker-compose.yml
# Ligne du service osm-tile-server, section ports :
# "8081:80"  # Au lieu de "8080:80"

# Puis mettre à jour Home.tsx :
# http://localhost:8081/tile/{z}/{x}/{y}.png
```

### Problème 5 : Postgres non accessible

**Symptôme** : Tile server ne peut pas se connecter à PostgreSQL

**Vérification** :

```powershell
# Vérifier que Postgres est bien démarré
docker ps --filter "name=roadalert_db"

# Tester la connexion
docker-compose exec postgres psql -U renderer -d gis -c "SELECT version();"
```

**Attendu** : Version de PostgreSQL affichée

**Si erreur** :

```powershell
# Redémarrer PostgreSQL
docker-compose restart postgres

# Attendre 5 secondes puis redémarrer tile server
Start-Sleep -Seconds 5
docker-compose restart osm-tile-server
```

### Problème 6 : Carte vide (fond gris)

**Symptôme** : Cadre de carte affiché, contrôles zoom présents, mais aucune tuile

**Vérifications** :

1. **DevTools → Console** : Erreurs JavaScript ?
2. **DevTools → Network** : Requêtes vers `localhost:8080` ?

**Si pas de requêtes vers localhost:8080** :

Vérifie dans `frontend-web/roadAlert/src/pages/Home.tsx` :

```typescript
// Ligne ~58-62, doit contenir :
L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

**Si requêtes 404 ou 500** : Voir [Problème 1](#problème-1--tuiles-affichent-404-not-found)

### Problème 7 : Import OSM très lent ou bloqué

**Symptôme** : `docker-compose run --rm osm-tile-server import` bloqué pendant longtemps sur "Downloading..."

**Explication** : Le serveur télécharge des données externes (water polygons, icesheet) qui peuvent être volumineuses et lentes.

**Solution** :

1. **Interromps avec `Ctrl+C`**
2. L'import principal OSM est probablement déjà terminé
3. Ces données externes ne sont pas critiques pour Madagascar
4. Vérifie que l'import principal est fait :

```powershell
docker-compose run --rm postgres psql -U renderer -d gis -c "\dt"
```

Si tu vois `planet_osm_point`, `planet_osm_line`, `planet_osm_polygon`, `planet_osm_roads` → Import OK !

---

## Arrêt des services

### Arrêt du frontend

Dans le terminal où `npm run dev` tourne :
1. Appuie sur `Ctrl+C`
2. Attends le message "Build stopped"

### Arrêt des services Docker

```powershell
# Arrêter les conteneurs (ils peuvent être redémarrés)
docker-compose stop

# Ou arrêter ET supprimer les conteneurs (pas les données)
docker-compose down
```

> **Note** : Les données PostgreSQL et le cache de tuiles sont dans des **volumes Docker persistants**. Même après `docker-compose down`, tes données restent sauvegardées.

### Redémarrage après arrêt

```powershell
# Pas besoin de refaire l'import !
docker-compose up -d postgres osm-tile-server
cd frontend-web\roadAlert
npm run dev
```

---

## Récapitulatif final des ports

| Service            | Port hôte | Port conteneur | URL d'accès                |
|--------------------|-----------|----------------|----------------------------|
| PostgreSQL         | 5433      | 5432           | localhost:5433             |
| OSM Tile Server    | 8080      | 80             | http://localhost:8080      |
| Frontend Vite      | 5173      | -              | http://localhost:5173      |
| Backend (optionnel)| 5000      | -              | http://localhost:5000      |

---

## Structure des fichiers importants

```
Projet_Cloud/
├── docker-compose.yml                          # Config Docker
├── backend/
│   └── module-cartes/
│       ├── region.osm.pbf                      # Données OSM (Madagascar)
│       └── leaflet/                            # Assets Leaflet (source)
│           ├── leaflet.css
│           ├── leaflet.js
│           └── images/
└── frontend-web/
    └── roadAlert/
        ├── public/
        │   └── leaflet/                        # Assets Leaflet (copie pour Vite)
        │       ├── leaflet.css
        │       ├── leaflet.js
        │       └── images/
        └── src/
            └── pages/
                └── Home.tsx                    # Page principale avec la carte
```

---

## Modifications apportées au code

### Home.tsx

**Ligne 6** - Import CSS Leaflet local :
```typescript
// AVANT :
import 'leaflet/dist/leaflet.css';

// APRÈS :
import '/leaflet/leaflet.css';
```

**Lignes 58-62** - URL du serveur de tuiles :
```typescript
// AVANT :
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors © CARTO'
}).addTo(map);

// APRÈS :
L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

**C'est tout !** Seulement **2 lignes modifiées** dans tout le projet.

---

## Workflow quotidien (après installation initiale)

### 🌅 Démarrage

```powershell
# 1. Ouvrir Docker Desktop (attendre qu'il soit prêt)

# 2. Terminal 1 : Démarrer Docker services
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud
docker-compose up -d postgres osm-tile-server

# 3. Terminal 2 : Démarrer frontend
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\frontend-web\roadAlert
npm run dev

# 4. Ouvrir navigateur : http://localhost:5173
```

**Durée** : ~30 secondes

### 🌙 Arrêt

```powershell
# Terminal frontend : Ctrl+C

# Terminal Docker :
docker-compose stop
```

---

## Support et documentation additionnelle

- **Documentation Leaflet** : https://leafletjs.com/reference.html
- **Documentation OSM Tile Server** : https://github.com/Overv/openstreetmap-tile-server
- **Documentation Docker Compose** : https://docs.docker.com/compose/

---

## Checklist de vérification complète

Utilise cette checklist pour vérifier que tout fonctionne :

- [ ] Docker Desktop installé et démarré
- [ ] `docker --version` fonctionne
- [ ] Fichier `region.osm.pbf` présent dans `backend/module-cartes/`
- [ ] Import OSM exécuté avec succès (étape 2)
- [ ] `docker ps` montre osm-tile-server et roadalert_db avec STATUS = Up
- [ ] `http://localhost:8080/tile/10/527/512.png` affiche une image PNG
- [ ] Frontend installé (`npm install` dans roadAlert/)
- [ ] Frontend démarré (`npm run dev`)
- [ ] `http://localhost:5173` accessible
- [ ] Page Home affiche la carte
- [ ] DevTools → Network montre requêtes `localhost:8080/tile/...` avec Status 200
- [ ] Tuiles visibles sur la carte (rues, bâtiments)
- [ ] Test hors-ligne réussi (Internet coupé, carte toujours affichée)

---

## Conclusion

**Ce système te permet de** :
✅ Afficher des cartes OpenStreetMap sans connexion Internet  
✅ Fonctionner entièrement en local (localhost)  
✅ Avoir des données cartographiques pour toute la région de Madagascar  
✅ Utiliser Leaflet avec un serveur de tuiles personnalisé

**Avantages** :
- 🚀 Performances : pas de latence réseau
- 🔒 Confidentialité : données en local
- 💾 Pas de quota : tuiles illimitées
- 🌍 Hors-ligne : fonctionne sans Internet

---

**Dernière mise à jour** : Janvier 2026  
**Version du guide** : 1.0
