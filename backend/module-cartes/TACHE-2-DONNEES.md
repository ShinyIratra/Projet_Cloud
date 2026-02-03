# TÂCHE 2 — Télécharger et importer les données OSM d'Antananarivo

## ✅ Ce qui a été fait

### 1. Téléchargement des données OpenStreetMap

**Fichier** : `madagascar.osm.pbf`  
**Source** : Geofabrik (https://download.geofabrik.de/africa/madagascar.html)  
**Taille** : 258 MB (258 846 230 octets)  
**Date** : 20/01/2026 04:09:18  
**Format** : PBF (Protocol Buffer Format) - format binaire compressé d'OSM

**Emplacement** : `backend/module-cartes/madagascar.osm.pbf`

### 2. Stockage local

Le fichier est placé dans le dossier `backend/module-cartes/` pour être :
- Accessible par le volume Docker monté sur `/data/region/`
- Versionnable (si nécessaire via Git LFS)
- Facilement remplaçable pour mise à jour

### 3. Import des données dans le serveur de tuiles

#### Commande d'import
```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes

# Import du fichier .osm.pbf dans la base PostgreSQL
docker-compose run --rm osm-tile-server import
```

**Processus d'import** :
1. Le conteneur lit `/data/region/madagascar.osm.pbf`
2. `osm2pgsql` parse les données et les insère dans PostgreSQL/PostGIS
3. Les index sont créés pour optimiser les requêtes
4. Les tuiles peuvent ensuite être générées à la demande

**⏱️ Durée estimée** : 15-30 minutes (selon la machine)

**⚠️ Attention** :
- Consommation RAM : ~2-4 GB pendant l'import
- Espace disque nécessaire : ~3-5 GB pour la base de données

### 4. Configuration reliant le serveur aux données

**Dans docker-compose.yml** :
```yaml
volumes:
  - ./:/data/region/
```

Cette ligne monte le dossier courant (`backend/module-cartes/`) dans le conteneur au chemin `/data/region/`.

**Résultat** :
- Le fichier `madagascar.osm.pbf` est accessible dans le conteneur
- Le script d'import détecte automatiquement les fichiers `.osm.pbf` présents
- La base de données est stockée dans le volume Docker `osm-data` (persistant)

### 5. Vérification de l'import

**Après l'import, vérifier** :

```powershell
# Lancer le serveur
docker-compose up -d

# Vérifier les logs
docker logs osm-tile-server --tail 50

# Tester une tuile
Invoke-WebRequest http://localhost:8080/tile/0/0/0.png -OutFile test.png
Start-Process test.png
```

**Résultat attendu** :
- Une image PNG de 256×256 pixels
- Affichant une carte du monde (zoom 0) avec Madagascar visible

---

## 📊 Limites des données

### 1. Zone géographique
- **Couverture** : Tout Madagascar (pas seulement Antananarivo)
- **Raison** : Le fichier Geofabrik pour Madagascar inclut tout le pays
- **Impact** : Les tuiles peuvent être générées pour tout Madagascar

### 2. Niveau de zoom disponible
- **Min zoom** : 0 (monde entier)
- **Max zoom** : 18-19 (selon les zones, limité par les données OSM)
- **Recommandation** : Zooms 10-15 pour Antananarivo (bon compromis vitesse/détail)

### 3. Format des données
- **Format** : PBF (binaire)
- **Lisibilité** : Non lisible directement (nécessite osm2pgsql ou osmium)
- **Avantage** : ~10× plus compact que le XML OSM

### 4. Fraîcheur des données
- **Date d'extraction** : 20/01/2026
- **Mise à jour** : Nécessite re-téléchargement depuis Geofabrik
- **Fréquence Geofabrik** : Quotidienne pour Madagascar

---

## ❌ Ce qui n'a PAS été fait (volontairement)

### 1. Aucun affichage côté application Web
Pas d'intégration dans l'application Web Ionic/React.

### 2. Aucun test Leaflet à ce stade
Le test d'affichage est traité dans la **TÂCHE 3**.

### 3. Pas de filtre Antananarivo uniquement
Le fichier contient tout Madagascar. Pour extraire uniquement Antananarivo :
```powershell
# Commande osmium (si nécessaire plus tard)
osmium extract -b 47.4,−18.95,47.6,−18.8 madagascar.osm.pbf -o antananarivo.osm.pbf
```
**Pourquoi non fait** : Non demandé, et Madagascar complet reste gérable (258 MB).

### 4. Pas de pré-génération des tuiles
Les tuiles sont générées à la demande (on-the-fly) lors du premier accès.

**Avantage** : Pas d'attente de pré-calcul  
**Inconvénient** : Première charge lente (5-30 secondes par tuile)

---

## 📝 Pourquoi madagascar.osm.pbf et pas antananarivo.osm.pbf ?

### 1. Disponibilité
Geofabrik ne propose pas de découpe "Antananarivo uniquement", seulement "Madagascar".

### 2. Flexibilité
Avoir tout Madagascar permet de :
- Tester d'autres villes si besoin
- Afficher le contexte géographique autour d'Antananarivo
- Éviter les "trous" sur la carte aux limites de la zone

### 3. Performance acceptable
Même avec tout Madagascar, le serveur de tuiles ne génère que les tuiles demandées par l'utilisateur.

---

## 🔍 Validation de la TÂCHE 2

### Checklist
- [x] Fichier `madagascar.osm.pbf` présent (258 MB)
- [x] Emplacement : `backend/module-cartes/`
- [x] Volume Docker configuré correctement
- [x] Commande d'import documentée
- [ ] Import exécuté (à faire maintenant)

### Commandes de validation

```powershell
# 1. Vérifier la présence du fichier
Test-Path "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes\madagascar.osm.pbf"

# 2. Vérifier la taille
(Get-Item "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes\madagascar.osm.pbf").Length

# 3. Lancer l'import
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes
docker-compose run --rm osm-tile-server import

# 4. Démarrer le serveur
docker-compose up -d
```

---

## 📌 Prochaine étape

→ **TÂCHE 3** : Test d'affichage des tiles depuis le serveur local
