# 🔍 Diagnostic des Problèmes - Module Carte

**Date** : 19 janvier 2026  
**Contexte** : Serveur OSM Docker + Leaflet

---

## ❌ Problème 1 — Page "Wifly" sur http://localhost:8080/

### 🔎 Diagnostic

**Comportement observé** :  
En accédant à `http://localhost:8080/`, le navigateur affiche une page d'accueil "Wifly" au lieu d'une carte.

### ✅ Explication : C'EST NORMAL

La page "Wifly" est la **page d'accueil par défaut** du conteneur `overv/openstreetmap-tile-server`. Cette image Docker n'est **PAS** conçue pour afficher une interface de visualisation de carte dans le navigateur.

**Rôle du serveur** :
- ✅ **Serveur de tuiles** : Il génère et sert des images PNG (tuiles)
- ❌ **Interface de visualisation** : Il ne fournit PAS d'interface web pour voir la carte

### 📍 URLs correctes à utiliser

| Type | URL | Description |
|------|-----|-------------|
| ❌ Page d'accueil | `http://localhost:8080/` | Page Wifly (inutile) |
| ✅ **Tuiles** | `http://localhost:8080/tile/{z}/{x}/{y}.png` | Images PNG des tuiles |
| ✅ Exemple tuile | `http://localhost:8080/tile/0/0/0.png` | Tuile monde entier |
| ✅ Exemple Antananarivo | `http://localhost:8080/tile/13/4736/4282.png` | Tuile zoom 13 |

### 🎯 Utilisation correcte

Le serveur de tuiles **n'est PAS fait pour être consulté directement**. Il doit être utilisé via :
- **Leaflet** (bibliothèque JavaScript)
- **OpenLayers** (alternative)
- **Application mobile** avec Mapbox/Leaflet

**Exemple avec Leaflet** :
```javascript
L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
}).addTo(map);
```

### ✅ Vérification du serveur

```powershell
# Vérifier qu'une tuile est accessible
Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png"
# Résultat attendu : 200 OK, Content-Type: image/png

# Télécharger une tuile pour l'ouvrir
Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png" -OutFile "test.png"
Start-Process "test.png"
```

**Résultat de nos tests** :
- ✅ Tuile zoom 0 : **6710 octets** (image PNG valide)
- ⚠️ Tuile zoom 13 (Antananarivo) : **103 octets** (tuile vide - zoom 13 non pré-rendu)

---

## ❌ Problème 2 — Carte blanche dans Leaflet (test-carte.html)

### 🔎 Diagnostic

**Comportement observé** :
- Page ouverte via `file:///D:/ITU_V2/.../test-carte.html`
- Carte affichée = grand carré blanc (aucune tuile)
- Marqueurs visibles mais pas de fond cartographique
- Console navigateur : erreurs CORS

### 🚨 Cause Principale : **Protocole file:// + Politique CORS**

#### Explication technique

Lorsque vous ouvrez `test-carte.html` directement dans le navigateur (double-clic), l'URL est :
```
file:///D:/ITU_V2/Mr_Rojo/Projet_Cloud/backend/cartes/test-carte.html
```

**Problème** : Le navigateur applique la **politique Same-Origin Policy** :
- Origine du HTML : `file://` (système de fichiers local)
- Origine des tuiles : `http://localhost:8080` (serveur HTTP)
- ❌ **Origines différentes** → Requêtes bloquées par sécurité

**Erreur dans la console (F12)** :
```
Access to XMLHttpRequest at 'http://localhost:8080/tile/...' from origin 'null' has been blocked by CORS policy
```

### ⚠️ Cause Secondaire : **Tuiles non pré-rendues**

Le serveur `overv/openstreetmap-tile-server` génère les tuiles **à la demande** (on-the-fly).

**Problème** :
- Zoom 13 (vue ville) nécessite **256 tuiles** à générer
- Première requête : **génération lente** (plusieurs secondes par tuile)
- Si CORS bloque + timeout court → aucune tuile chargée

**Test effectué** :
```powershell
# Tuile zoom 0 (monde) : 6710 octets ✅ (pré-rendue)
# Tuile zoom 13 (Antananarivo) : 103 octets ⚠️ (non pré-rendue ou vide)
```

### ✅ Solutions

#### **Solution 1 : Servir le HTML via HTTP (RECOMMANDÉ)**

Ne PAS ouvrir `test-carte.html` directement (file://). Utiliser un serveur HTTP local :

##### Option A : Python HTTP Server
```powershell
# Depuis le dossier backend/cartes
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\cartes
python -m http.server 3000

# Ouvrir dans le navigateur :
http://localhost:3000/test-carte.html
```

##### Option B : VS Code Live Server
1. Installer l'extension **Live Server** dans VS Code
2. Clic droit sur `test-carte.html` → **Open with Live Server**
3. URL automatique : `http://127.0.0.1:5500/backend/cartes/test-carte.html`

##### Option C : Node.js http-server
```powershell
npm install -g http-server
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\cartes
http-server -p 3000

# Ouvrir : http://localhost:3000/test-carte.html
```

**Avantages** :
- ✅ Résout le problème CORS
- ✅ Même protocole (http://) pour HTML et tuiles
- ✅ Rechargement à chaud (Live Server)

---

#### **Solution 2 : Pré-rendre les tuiles**

Pour éviter la génération à la demande (lent), pré-générer les tuiles :

```bash
# Accéder au conteneur
docker exec -it osm-tile-server-run bash

# Pré-rendre les tuiles pour Antananarivo
render_list -a -z 0 -Z 18 -x 4700 -X 4800 -y 4250 -Y 4350

# Sortir
exit
```

**Note** : Cette commande prendra **plusieurs heures** pour les zooms 15-18.

**Alternative pragmatique** : Limiter à zoom 0-14
```bash
render_list -a -z 0 -Z 14 -x 4700 -X 4800 -y 4250 -Y 4350
```

---

#### **Solution 3 : Tester à zoom plus bas**

Modifier `test-carte.html` pour démarrer au zoom 10 (au lieu de 13) :

```javascript
// Avant
const map = L.map('map').setView([-18.8792, 47.5079], 13);

// Après
const map = L.map('map').setView([-18.8792, 47.5079], 10);
```

**Avantages** :
- Zoom 10 nécessite moins de tuiles (16 tuiles au lieu de 256)
- Plus rapide à générer
- Teste le fonctionnement avant de passer à zoom élevé

---

#### **Solution 4 : Augmenter le timeout Leaflet**

Ajouter une option de timeout pour laisser le temps au serveur de générer les tuiles :

```javascript
L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
    timeout: 30000  // 30 secondes au lieu de 5s par défaut
}).addTo(map);
```

---

### 🎯 Solution Complète Recommandée

**Étape 1** : Servir le HTML via HTTP
```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\cartes
python -m http.server 3000
```

**Étape 2** : Ouvrir dans le navigateur
```
http://localhost:3000/test-carte.html
```

**Étape 3** : Ouvrir la console (F12) et vérifier
- ✅ Aucune erreur CORS
- 🔄 Tuiles en cours de génération (code 200 mais lent)
- ⏳ Patienter 10-30 secondes pour la première génération

**Étape 4** : Rafraîchir la page (F5)
- ✅ Tuiles déjà en cache → chargement rapide

---

## 📊 Récapitulatif : Ce qui fonctionne vs. Ce qui ne fonctionne pas

### ✅ Ce qui fonctionne correctement

| Élément | État | Preuve |
|---------|------|--------|
| Serveur Docker lancé | ✅ | `docker ps` montre le conteneur actif |
| Port 8080 exposé | ✅ | `netstat -an` montre l'écoute |
| Apache + renderd actifs | ✅ | Logs Docker montrent démarrage OK |
| PostgreSQL + données OSM | ✅ | Import complété, 4.1M nodes |
| Endpoint `/tile/{z}/{x}/{y}.png` | ✅ | Répond HTTP 200 |
| Génération tuile zoom 0 | ✅ | Image PNG 6710 octets |
| Code Leaflet | ✅ | Syntaxe correcte, URL valide |

### ❌ Ce qui ne fonctionne PAS (et pourquoi)

| Problème | Cause | Impact | Solution |
|----------|-------|--------|----------|
| Carte blanche | file:// + CORS | Tuiles bloquées | Servir via HTTP |
| Tuiles zoom 13 vides | Non pré-rendues | Génération lente | Pré-rendre ou patienter |
| Page Wifly inutile | Conception image Docker | Aucun (normal) | Ignorer, utiliser Leaflet |

### 🔧 Ce qui doit être corrigé

1. **Méthode d'accès au HTML** : file:// → http://localhost:3000/
2. **Zoom par défaut** : 13 → 10 (temporairement)
3. **Timeout Leaflet** : 5s → 30s
4. **(Optionnel)** Pré-rendre les tuiles pour zooms 0-14

---

## 🚀 Instructions Complètes pour Tester

### Test 1 : Vérifier le serveur de tuiles

```powershell
# 1. Vérifier que le conteneur tourne
docker ps --filter "name=osm-tile-server-run"

# 2. Télécharger une tuile test
Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png" -OutFile "tuile-test.png"

# 3. Ouvrir l'image
Start-Process "tuile-test.png"

# Résultat attendu : Image PNG montrant le monde entier
```

### Test 2 : Tester avec serveur HTTP local

```powershell
# 1. Lancer serveur HTTP
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\cartes
python -m http.server 3000
# Laisser ce terminal ouvert

# 2. Dans un AUTRE terminal ou navigateur, ouvrir :
Start-Process "http://localhost:3000/test-carte.html"

# 3. Ouvrir la console navigateur (F12)
# 4. Attendre 10-30 secondes
# 5. Rafraîchir (F5) si nécessaire
```

### Test 3 : Vérifier les tuiles dans la console

Ouvrir la console navigateur (F12) et taper :
```javascript
// Voir les requêtes de tuiles
fetch('http://localhost:8080/tile/10/578/535.png')
    .then(r => console.log('Statut:', r.status, 'Taille:', r.headers.get('content-length')))
    .catch(e => console.error('Erreur:', e))
```

**Résultat attendu** :
```
Statut: 200 Taille: [plusieurs KB]
```

**Si erreur CORS** :
```
Erreur: TypeError: Failed to fetch
```
→ Vous utilisez encore file:// au lieu de http://

---

## 📝 Conclusion

### Problème 1 : Page Wifly
**Statut** : ✅ **NORMAL - Pas un problème**  
**Action** : Aucune - Ignorer cette page et utiliser les tuiles via Leaflet

### Problème 2 : Carte blanche
**Statut** : ❌ **Problème CORS + Tuiles non pré-rendues**  
**Action** : **Servir le HTML via HTTP** (python -m http.server)

### Ce qui est correctement fait

✅ **Infrastructure Docker** : Serveur OSM opérationnel  
✅ **Données OSM** : Import Madagascar complet réussi  
✅ **Code Leaflet** : Syntaxe correcte, URL appropriée  
✅ **Documentation** : Guide complet créé

### Ce qui n'est pas encore fait

❌ **Méthode d'accès** : HTML ouvert en file:// au lieu de http://  
❌ **Pré-rendu tuiles** : Génération à la demande (lent)  
❌ **Configuration production** : Nginx cache, tuiles pré-générées

---

## 🎯 Checklist de Validation

Avant de considérer le module terminé, vérifier :

- [ ] Conteneur Docker actif : `docker ps`
- [ ] Tuile zoom 0 accessible : `curl -I http://localhost:8080/tile/0/0/0.png`
- [ ] Serveur HTTP local lancé : `python -m http.server 3000`
- [ ] Page accessible via HTTP : `http://localhost:3000/test-carte.html`
- [ ] Console sans erreur CORS (F12)
- [ ] Carte affichée (même partiellement)
- [ ] Marqueurs visibles
- [ ] Navigation fonctionnelle (zoom, pan)

**Si tous ces points sont ✅, le module est fonctionnel !**

---

## 📚 Ressources Complémentaires

- [CORS Explained](https://developer.mozilla.org/fr/docs/Web/HTTP/CORS)
- [Leaflet Documentation](https://leafletjs.com/)
- [OSM Tile Server GitHub](https://github.com/Overv/openstreetmap-tile-server)
- [Tile Rendering Queue](https://wiki.openstreetmap.org/wiki/Renderd)

