# Documentation Technique - Module Carte
**Projet RoadAlert - Suivi des Travaux Routiers Antananarivo**

---

## 📋 Périmètre du Module

Le module carte est responsable de :
- Installation d'un serveur de cartes OFFLINE via Docker
- Import des données OpenStreetMap de la ville d'Antananarivo
- Mise à disposition des tuiles cartographiques
- Test d'affichage via Leaflet

**Hors périmètre** : Logique métier, gestion des signalements, authentification, synchronisation Firebase.

---

## ✅ Étape 1 — Initialisation de l'Environnement Docker

### Travaux Réalisés

#### 1.1 Installation Docker
- **Docker Desktop** : Version installée et fonctionnelle sur Windows
- **Vérification** : 
  ```powershell
  docker --version
  docker ps
  ```

#### 1.2 Image du Serveur de Tuiles
- **Image utilisée** : `overv/openstreetmap-tile-server:latest`
- **Technologies incluses** :
  - PostgreSQL 15 + PostGIS 3.3
  - osm2pgsql 1.6.0
  - Apache + renderd
  - CartoCSS (styles OpenStreetMap)

#### 1.3 Structure du Module
```
backend/cartes/
├── region.osm.pbf                    # Données OSM Madagascar (379 MB)
├── test-carte.html                   # Page de test Leaflet
├── README.md                         # Documentation technique
└── DOCUMENTATION-MODULE-CARTE.md     # Documentation complète
```

#### 1.4 Configuration Docker

**Volume de données** :
```powershell
docker volume create osm-data2
```

**Commande d'import** :
```powershell
docker run --name osm-import2 `
  -e THREADS=1 `
  -v osm-data2:/data/database/ `
  -v D:/ITU_V2/Mr_Rojo/Projet_Cloud/backend/cartes:/data/region/ `
  overv/openstreetmap-tile-server:latest import
```

**Commande de lancement du serveur** :
```powershell
docker run -d `
  -p 8080:80 `
  --name osm-tile-server-run `
  -v osm-data2:/data/database/ `
  overv/openstreetmap-tile-server:latest run
```

### Preuves

#### Configuration Docker
- Volume : `osm-data2` (contient la base PostgreSQL)
- Port exposé : `8080` → `80` (serveur Apache)
- Mode : Daemon (arrière-plan)

#### Serveur en Fonctionnement
```powershell
docker ps --filter "name=osm-tile-server-run"
```
**Résultat** :
```
CONTAINER ID   IMAGE                                     STATUS        PORTS                    NAMES
a12873f2fff4   overv/openstreetmap-tile-server:latest   Up 5 minutes  0.0.0.0:8080->80/tcp    osm-tile-server-run
```

#### Vérification HTTP
```powershell
(Invoke-WebRequest -Uri 'http://localhost:8080/').StatusCode
# Résultat : 200 ✅
```

### Documentation du Rôle du Serveur

Le serveur **overv/openstreetmap-tile-server** :
1. **Stocke** les données OSM dans PostgreSQL/PostGIS
2. **Génère** les tuiles cartographiques à la demande
3. **Sert** les tuiles via Apache sur le port 8080
4. **Utilise** le style CartoCSS standard d'OpenStreetMap

**Format des tuiles** : `http://localhost:8080/tile/{z}/{x}/{y}.png`

### État d'Avancement

| Tâche | État |
|-------|------|
| Installation Docker | ✅ Complète |
| Téléchargement image | ✅ Complète |
| Configuration volumes | ✅ Complète |
| Lancement serveur | ✅ Complète |
| Vérification HTTP | ✅ Complète |

---

## ✅ Étape 2 — Téléchargement et Import des Données OSM Antananarivo

### Travaux Réalisés

#### 2.1 Téléchargement des Données
- **Source** : GeoFabrik - [Madagascar](https://download.geofabrik.de/africa/madagascar.html)
- **Fichier** : `region.osm.pbf` (379 MB)
- **Zone couverte** : Madagascar complet, incluant Antananarivo
- **Date de téléchargement** : 19 janvier 2026

#### 2.2 Import dans PostgreSQL

**Commande d'import** :
```powershell
docker run --name osm-import2 `
  -e THREADS=1 `
  -v osm-data2:/data/database/ `
  -v D:/ITU_V2/Mr_Rojo/Projet_Cloud/backend/cartes:/data/region/ `
  overv/openstreetmap-tile-server:latest import
```

**Résultats de l'import** :
```
Processed 4,099,480 nodes in 7s - 586k/s
Processed 587,856 ways in 16s - 37k/s
Processed 6,868 relations in 4s - 2k/s
Total time: 42s
```

#### 2.3 Structure de la Base de Données

**Tables créées** :
- `planet_osm_point` : Points d'intérêt (POI)
- `planet_osm_line` : Routes, rivières, etc.
- `planet_osm_polygon` : Bâtiments, zones
- `planet_osm_roads` : Routes principales (optimisé)

**Index géographiques** :
- Index géométriques sur toutes les tables
- Index OSM ID pour les requêtes rapides
- Clustering par géométrie pour performance

#### 2.4 Données Externes Importées

Le serveur a également téléchargé et importé :
- **Water polygons** : 911 MB (océans, lacs)
- **Simplified water polygons** : 24 MB
- **Antarctica icesheet** : 53 MB (polygones + contours)
- **Natural Earth boundaries** : 57 KB (frontières administratives)

### Preuves

#### Fichier OSM Local
```
Nom : region.osm.pbf
Taille : 379 MB (397,828,096 octets)
Localisation : D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\cartes\
```

#### Logs d'Import Complets
Voir les logs Docker pour :
- Création des tables PostgreSQL
- Import des nodes/ways/relations
- Création des index
- Import des données externes
- Marqueur de succès : `/data/database/planet-import-complete`

#### Configuration Mise à Jour
Le volume `osm-data2` contient :
- Base PostgreSQL complète
- Données OSM indexées
- Données externes (eau, frontières)
- Fichier `.poly` (périmètre géographique)

### État d'Avancement

| Tâche | État |
|-------|------|
| Téléchargement données OSM | ✅ Complète |
| Stockage local | ✅ Complète |
| Conversion en base PostgreSQL | ✅ Complète |
| Création des index | ✅ Complète |
| Import données externes | ✅ Complète |
| Configuration serveur | ✅ Complète |

### Données Utilisées

**Zone géographique** : Madagascar complet
**Ville ciblée** : Antananarivo
**Coordonnées centre** : -18.8792, 47.5079

**Niveaux de zoom disponibles** : 0 à 19
- Zoom 13 : Vue ville complète
- Zoom 15 : Vue quartier
- Zoom 18+ : Vue rue détaillée

### Limitations Identifiées

- **Périmètre large** : Données pour tout Madagascar (pas seulement Antananarivo)
  - **Avantage** : Flexibilité pour extension future
  - **Inconvénient** : Taille de la base de données (plusieurs GB)
- **Mise à jour** : Données figées à la date de téléchargement (19/01/2026)
  - Solution : Re-télécharger et ré-importer périodiquement

### Problèmes Rencontrés et Solutions

#### Problème 1 : Volume Corrompu
- **Symptôme** : Imports répétés échouaient avec exit code 1
- **Cause** : Volume `osm-data` contenait état partiel d'import précédent
- **Solution** : Création d'un nouveau volume propre `osm-data2`

#### Problème 2 : Utilisation Mémoire
- **Symptôme** : Risque de saturation mémoire avec multi-threading
- **Solution** : Configuration `THREADS=1` pour mode mono-thread

---

## ✅ Étape 3 — Test d'Affichage des Tuiles via Leaflet

### Travaux Réalisés

#### 3.1 Page HTML de Test
**Fichier** : `test-carte.html`
**Technologies** :
- Leaflet 1.9.4 (dernière version stable)
- JavaScript vanilla
- HTML5 + CSS3

#### 3.2 Intégration Leaflet

**Code d'initialisation** :
```javascript
// Initialisation de la carte centrée sur Antananarivo
const map = L.map('map').setView([-18.8792, 47.5079], 13);

// Couche de tiles depuis serveur local Docker
L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors | Serveur local Docker',
    maxZoom: 18
}).addTo(map);
```

#### 3.3 Configuration du Serveur Local

**URL des tuiles** : `http://localhost:8080/tile/{z}/{x}/{y}.png`
**Format** : PNG
**Projection** : Web Mercator (EPSG:3857)

#### 3.4 Tests Effectués

✅ **Test 1 : Chargement de la carte**
- Carte affichée correctement
- Centrage sur Antananarivo
- Zoom par défaut : 13

✅ **Test 2 : Navigation**
- Zoom in/out fonctionnel
- Déplacement (pan) fluide
- Tuiles chargées à la demande

✅ **Test 3 : Marqueurs**
- Marqueur centre ville : -18.8792, 47.5079
- Popup informatif
- Marqueur exemple signalement : -18.8650, 47.5200

✅ **Test 4 : Mode OFFLINE**
- Serveur local accessible sans Internet
- Tuiles servies depuis la base PostgreSQL locale
- Aucune dépendance externe après import

### Preuves

#### Code Source Complet
Voir fichier : [test-carte.html](./test-carte.html)

#### Captures d'Écran
**À générer** :
1. Carte centrée sur Antananarivo (zoom 13)
2. Vue détaillée d'une rue (zoom 18)
3. Marqueur de test avec popup
4. Console navigateur montrant chargement tuiles depuis localhost:8080

#### Validation HTTP
```powershell
# Test accès serveur
(Invoke-WebRequest -Uri 'http://localhost:8080/').StatusCode
# Résultat : 200 ✅

# Test tuile spécifique Antananarivo
(Invoke-WebRequest -Uri 'http://localhost:8080/tile/13/4736/4282.png').StatusCode
# Résultat : 200 ✅
```

#### Test Sans Connexion Internet
1. Lancer le conteneur Docker : `docker start osm-tile-server-run`
2. Lancer le serveur HTTP local : `python -m http.server 3000`
3. Désactiver la connexion Internet
4. Ouvrir `http://localhost:3000/test-carte.html` dans le navigateur
5. **Résultat** : Carte affichée correctement ✅

**⚠️ IMPORTANT - Problème CORS** :
- ❌ **Ne PAS ouvrir** `test-carte.html` en double-cliquant (protocole `file://`)
- ✅ **TOUJOURS utiliser** un serveur HTTP local (protocole `http://`)
- **Raison** : Les navigateurs bloquent les requêtes de `file://` vers `http://localhost:8080` (politique CORS)

**Solution rapide** :
```powershell
# Dans le dossier backend/cartes
python -m http.server 3000
# Puis ouvrir : http://localhost:3000/test-carte.html
```

**OU utiliser le script automatique** :
```powershell
.\start-test.ps1
# Lance Docker + serveur HTTP + navigateur automatiquement
```

### État d'Avancement

| Fonctionnalité | État |
|----------------|------|
| Page HTML créée | ✅ Opérationnelle |
| Leaflet intégré | ✅ Opérationnelle |
| Serveur local configuré | ✅ Opérationnelle |
| Affichage carte | ✅ Opérationnelle |
| Navigation (zoom/pan) | ✅ Opérationnelle |
| Marqueurs de test | ✅ Opérationnelle |
| Mode offline | ✅ Opérationnelle |

### Fonctionnalités Non Implémentées (Volontaire)

Les éléments suivants sont **hors périmètre** du module carte :

❌ **Signalements dynamiques**
- Affichage des signalements depuis base de données
- Filtres par statut/date
- Raison : Relève du Module Web

❌ **Authentification**
- Login/logout
- Gestion des profils utilisateurs
- Raison : Relève du Module Authentification

❌ **Synchronisation Firebase**
- Upload/download signalements
- Temps réel
- Raison : Relève du Module Mobile/Web

❌ **Tableau de bord**
- Statistiques (nb points, surface, budget)
- Raison : Relève du Module Web

### Points à Améliorer Ultérieurement

🔄 **Accès à la page de test**
- Servir automatiquement via nginx ou Apache
- Intégrer dans l'application principale
- Éviter le besoin de `python -m http.server`

🔄 **Performance**
- Mise en cache des tuiles (nginx)
- Pre-rendering des tuiles fréquentes
- CDN local pour production

🔄 **Données**
- Extraction Antananarivo uniquement (osmium-tool)
- Mise à jour automatique hebdomadaire
- Versioning des données

🔄 **Interface**
- Contrôles Leaflet personnalisés
- Légende de la carte
- Barre de recherche d'adresse

---

## 🔧 Instructions de Déploiement

### Sur une Nouvelle Machine

#### Prérequis
- Docker Desktop installé
- 10 GB d'espace disque disponible
- Windows/Linux/MacOS

#### Étapes

1. **Cloner le projet**
   ```bash
   git clone [URL_DU_REPO]
   cd Projet_Cloud/backend/cartes
   ```

2. **Créer le volume Docker**
   ```powershell
   docker volume create osm-data2
   ```

3. **Importer les données OSM**
   ```powershell
   docker run --name osm-import `
     -e THREADS=1 `
     -v osm-data2:/data/database/ `
     -v ${PWD}:/data/region/ `
     overv/openstreetmap-tile-server:latest import
   ```
   **Durée estimée** : 5-10 minutes (selon CPU)

4. **Lancer le serveur**
   ```powershell
   docker run -d `
     -p 8080:80 `
     --name osm-tile-server `
     -v osm-data2:/data/database/ `
     overv/openstreetmap-tile-server:latest run
   ```

5. **Vérifier le fonctionnement**
   ```powershell
   curl http://localhost:8080/
   ```
   Ouvrir : `http://localhost:8080/` dans un navigateur

6. **Tester avec Leaflet**
   - Ouvrir `test-carte.html` dans un navigateur
   - Vérifier l'affichage de la carte

### Commandes Utiles

#### Gestion du Serveur
```powershell
# Démarrer
docker start osm-tile-server-run

# Arrêter
docker stop osm-tile-server-run

# Logs
docker logs osm-tile-server-run

# Statut
docker ps --filter "name=osm-tile-server-run"
```

#### Debugging
```powershell
# Accéder au conteneur
docker exec -it osm-tile-server-run bash

# Vérifier PostgreSQL
docker exec osm-tile-server-run sudo -u postgres psql -d gis -c "\dt"

# Tester une tuile
curl -I http://localhost:8080/tile/13/4736/4282.png
```

---

## 📊 Intégration avec les Autres Modules

### Module Web

**Interface avec le Module Carte** :
```javascript
// Configuration Leaflet dans l'application web
const tileServerUrl = process.env.TILE_SERVER_URL || 'http://localhost:8080/tile/{z}/{x}/{y}.png';

L.tileLayer(tileServerUrl, {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);
```

**Fonctionnalités à ajouter** :
- Affichage des signalements sur la carte
- Interaction click sur points
- Légende avec codes couleur statut

### Module Mobile

**Configuration similaire** :
```typescript
// ionic-angular / vue
import L from 'leaflet';

const map = L.map('map-mobile').setView([-18.8792, 47.5079], 13);
L.tileLayer('http://[IP_SERVEUR]:8080/tile/{z}/{x}/{y}.png').addTo(map);
```

**Adaptation nécessaire** :
- Remplacer `localhost` par IP du serveur
- Mode online : fallback sur OpenStreetMap public
- Géolocalisation utilisateur via Capacitor

### Module Authentification

**Aucune interaction directe**
- Le module carte est agnostique de l'authentification
- Les restrictions d'accès sont gérées au niveau application

---

## 📝 Conclusion

### Résumé des Réalisations

✅ **Étape 1 - Environnement Docker** : COMPLÈTE
- Serveur de tuiles opérationnel
- Configuration robuste et documentée

✅ **Étape 2 - Données OSM** : COMPLÈTE
- Import de 4.1M nodes + 588K ways
- Base PostgreSQL optimisée

✅ **Étape 3 - Affichage Leaflet** : COMPLÈTE
- Page de test fonctionnelle
- Mode offline validé

### Livrables

📄 **Documentation**
- [x] Documentation technique complète
- [x] Instructions de déploiement
- [x] Intégration autres modules

💻 **Code**
- [x] `test-carte.html` - Page de test Leaflet
- [x] `README.md` - Guide rapide
- [x] Commandes Docker documentées

📦 **Infrastructure**
- [x] Volume Docker `osm-data2` avec données complètes
- [x] Conteneur `osm-tile-server-run` opérationnel
- [x] Fichier `region.osm.pbf` (379 MB)

### Points Non Réalisés (Hors Périmètre)

- ❌ Interface graphique d'administration
- ❌ Gestion des signalements
- ❌ Authentification utilisateurs
- ❌ Synchronisation Firebase
- ❌ Statistiques et tableaux de bord

Ces fonctionnalités relèvent des **Modules Web** et **Mobile**.

### Prochaines Étapes (Autres Équipes)

1. **Module Web** : Intégrer `test-carte.html` dans l'application React
2. **Module Mobile** : Adapter pour Ionic/Capacitor
3. **Module Auth** : Implémenter restrictions d'accès
4. **DevOps** : Déployer serveur carte en production

---

## 👥 Équipe Module Carte

**Responsable** : Jennifer
**Date de réalisation** : 19 janvier 2026
**Durée effective** :
- Étape 1 : 2h30
- Étape 2 : 1h00
- Étape 3 : 2h00
- **Total** : 5h30

---

## 📚 Ressources

- [Leaflet Documentation](https://leafletjs.com/)
- [OpenStreetMap Wiki](https://wiki.openstreetmap.org/)
- [overv/openstreetmap-tile-server](https://github.com/Overv/openstreetmap-tile-server)
- [GeoFabrik Downloads](https://download.geofabrik.de/)
- [osm2pgsql Documentation](https://osm2pgsql.org/)

---

**Fin de la documentation**
