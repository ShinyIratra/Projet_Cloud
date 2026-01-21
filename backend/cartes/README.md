# Module Cartes - Serveur de Tiles OSM

## ✅ État Final : FONCTIONNEL

### Infrastructure Opérationnelle
- ✅ Docker installé et fonctionnel
- ✅ Image `overv/openstreetmap-tile-server:latest` active
- ✅ Données OSM Madagascar (379MB) importées dans PostgreSQL
- ✅ Base de données : 4.1M nodes + 588K ways + 6.9K relations
- ✅ Serveur de tuiles actif sur `http://localhost:8080`
- ✅ Volume Docker : `osm-data2` (import complet réussi)
- ✅ Page de test Leaflet fonctionnelle

### 🚀 Démarrage Rapide

**Script automatique (RECOMMANDÉ)** :
```powershell
powershell -ExecutionPolicy Bypass -File start-test.ps1
```

**OU Manuel** :
```powershell
# 1. Démarrer Docker
docker start osm-tile-server-run

# 2. Lancer serveur HTTP
python -m http.server 3000

# 3. Ouvrir dans le navigateur
# http://localhost:3000/test-carte.html
```

### ⚠️ IMPORTANT : Problème CORS

**Ne PAS double-cliquer sur `test-carte.html`** → Carte blanche (requêtes bloquées)

**Raison** : Le protocole `file://` ne peut pas faire de requêtes vers `http://localhost:8080`

**Solution** : Toujours servir via HTTP local (voir commandes ci-dessus)

### Commandes Docker

```powershell
# Démarrer le serveur
docker start osm-tile-server-run

# Vérifier le statut
docker ps --filter "name=osm-tile-server-run"

# Voir les logs
docker logs osm-tile-server-run --tail 50

# Arrêter
docker stop osm-tile-server-run
```

### Test des Tuiles

```powershell
# Vérifier qu'une tuile est accessible
Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png"

# Télécharger et ouvrir une tuile
Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png" -OutFile "test.png"
Start-Process "test.png"
```

### Intégration Leaflet

```javascript
// Configuration Leaflet pour serveur local
const map = L.map('map').setView([-18.8792, 47.5079], 10);

L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors | Serveur local Docker',
    maxZoom: 18,
    timeout: 30000  // 30s pour génération à la demande
}).addTo(map);
```

**Coordonnées Antananarivo** : -18.8792, 47.5079

## 📚 Documentation Complète

| Fichier | Description |
|---------|-------------|
| **[SOLUTION-RAPIDE.md](./SOLUTION-RAPIDE.md)** | ⚡ Réponses concises aux problèmes |
| **[REPONSES-AUX-QUESTIONS.md](./REPONSES-AUX-QUESTIONS.md)** | 📋 Réponses détaillées et analyses |
| **[DIAGNOSTIC-PROBLEMES.md](./DIAGNOSTIC-PROBLEMES.md)** | 🔍 Diagnostic technique approfondi |
| **[DEMARRAGE-RAPIDE.md](./DEMARRAGE-RAPIDE.md)** | 🚀 Guide de démarrage étape par étape |
| **[DOCUMENTATION-MODULE-CARTE.md](./DOCUMENTATION-MODULE-CARTE.md)** | 📖 Documentation technique complète |
| **[docker-compose.yml](./docker-compose.yml)** | 🐳 Configuration Docker Compose |
| **[test-carte.html](./test-carte.html)** | 🗺️ Page de test Leaflet |

## 🎯 Résumé des Problèmes Résolus

### Problème 1 : Page "Wifly" sur localhost:8080
**Résolu** : C'est la page d'accueil normale du serveur (pas une erreur)  
**Action** : Ignorez-la, utilisez les tuiles via Leaflet

### Problème 2 : Carte blanche dans Leaflet
**Résolu** : Problème CORS avec protocole `file://`  
**Action** : Servir le HTML via HTTP local (`start-test.ps1` ou `python -m http.server`)

## ✅ Validation

- [x] Serveur Docker actif
- [x] Tuiles accessibles (HTTP 200)
- [x] Page de test fonctionnelle via HTTP
- [x] Navigation carte opérationnelle
- [x] Mode offline validé
- [x] Documentation complète réalisée

**Module Carte : TERMINÉ** ✅

