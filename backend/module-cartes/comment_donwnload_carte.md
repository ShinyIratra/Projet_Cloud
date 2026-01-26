# 📥 Guide d'installation du Module Carte (Windows)

## ⚠️ Prérequis obligatoires

Avant de commencer, assurez-vous d'avoir :

✅ **Docker Desktop** installé et démarré  
- Téléchargement : https://www.docker.com/products/docker-desktop/  
- **IMPORTANT** : Docker Desktop doit être ouvert et en cours d'exécution (icône dans la barre des tâches)

✅ **Python 3** installé  
- Vérifier : Ouvrir PowerShell et taper `python --version`  
- Si non installé : https://www.python.org/downloads/

✅ **Au moins 5 GB d'espace disque libre**

✅ **Au moins 4 GB de RAM disponible**

---

## 📋 Vue d'ensemble des étapes

1. Télécharger le fichier de données OSM (Madagascar)
2. Placer et renommer le fichier dans le bon dossier
3. Importer les données dans Docker (une seule fois)
4. Démarrer le serveur de tuiles cartographiques
5. Tester l'affichage de la carte

**Durée totale estimée** : 30-45 minutes (dont 10-30 minutes pour l'import automatique)

---

## ÉTAPE 1 : Télécharger le fichier de données Madagascar 🌍

### Option A : Télécharger depuis Geofabrik (RECOMMANDÉ)

1. **Ouvrez votre navigateur web**

2. **Allez sur le site Geofabrik** :
   ```
   https://download.geofabrik.de/africa/madagascar.html
   ```

3. **Cliquez sur le lien de téléchargement** :
   - Cherchez la ligne : **"madagascar-latest.osm.pbf"**
   - Cliquez sur le lien pour télécharger
   - Taille : environ 361 MB

4. **Attendez la fin du téléchargement**
   - Le fichier sera téléchargé dans votre dossier **Téléchargements**
   - Nom du fichier : `madagascar-latest.osm.pbf`

### Option B : Télécharger via PowerShell (alternative)

1. **Ouvrez PowerShell** (clic droit sur le bouton Démarrer → Windows PowerShell)

2. **Exécutez cette commande** :
   ```powershell
   Invoke-WebRequest -Uri "https://download.geofabrik.de/africa/madagascar-latest.osm.pbf" -OutFile "$env:USERPROFILE\Downloads\madagascar-latest.osm.pbf"
   ```

3. **Attendez la fin du téléchargement** (cela peut prendre 5-10 minutes selon votre connexion)

---

## ÉTAPE 2 : Placer et renommer le fichier 📁

### 2.1 Localiser le dossier du projet

1. **Ouvrez l'Explorateur de fichiers Windows** (touche Windows + E)

2. **Naviguez vers le dossier du projet** :
   - Exemple de chemin : `D:\ITU_V2\Mr_Rojo\Projet_Cloud\`
   - **IMPORTANT** : Adaptez ce chemin selon l'emplacement où vous avez cloné le projet

3. **Ouvrez le sous-dossier** :
   ```
   backend\module-cartes\
   ```

4. **Vérifiez que vous êtes au bon endroit** :
   - Vous devez voir les fichiers suivants :
     - `docker-compose.yml`
     - `test-affichage.html`
     - `README.md`
     - etc.

### 2.2 Copier et renommer le fichier

**Méthode 1 : Interface graphique (plus simple)**

1. **Allez dans votre dossier Téléchargements**
   - Appuyez sur `Windows + R`
   - Tapez : `shell:downloads`
   - Appuyez sur Entrée

2. **Localisez le fichier** `madagascar-latest.osm.pbf`

3. **Copiez le fichier**
   - Clic droit sur le fichier → **Copier**

4. **Allez dans le dossier `backend\module-cartes\`** de votre projet

5. **Collez le fichier**
   - Clic droit dans le dossier → **Coller**

6. **Renommez le fichier**
   - Clic droit sur `madagascar-latest.osm.pbf`
   - Cliquez sur **Renommer**
   - Nouveau nom : `region.osm.pbf`
   - Appuyez sur Entrée

**Méthode 2 : PowerShell (alternative)**

1. **Ouvrez PowerShell**

2. **Exécutez ces commandes** (adaptez le chemin du projet) :
   ```powershell
   # Aller dans le dossier module-cartes
   cd "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes"

   # Copier et renommer le fichier
   Copy-Item "$env:USERPROFILE\Downloads\madagascar-latest.osm.pbf" -Destination "region.osm.pbf"

   # Vérifier que le fichier est bien présent
   Get-Item "region.osm.pbf"
   ```

3. **Vous devez voir** :
   ```
   Nom: region.osm.pbf
   Taille: environ 361 MB
   ```

---

## ÉTAPE 3 : Vérifier l'intégrité du fichier (OPTIONNEL mais recommandé) ✅

Cette étape permet de vérifier que le fichier téléchargé n'est pas corrompu.

1. **Ouvrez PowerShell**

2. **Allez dans le dossier module-cartes** :
   ```powershell
   cd "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes"
   ```

3. **Calculez le hash SHA256** :
   ```powershell
   Get-FileHash "region.osm.pbf" -Algorithm SHA256
   ```

4. **Comparez le résultat** avec la valeur fournie par votre collègue ou le professeur
   - Si les valeurs correspondent → ✅ Fichier OK
   - Si les valeurs diffèrent → ⚠️ Retéléchargez le fichier

---

## ÉTAPE 4 : Importer les données dans Docker 🐳

**⚠️ IMPORTANT** : Cette étape ne doit être faite **QU'UNE SEULE FOIS**. Ne la répétez pas sauf si vous supprimez les données Docker.

### 4.1 Vérifier que Docker Desktop est démarré

1. **Regardez dans la barre des tâches** (en bas à droite)
   - Vous devez voir l'icône Docker (une baleine)
   - Si l'icône n'est pas là : ouvrez **Docker Desktop** depuis le menu Démarrer

2. **Attendez que Docker soit prêt**
   - L'icône Docker doit être stable (pas en rotation)
   - Statut : "Docker Desktop is running"

### 4.2 Lancer l'import

1. **Ouvrez PowerShell**

2. **Allez dans le dossier module-cartes** :
   ```powershell
   cd "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes"
   ```

3. **Vérifiez que vous êtes au bon endroit** :
   ```powershell
   Get-Location
   ```
   - Vous devez voir : `...\backend\module-cartes`

4. **Lancez la commande d'import** :
   ```powershell
   docker-compose run --rm osm-tile-server import
   ```

### 4.3 Patienter pendant l'import

**⏱️ DURÉE : 10 à 30 minutes** (selon la puissance de votre ordinateur)

**Ce que vous allez voir** :

1. **Téléchargement de l'image Docker** (si première fois) :
   ```
   Pulling osm-tile-server...
   [=====>                    ] 35%
   ```
   - Taille : environ 2.14 GB
   - Durée : 5-15 minutes selon votre connexion

2. **Initialisation de la base de données PostgreSQL** :
   ```
   Starting PostgreSQL 15 database server
   CREATE EXTENSION postgis;
   CREATE EXTENSION hstore;
   ```

3. **Import des données OSM** :
   ```
   osm2pgsql version 1.6.0
   Processing: Node(77M) Way(7M) Relation(10k)
   ```
   - Vous verrez des compteurs qui augmentent
   - **C'EST NORMAL** : ne fermez pas la fenêtre !

4. **Création des index** :
   ```
   Creating geometry index...
   Building index on table 'planet_osm_ways'
   ```

5. **Téléchargement des données externes** :
   ```
   Fetching https://osmdata.openstreetmap.de/download/water-polygons...
   Import complete
   ```

6. **Message final** :
   ```
   osm2pgsql took 680s (11m 20s) overall.
   exit 0
   ```

**✅ L'import est terminé quand vous voyez** :
- Le message "exit 0" ou "Command exited with code 0"
- Le curseur PowerShell réapparaît (vous pouvez taper une nouvelle commande)

### 4.4 En cas d'erreur

**Erreur : "PBF error: unexpected EOF"**
- **Cause** : Fichier corrompu
- **Solution** : Retéléchargez `madagascar-latest.osm.pbf` et recommencez

**Erreur : "Cannot connect to Docker daemon"**
- **Cause** : Docker Desktop n'est pas démarré
- **Solution** : Ouvrez Docker Desktop et attendez qu'il soit prêt

**Erreur : "Out of memory"**
- **Cause** : Pas assez de RAM
- **Solution** : Fermez les autres applications et réessayez

---

## ÉTAPE 5 : Démarrer le serveur de tuiles 🚀

Une fois l'import terminé, vous devez démarrer le serveur de tuiles cartographiques.

1. **Dans PowerShell, tapez** (depuis le dossier `module-cartes`) :
   ```powershell
   docker-compose up -d
   ```

2. **Attendez quelques secondes** (le serveur démarre)

3. **Vérifiez que le conteneur tourne** :
   ```powershell
   docker ps --filter "name=osm-tile-server"
   ```

4. **Vous devez voir** :
   ```
   NAMES             STATUS         PORTS
   osm-tile-server   Up X seconds   0.0.0.0:8080->80/tcp
   ```

**✅ Le serveur est prêt** quand :
- La colonne STATUS indique "Up X seconds" ou "Up X minutes"
- Le port 8080 est mappé (0.0.0.0:8080->80/tcp)

---

## ÉTAPE 6 : Tester l'affichage de la carte 🗺️

Maintenant que le serveur est démarré, vous pouvez tester la carte.

### 6.1 Démarrer le serveur HTTP

1. **Dans PowerShell** (depuis le dossier `module-cartes`) :
   ```powershell
   python -m http.server 8000
   ```

2. **Vous devez voir** :
   ```
   Serving HTTP on :: port 8000 (http://[::]:8000/) ...
   ```

3. **Laissez cette fenêtre PowerShell ouverte** (ne la fermez pas)

### 6.2 Ouvrir la page de test

1. **Ouvrez votre navigateur web** (Chrome, Firefox, Edge, etc.)

2. **Allez sur cette URL** :
   ```
   http://localhost:8000/test-affichage.html
   ```

3. **Vous devez voir** :
   - Une carte interactive d'Antananarivo
   - Les rues, bâtiments, et routes visibles
   - Un marqueur au centre de la ville
   - Des contrôles de zoom (+/-)

### 6.3 Tester les fonctionnalités

**Testez les interactions** :
- ✅ **Zoom** : cliquez sur les boutons + et - (ou molette de la souris)
- ✅ **Déplacement** : cliquez et glissez la carte
- ✅ **Marqueur** : cliquez sur le marqueur pour voir la popup

**Vérifiez les tuiles** :
1. Appuyez sur **F12** pour ouvrir les DevTools
2. Allez dans l'onglet **Network** (Réseau)
3. Rechargez la page (**Ctrl + R**)
4. Vous devez voir des requêtes vers :
   ```
   http://localhost:8080/tile/13/5397/4083.png → 200 OK
   ```

**⚠️ Note** : La première génération de tuiles peut prendre 10-30 secondes. Les tuiles suivantes seront beaucoup plus rapides (elles sont mises en cache).

---

## 🎉 Félicitations ! Le module-cartes fonctionne !

### Résumé de ce qui a été installé

✅ **Serveur de tuiles OSM** (Docker) : http://localhost:8080  
✅ **Base de données PostgreSQL + PostGIS** avec 77M nœuds, 7M routes  
✅ **Page de test Leaflet** : http://localhost:8000/test-affichage.html  
✅ **Mode hors connexion** : Leaflet hébergé localement

---

## 📋 Commandes de gestion quotidienne

### Démarrer le serveur (chaque jour)

```powershell
cd "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes"
docker-compose up -d
python -m http.server 8000
```

Puis ouvrez : http://localhost:8000/test-affichage.html

### Arrêter le serveur

```powershell
# Arrêter le serveur HTTP : Ctrl + C dans PowerShell

# Arrêter Docker
cd "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes"
docker-compose down
```

### Voir les logs (en cas de problème)

```powershell
docker logs osm-tile-server --tail 50 --follow
```

Pour arrêter les logs : **Ctrl + C**

### Redémarrer le serveur Docker

```powershell
cd "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes"
docker-compose restart
```

---

## ⚠️ Problèmes courants et solutions

### Problème : Carte blanche (aucune tuile ne s'affiche)

**Solutions possibles** :

1. **Vérifiez que Docker tourne** :
   ```powershell
   docker ps --filter "name=osm-tile-server"
   ```
   Si vide → lancez `docker-compose up -d`

2. **Vérifiez que vous servez la page via HTTP** :
   - ✅ Correct : `http://localhost:8000/test-affichage.html`
   - ❌ Incorrect : `file:///C:/Users/.../test-affichage.html`

3. **Videz le cache du navigateur** :
   - Appuyez sur **Ctrl + Shift + Suppr**
   - Cochez "Images et fichiers en cache"
   - Cliquez sur "Effacer les données"

### Problème : Les tuiles sont très lentes

**Causes** :
- Première génération à la demande (normal)
- Ordinateur avec peu de RAM

**Solutions** :
- Attendez 30-60 secondes pour la première tuile
- Les tuiles suivantes seront plus rapides (cache)
- Réduisez le zoom initial (changez `13` en `10` dans test-affichage.html)

### Problème : Port 8080 déjà utilisé

**Solution** :
```powershell
# Trouver le processus qui utilise le port
Get-NetTCPConnection -LocalPort 8080 | Select-Object OwningProcess

# Arrêter le conteneur existant
docker stop osm-tile-server
```

### Problème : Import qui échoue

**Solutions** :

1. **Vérifiez l'espace disque** :
   ```powershell
   Get-PSDrive C
   ```
   Besoin : au moins 5 GB libres

2. **Vérifiez le fichier region.osm.pbf** :
   ```powershell
   Get-Item "region.osm.pbf"
   ```
   Taille attendue : environ 361 MB

3. **Nettoyez et réessayez** :
   ```powershell
   docker-compose down -v
   docker-compose run --rm osm-tile-server import
   ```

### Problème : La carte ne fonctionne pas hors connexion

**Solution** :
- Vérifiez que Leaflet est bien dans le dossier `leaflet/`
- Vérifiez que `test-affichage.html` charge les fichiers locaux (pas les CDN)
- Rafraîchissez la page avec **Ctrl + F5**

---

## 📞 Besoin d'aide ?

Si vous rencontrez un problème non résolu :

1. **Vérifiez les logs Docker** :
   ```powershell
   docker logs osm-tile-server --tail 100
   ```

2. **Vérifiez la console du navigateur** :
   - Appuyez sur **F12**
   - Allez dans l'onglet **Console**
   - Cherchez les erreurs en rouge

3. **Contactez votre équipe** avec :
   - Le message d'erreur exact
   - Les logs Docker (copiez-collez)
   - Votre système (Windows 10/11, RAM, espace disque)

---

## 📚 Documentation complète

Pour plus de détails, consultez :

- [README.md](./README.md) - Vue d'ensemble du module
- [MODE-HORS-CONNEXION.md](./MODE-HORS-CONNEXION.md) - Fonctionnement offline
- [TACHE-1-DOCKER.md](./TACHE-1-DOCKER.md) - Infrastructure Docker
- [TACHE-2-DONNEES.md](./TACHE-2-DONNEES.md) - Import OSM
- [TACHE-3-AFFICHAGE.md](./TACHE-3-AFFICHAGE.md) - Test Leaflet

---

## ✅ Checklist finale

Avant de dire "ça marche", vérifiez :

- [ ] Docker Desktop est démarré
- [ ] Le fichier `region.osm.pbf` (361 MB) est dans `backend/module-cartes/`
- [ ] La commande `docker-compose run --rm osm-tile-server import` s'est terminée avec succès (exit 0)
- [ ] La commande `docker-compose up -d` affiche "Up X seconds"
- [ ] La commande `docker ps --filter "name=osm-tile-server"` affiche le conteneur
- [ ] La commande `python -m http.server 8000` est en cours d'exécution
- [ ] L'URL `http://localhost:8000/test-affichage.html` affiche la carte
- [ ] Vous pouvez zoomer et déplacer la carte
- [ ] Les tuiles se chargent (vérifiez F12 → Network)

**Si tous les points sont cochés** : ✅ Le module-cartes fonctionne correctement !

---

**Date de création** : 20 janvier 2026  
**Version** : 1.0  
**Auteur** : Module Carte - Projet Cloud
