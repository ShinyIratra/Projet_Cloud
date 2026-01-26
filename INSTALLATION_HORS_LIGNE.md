# Installation Mode Hors Ligne - RoadAlert Web

## ✅ Fonctionnalités disponibles SANS INTERNET

L'application **RoadAlert Web** fonctionne **totalement en local** avec :

### Infrastructure locale
- ✅ **PostgreSQL** : Dans Docker (port 5433)
- ✅ **Backend Node.js** : Serveur API local (port 5000)
- ✅ **Frontend Vite** : Interface web (port 5173)
- ✅ **Toutes les fonctionnalités CRUD** : Créer, lire, modifier, supprimer les signalements
- ✅ **Authentication** : Login/logout local
- ✅ **Gestion utilisateurs** : Bloquer/débloquer
- ✅ **Dashboard** : Statistiques et graphiques
- ✅ **Carte interactive** : Leaflet avec markers
- ✅ **Font Awesome** : Icônes (après installation locale)

### Fonctionnalités nécessitant Internet
- ❌ **Synchronisation Firebase** : Sync bidirectionnelle (bouton "Sync Firebase")
- ⚠️ **Tuiles de carte** : Chargées depuis `basemaps.cartocdn.com` (peut être mise en cache par le navigateur)

---

## 📦 Installation Font Awesome en local

### Étape 1 : Installer le package
```bash
cd frontend-web/roadAlert
npm install --save @fortawesome/fontawesome-free
```

### Étape 2 : Vérifier main.tsx
Le fichier `src/main.tsx` doit contenir :
```typescript
import '@fortawesome/fontawesome-free/css/all.min.css';
```

### Étape 3 : Vérifier index.html
Le fichier `index.html` NE doit PAS avoir de lien CDN Font Awesome.

### Étape 4 : Rebuild et tester
```bash
npm run dev
```

Les icônes fonctionneront maintenant **sans connexion internet**.

---

## 🚀 Démarrage complet en mode local

### 1. Démarrer PostgreSQL
```bash
docker-compose up -d postgres
```

### 2. Initialiser la base de données
```bash
Get-Content bdd/firebase/relationnel/users.sql | docker exec -i roadalert_db psql -U postgres
```

### 3. Démarrer le backend
```bash
cd backend
npm install  # Première fois seulement
npm start
```

### 4. Démarrer le frontend
```bash
cd frontend-web/roadAlert
npm install  # Première fois seulement
npm run dev
```

### 5. Accéder à l'application
- Frontend : http://localhost:5173
- Backend API : http://localhost:5000

**Aucune connexion Internet requise** pour utiliser l'application !

---

## 📋 Fonctionnalités du Module Web (conformes au sujet)

### ✅ Pages implémentées
1. **Login** (`/login`)
   - Authentification avec email/password
   - Stockage session localStorage
   - Redirection selon rôle

2. **Home/Carte** (`/home`)
   - Carte Leaflet interactive
   - Markers pour chaque signalement
   - Popup avec détails (statut, budget, surface, entreprise)
   - Bouton synchronisation Firebase (nécessite internet)
   - Menu utilisateur avec avatar selon rôle
   - Mode visiteur disponible

3. **Dashboard** (`/dashboard`)
   - Statistiques : Points recensés, Surface signalée, Budget total, Réparation globale
   - Graphique d'activité des signalements (7 derniers jours)
   - Entreprises actives avec pourcentages
   - Tableau des points critiques avec filtres
   - Export PDF (bouton présent)

4. **Gestion/Management** (`/management`)
   - Réservé aux managers
   - Liste complète des signalements
   - Filtres : Tous / À valider / En cours
   - Édition inline des signalements
   - Modification : surface, budget, latitude, longitude, entreprise
   - Changement de statut : Nouveau → En cours → Terminé
   - Ajout nouveau signalement avec modal
   - SELECT entreprises depuis la base PostgreSQL

5. **Utilisateurs bloqués** (`/blocked-users`)
   - Réservé aux managers
   - Liste des comptes bloqués
   - Bouton débloquer pour chaque utilisateur
   - Données venant de PostgreSQL

### ✅ Fonctionnalités techniques
- **Base de données** : PostgreSQL avec PostGIS (colonne `position GEOGRAPHY`)
- **Statuts** : Venant de la base (table `statut_signalement`)
- **Entreprises** : SELECT depuis table `entreprise`
- **Avatars** : Icônes cohérentes par rôle (manager/user/visitor)
- **Formulaires** : Sans valeurs par défaut, placeholders informatifs
- **ID utilisateur** : Dynamique depuis session localStorage
- **Conversion données** : NUMERIC PostgreSQL → Number JavaScript
- **Navigation** : Router fonctionnel avec footer sticky

### ✅ Sécurité et Permissions
- Vérification rôle pour accès Management
- Vérification rôle pour Utilisateurs bloqués
- Redirection automatique si non autorisé
- Logout avec nettoyage session

---

## 🔧 Dépendances installées

### Frontend
```json
{
  "@ionic/react": "^8.5.0",
  "leaflet": "^1.9.4",
  "chart.js": "^4.5.1",
  "react-chartjs-2": "^5.3.1",
  "@fortawesome/fontawesome-free": "^6.x.x"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.0",
  "firebase-admin": "^11.x.x"
}
```

---

## ✅ Conformité avec le sujet

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Carte interactive | ✅ | Leaflet avec markers personnalisés |
| Dashboard statistiques | ✅ | 4 cartes + graphique + tableau |
| Gestion signalements | ✅ | CRUD complet réservé manager |
| Authentification | ✅ | Login/logout avec rôles |
| Utilisateurs bloqués | ✅ | Page dédiée manager only |
| Statuts de la base | ✅ | Jointure avec `statut_signalement` |
| Entreprises de la base | ✅ | SELECT depuis table `entreprise` |
| Mode hors ligne | ✅ | Fonctionne sans internet (sauf sync Firebase) |
| Font Awesome local | ✅ | Après installation npm |

---

## 📝 Notes importantes

1. **Tuiles de carte** : Leaflet charge les tuiles depuis internet. Pour un mode 100% hors ligne, il faudrait utiliser des tuiles locales (MBTiles).

2. **Google Fonts** : Retiré du HTML. Utilisez une police système ou installez localement si nécessaire.

3. **Service Worker** : Non configuré. Pour un PWA complet avec cache, il faudrait ajouter un Service Worker.

4. **Firebase** : La synchronisation est optionnelle. L'app fonctionne entièrement avec PostgreSQL seul.

---

## 🎯 Commandes rapides

```bash
# Tout démarrer en une fois
docker-compose up -d postgres
cd backend && npm start &
cd frontend-web/roadAlert && npm run dev
```

**L'application est maintenant 100% fonctionnelle en local !**
