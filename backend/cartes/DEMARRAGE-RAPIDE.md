# 🚀 Démarrage Rapide - Module Carte

## Étape 1 : Démarrer le serveur de tuiles Docker

```powershell
docker start osm-tile-server-run
```

**Vérification** :
```powershell
docker ps --filter "name=osm-tile-server-run"
# Doit afficher : Up X seconds/minutes
```

---

## Étape 2 : Lancer le serveur HTTP local

**⚠️ IMPORTANT** : Ne PAS ouvrir `test-carte.html` directement (double-clic).  
Cela causera une erreur CORS (carte blanche).

**Lancer le serveur HTTP** :
```powershell
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\cartes
python -m http.server 3000
```

**Laisser ce terminal ouvert** ✅

---

## Étape 3 : Ouvrir la page de test

**Dans un navigateur, aller à** :
```
http://localhost:3000/test-carte.html
```

**OU en PowerShell** :
```powershell
Start-Process "http://localhost:3000/test-carte.html"
```

---

## Étape 4 : Vérifier le fonctionnement

### Console Navigateur (F12)
1. Ouvrir les **DevTools** (F12)
2. Onglet **Network**
3. Filtrer par "tile"
4. Vérifier :
   - ✅ Requêtes vers `http://localhost:8080/tile/...`
   - ✅ Statut **200 OK**
   - ⏳ Première fois : **lent** (génération à la demande)
   - ✅ Deuxième fois : **rapide** (cache)

### Résultat Attendu
- ✅ Carte d'Antananarivo affichée
- ✅ Marqueurs visibles
- ✅ Navigation fonctionnelle (zoom, pan)
- ⏳ **Première charge : 10-30 secondes** (normal)
- ⚡ **Après cache : < 2 secondes**

---

## 🐛 Troubleshooting

### Problème : Carte blanche (aucune tuile)

**Cause probable** : Page ouverte en `file://` au lieu de `http://`

**Solution** :
1. Fermer la page
2. Vérifier que le serveur HTTP tourne (`python -m http.server 3000`)
3. Ouvrir via `http://localhost:3000/test-carte.html`

### Problème : Tuiles très lentes (> 1 minute)

**Cause** : Génération à la demande pour zoom élevé

**Solutions** :
1. **Patienter** : Première charge toujours lente
2. **Rafraîchir** (F5) : Cache activé après première génération
3. **Baisser le zoom** : Modifier le code pour zoom 8-10
4. **Pré-rendre** : Voir [DIAGNOSTIC-PROBLEMES.md](./DIAGNOSTIC-PROBLEMES.md)

### Problème : Erreur "Connection refused"

**Cause** : Serveur Docker arrêté

**Solution** :
```powershell
docker start osm-tile-server-run
docker ps
```

### Problème : Port 3000 déjà utilisé

**Solution** : Utiliser un autre port
```powershell
python -m http.server 8888
# Puis ouvrir : http://localhost:8888/test-carte.html
```

---

## 📋 Commandes Utiles

### Gestion Docker
```powershell
# Démarrer
docker start osm-tile-server-run

# Arrêter
docker stop osm-tile-server-run

# Logs (debug)
docker logs osm-tile-server-run --tail 50

# Redémarrer
docker restart osm-tile-server-run
```

### Test Tuiles
```powershell
# Tester une tuile
Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png" -OutFile "test.png"
Start-Process "test.png"

# Vérifier headers HTTP
(Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png" -Method Head).Headers
```

### Alternative au serveur HTTP Python
```powershell
# Si Python n'est pas disponible, utiliser PHP
php -S localhost:3000

# Ou Node.js
npx http-server -p 3000
```

---

## ✅ Checklist Validation

- [ ] Docker container `osm-tile-server-run` actif
- [ ] Serveur HTTP local sur port 3000
- [ ] Page ouverte via `http://localhost:3000/test-carte.html`
- [ ] Console (F12) sans erreur CORS
- [ ] Tuiles visibles sur la carte
- [ ] Marqueurs visibles
- [ ] Navigation fonctionnelle

**Si tous ces points sont validés, le module fonctionne correctement !** ✅

---

## 🔗 Documentation Complète

- [DOCUMENTATION-MODULE-CARTE.md](./DOCUMENTATION-MODULE-CARTE.md) - Documentation technique
- [DIAGNOSTIC-PROBLEMES.md](./DIAGNOSTIC-PROBLEMES.md) - Explication détaillée des problèmes
- [README.md](./README.md) - Vue d'ensemble

