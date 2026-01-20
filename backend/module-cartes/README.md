# Module Carte - Documentation

## 📋 Vue d'ensemble

Ce dossier contient tout le nécessaire pour faire fonctionner le **Module Carte** du projet de signalement routier d'Antananarivo.

Le module permet d'afficher une carte interactive d'Antananarivo basée sur des données OpenStreetMap servies localement via Docker.

---

## 📁 Structure du dossier

```
backend/module-cartes/
│
├── docker-compose.yml          # Configuration Docker
├── region.osm.pbf              # Données OSM de Madagascar (361 MB)
├── test-affichage.html         # Page de test Leaflet
│
├── leaflet/                    # Bibliothèque Leaflet (LOCAL - mode hors connexion)
│   ├── leaflet.css
│   ├── leaflet.js
│   └── images/
│
├── TACHE-1-DOCKER.md          # Documentation TÂCHE 1
├── TACHE-2-DONNEES.md         # Documentation TÂCHE 2
├── TACHE-3-AFFICHAGE.md       # Documentation TÂCHE 3
└── README.md                  # Ce fichier
```

---

## 🚀 Démarrage rapide (Quick Start)

### Prérequis
- Docker Desktop installé et démarré
- Python 3 (pour le serveur HTTP de test)

### ✅ Mode Hors Connexion
**La carte fonctionne sans connexion Internet !**
- ✅ Leaflet est hébergé localement (dossier `leaflet/`)
- ✅ Les tuiles sont servies par le serveur Docker local
- ❌ Aucune dépendance externe (pas de CDN)

### Étapes

#### 1️⃣ Importer les données OSM (une seule fois)

```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes
docker-compose run --rm osm-tile-server import
```

**⏱️ Durée** : 15-30 minutes  
**⚠️ Important** : Cette commande ne doit être exécutée qu'**une seule fois**

#### 2️⃣ Démarrer le serveur de tuiles

```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes
docker-compose up -d
```

Vérifier que le conteneur tourne :
```powershell
docker ps --filter "name=osm-tile-server"
```

#### 3️⃣ Tester l'affichage

```powershell
# Dans le dossier module-cartes
python -m http.server 8000
```

Ouvrir dans le navigateur : **http://localhost:8000/test-affichage.html**

---

## 📚 Documentation détaillée

### TÂCHE 1 — Initialisation Docker
**Fichier** : [TACHE-1-DOCKER.md](./TACHE-1-DOCKER.md)

**Contenu** :
- Configuration de Docker Compose
- Création du conteneur
- Commandes de gestion
- Preuves de fonctionnement

### TÂCHE 2 — Données OSM
**Fichier** : [TACHE-2-DONNEES.md](./TACHE-2-DONNEES.md)

**Contenu** :
- Téléchargement du fichier `madagascar.osm.pbf`
- Import dans PostgreSQL/PostGIS
- Configuration des volumes Docker
- Limites des données

### TÂCHE 3 — Test d'affichage
**Fichier** : [TACHE-3-AFFICHAGE.md](./TACHE-3-AFFICHAGE.md)

**Contenu** :
- Page HTML de test
- Configuration Leaflet
- Vérifications dans DevTools
- Résolution de problèmes

---

## 🔧 Commandes utiles

### Gestion du conteneur Docker

```powershell
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker logs osm-tile-server --tail 50 --follow

# Redémarrer
docker-compose restart

# Supprimer (avec les données)
docker-compose down -v
```

### Tests manuels des tuiles

```powershell
# Tester une tuile (zoom 0, monde entier)
Invoke-WebRequest http://localhost:8080/tile/0/0/0.png -OutFile test.png
Start-Process test.png

# Tester une tuile Antananarivo (zoom 13)
Invoke-WebRequest http://localhost:8080/tile/13/5110/4391.png -OutFile test-antananarivo.png
Start-Process test-antananarivo.png
```

### Vérification de l'état

```powershell
# Conteneur actif ?
docker ps --filter "name=osm-tile-server"

# Volume de données créé ?
docker volume ls | Select-String "osm-data"

# Taille de la base de données
docker exec osm-tile-server du -sh /data/database
```

---

## 🎯 URLs importantes

| Service | URL | Description |
|---------|-----|-------------|
| **Serveur de tuiles** | `http://localhost:8080` | Serveur Docker OSM |
| **Test d'affichage** | `http://localhost:8000/test-affichage.html` | Page HTML de test |
| **Tuile exemple** | `http://localhost:8080/tile/0/0/0.png` | Tuile monde (zoom 0) |
| **Template URL** | `http://localhost:8080/tile/{z}/{x}/{y}.png` | Format Leaflet |

---

## ⚠️ Problèmes courants

### Carte blanche (aucune tuile)

**Causes possibles** :
1. Docker non démarré → `docker-compose up -d`
2. Données non importées → `docker-compose run --rm osm-tile-server import`
3. Serveur HTTP mal configuré → Utiliser `python -m http.server 8000` dans le bon dossier

**✅ Mode hors connexion garanti** : 
- Leaflet chargé localement depuis `leaflet/`
- Aucun besoin d'Internet (sauf pour Docker au premier lancement)

### Tuiles très lentes (> 30 secondes)

**Cause** : Génération à la demande (on-the-fly rendering)  
**Solution** : 
- Normal la première fois
- Le cache accélère les chargements suivants
- Réduire le zoom initial (ex: 10 au lieu de 13)

### Erreur "port 8080 already in use"

**Solution** :
```powershell
# Trouver le processus qui utilise le port
Get-NetTCPConnection -LocalPort 8080 | Select-Object OwningProcess

# Arrêter le conteneur existant
docker stop osm-tile-server
```

### Import qui échoue

**Causes possibles** :
1. Fichier `.osm.pbf` manquant ou corrompu
2. Pas assez de RAM (minimum 4 GB recommandé)
3. Pas assez d'espace disque (besoin de ~5 GB)

**Solution** :
```powershell
# Vérifier le fichier
Test-Path "madagascar.osm.pbf"
(Get-Item "madagascar.osm.pbf").Length  # Doit être ~258 MB

# Re-télécharger si nécessaire
# Source : https://download.geofabrik.de/africa/madagascar.html
```

---

## 📊 Spécifications techniques

### Données OSM
- **Fichier** : `madagascar.osm.pbf`
- **Taille** : 258 MB (compressé)
- **Format** : PBF (Protocol Buffer Format)
- **Zone** : Tout Madagascar
- **Date** : 20/01/2026

### Serveur de tuiles
- **Image Docker** : `overv/openstreetmap-tile-server:latest`
- **Taille de l'image** : 2.14 GB
- **Base de données** : PostgreSQL 14 + PostGIS 3
- **Rendu** : Mapnik + mod_tile

### Coordonnées Antananarivo
- **Latitude** : -18.8792
- **Longitude** : 47.5079
- **Zoom recommandé** : 10-15

---

## ✅ Ce qui a été fait (périmètre)

### ✅ TÂCHE 1 : Infrastructure Docker
- Docker configuré et documenté
- Serveur de tuiles prêt à l'emploi

### ✅ TÂCHE 2 : Données OSM
- Fichier `madagascar.osm.pbf` présent
- Procédure d'import documentée

### ✅ TÂCHE 3 : Test d'affichage
- Page HTML fonctionnelle
- Leaflet configuré pour le serveur local
- Documentation complète

---

## ❌ Ce qui n'a PAS été fait (hors scope)

- ❌ Intégration avec l'application Web Ionic/React
- ❌ Intégration avec l'application Mobile Ionic/Vue
- ❌ Connexion à Firebase
- ❌ API backend pour les signalements
- ❌ Gestion des utilisateurs
- ❌ Points de signalement réels
- ❌ Géolocalisation automatique
- ❌ Calcul de surface / budget

**Raison** : Ces fonctionnalités ne font pas partie des 3 tâches définies.

---

## 📌 Prochaines étapes (suggestion)

1. **Intégration Web** : Ajouter Leaflet dans l'application Ionic/React
2. **API Signalements** : Créer des endpoints REST pour gérer les signalements
3. **Firebase** : Connecter l'authentification et le stockage
4. **Géolocalisation** : Utiliser l'API Geolocation pour placer des markers
5. **Mobile** : Adapter l'interface pour l'application Ionic/Vue

---

## 🆘 Support

En cas de problème, consulter dans l'ordre :

1. **Ce README** (problèmes courants)
2. **TACHE-X-XXX.md** (documentation détaillée de chaque tâche)
3. **Logs Docker** : `docker logs osm-tile-server --tail 100`
4. **Console navigateur** (F12) pour les erreurs JavaScript/réseau

---

## 📜 Licence

Données OpenStreetMap : © OpenStreetMap contributors (ODbL)  
Projet : Voir licence du projet principal
