# 📍 Instructions : Téléchargement des données OSM

## ⚠️ Fichier manquant volontairement

Le fichier `region.osm.pbf` (361 MB) n'est **PAS** inclus dans Git car il est trop volumineux.

---

## 📥 Comment obtenir le fichier

### Option 1 : Télécharger depuis Geofabrik (Recommandé)

```powershell
cd backend/module-cartes
Invoke-WebRequest -Uri "https://download.geofabrik.de/africa/madagascar-latest.osm.pbf" -OutFile "region.osm.pbf"
```

**Source** : https://download.geofabrik.de/africa/madagascar.html  
**Taille** : ~361 MB  
**Mise à jour** : Quotidienne

### Option 2 : Fichier plus léger (zone Antananarivo uniquement)

Si vous voulez seulement la région d'Antananarivo :

```powershell
# Utiliser osmosis pour extraire une zone spécifique
# (nécessite l'installation d'osmosis)
```

---

## 🚀 Après téléchargement

Une fois le fichier `region.osm.pbf` téléchargé :

```powershell
cd backend/module-cartes
docker-compose run --rm osm-tile-server import
```

**Durée** : 10-15 minutes  
**Résultat** : Base de données PostgreSQL/PostGIS peuplée

---

## ℹ️ Pourquoi ce fichier n'est pas dans Git ?

- Taille : 361 MB (trop volumineux pour Git)
- Mise à jour fréquente (quotidienne)
- Facile à re-télécharger
- Spécifique à chaque déploiement

---

## 📚 Plus d'informations

Consultez [README.md](./README.md) pour la documentation complète.
