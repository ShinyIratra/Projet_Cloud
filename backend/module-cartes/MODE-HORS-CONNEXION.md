# 🔌 Mode Hors Connexion - Documentation

## ✅ Statut

**La carte fonctionne SANS connexion Internet !**

---

## 📋 Ce qui a été fait

### 1️⃣ Identification du problème

**Problème initial** :
- La page `test-affichage.html` chargeait Leaflet depuis des CDN externes :
  - CSS : `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
  - JS : `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- **Résultat** : Sans Internet, Leaflet ne se chargeait pas → carte blanche

### 2️⃣ Solution implémentée

**Actions réalisées** :

1. **Téléchargement local de Leaflet 1.9.4** :
   ```
   backend/module-cartes/leaflet/
   ├── leaflet.css          (42 KB)
   ├── leaflet.js           (147 KB)
   └── images/
       ├── marker-icon.png
       ├── marker-icon-2x.png
       ├── marker-shadow.png
       ├── layers.png
       └── layers-2x.png
   ```

2. **Modification du fichier HTML** :
   - **Avant** :
     ```html
     <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
     <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
     ```
   
   - **Après** :
     ```html
     <link rel="stylesheet" href="leaflet/leaflet.css" />
     <script src="leaflet/leaflet.js"></script>
     ```

3. **Configuration des tuiles** :
   - URL déjà configurée pour utiliser le serveur local :
     ```javascript
     L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', { ... })
     ```
   - ✅ Aucune modification nécessaire (déjà en local)

---

## 🧪 Test de fonctionnement hors connexion

### Étape 1 : S'assurer que Docker tourne

```powershell
docker ps --filter "name=osm-tile-server"
```

**Résultat attendu** :
```
NAMES             STATUS         PORTS
osm-tile-server   Up X minutes   0.0.0.0:8080->80/tcp
```

### Étape 2 : Démarrer le serveur HTTP local

```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes
python -m http.server 8000
```

### Étape 3 : Tester AVEC Internet

1. Ouvrir : **http://localhost:8000/test-affichage.html**
2. Vérifier que la carte s'affiche correctement
3. ✅ La carte doit montrer Antananarivo avec les rues, bâtiments, etc.

### Étape 4 : Tester SANS Internet

1. **Couper la connexion Internet** (Wi-Fi/Ethernet)
2. Rafraîchir la page dans le navigateur (`Ctrl+F5`)
3. ✅ **La carte doit toujours fonctionner !**
4. Vérifier :
   - ✅ Zoom fonctionnel
   - ✅ Déplacement (drag) fonctionnel
   - ✅ Tuiles qui se chargent
   - ✅ Marqueur visible

### Étape 5 : Vérification dans DevTools

1. Ouvrir DevTools (`F12`)
2. Onglet **Network**
3. Filtrer par "localhost"
4. ✅ Toutes les requêtes doivent être vers `localhost` :
   - `http://localhost:8000/leaflet/leaflet.css` → 200 OK
   - `http://localhost:8000/leaflet/leaflet.js` → 200 OK
   - `http://localhost:8080/tile/13/5397/4083.png` → 200 OK
   - etc.

---

## 📊 Architecture du mode hors connexion

```
┌─────────────────────────────────────────────────────┐
│                   NAVIGATEUR                         │
│  (http://localhost:8000/test-affichage.html)        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ├─► Leaflet CSS/JS (LOCAL)
                  │   └─ leaflet/leaflet.css
                  │   └─ leaflet/leaflet.js
                  │   └─ leaflet/images/*.png
                  │
                  └─► Tuiles cartographiques (LOCAL)
                      └─ http://localhost:8080/tile/{z}/{x}/{y}.png
                          │
                          ▼
                    ┌─────────────────────┐
                    │ Docker Container     │
                    │ OSM Tile Server      │
                    │                      │
                    │ ┌─────────────────┐ │
                    │ │ PostgreSQL/     │ │
                    │ │ PostGIS         │ │
                    │ │ (region.osm.pbf)│ │
                    │ └─────────────────┘ │
                    │ ┌─────────────────┐ │
                    │ │ Mapnik Renderer │ │
                    │ └─────────────────┘ │
                    └─────────────────────┘
```

**Aucune connexion externe nécessaire !** ✅

---

## ✅ Ce qui fonctionne SANS Internet

1. ✅ **Chargement de Leaflet** (CSS + JS en local)
2. ✅ **Affichage de la carte** (tuiles depuis Docker local)
3. ✅ **Navigation** (zoom, déplacement)
4. ✅ **Marqueurs et popups** (tout en JavaScript local)
5. ✅ **Interactions utilisateur** (clic, drag, etc.)

---

## ❌ Ce qui NE fonctionne PAS hors connexion

### Limitations acceptables :

1. ❌ **Première installation** : Nécessite Internet pour :
   - Télécharger l'image Docker (2.14 GB) : `docker pull overv/openstreetmap-tile-server:latest`
   - Télécharger les données externes (océans, frontières) lors de l'import
   
2. ❌ **Mises à jour OSM** : Pour obtenir des données plus récentes

### Solutions :

- **Pour le point 1** : Télécharger et importer UNE SEULE FOIS avec Internet
- **Pour le point 2** : Re-télécharger `region.osm.pbf` périodiquement si nécessaire

---

## 🔍 Dépannage

### Problème : Carte blanche malgré les modifications

**Solutions** :
1. Vider le cache du navigateur : `Ctrl+Shift+Suppr`
2. Rafraîchissement forcé : `Ctrl+F5`
3. Vérifier que les fichiers Leaflet existent :
   ```powershell
   Test-Path "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes\leaflet\leaflet.js"
   ```

### Problème : Erreur 404 sur leaflet/leaflet.css

**Cause** : Serveur HTTP lancé dans le mauvais dossier

**Solution** :
```powershell
# S'assurer d'être dans le bon dossier
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes
Get-Location  # Vérifier
python -m http.server 8000
```

### Problème : Images des marqueurs ne s'affichent pas

**Cause** : Chemins des images mal configurés

**Vérification** :
```powershell
Get-ChildItem "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes\leaflet\images"
```

**Résultat attendu** :
```
marker-icon.png
marker-icon-2x.png
marker-shadow.png
layers.png
layers-2x.png
```

---

## 📌 Résumé des changements

| Élément | Avant | Après |
|---------|-------|-------|
| **Leaflet CSS** | CDN (unpkg.com) | Local (`leaflet/leaflet.css`) |
| **Leaflet JS** | CDN (unpkg.com) | Local (`leaflet/leaflet.js`) |
| **Images Leaflet** | CDN (unpkg.com) | Local (`leaflet/images/*.png`) |
| **Tuiles** | Local (déjà OK) | Local (inchangé) |
| **Fonctionnement hors connexion** | ❌ Non | ✅ **OUI** |

---

## ✅ Validation finale

**Liste de contrôle** :

- [x] Leaflet téléchargé localement
- [x] Fichier HTML modifié (références locales)
- [x] Structure de dossiers correcte
- [x] Test AVEC Internet : ✅ Fonctionne
- [x] Test SANS Internet : ✅ Fonctionne
- [x] Documentation mise à jour

**Statut** : ✅ **Mode hors connexion opérationnel**

---

## 🚀 Prochaines étapes (suggestions)

1. **Intégration dans l'application finale** :
   - Copier le dossier `leaflet/` dans le projet Web/Mobile
   - Adapter les chemins relatifs

2. **Optimisation** :
   - Minifier `leaflet.js` pour réduire la taille
   - Utiliser un Service Worker pour un vrai mode PWA

3. **Cache des tuiles** :
   - Pré-générer les tuiles les plus utilisées
   - Mettre en cache les tuiles dans le navigateur (IndexedDB)

---

## 📚 Références

- [Leaflet Documentation](https://leafletjs.com/)
- [OpenStreetMap Tile Server](https://github.com/Overv/openstreetmap-tile-server)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
