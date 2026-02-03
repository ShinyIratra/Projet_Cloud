# Documentation Technique - RoadAlert

> **Projet** : Système de signalement des problèmes routiers  
> **Date** : Janvier 2026  
> **Version** : 2.0

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture système](#architecture-système)
3. [Stack technique](#stack-technique)
4. [Composants détaillés](#composants-détaillés)
5. [Base de données](#base-de-données)
6. [Interfaces utilisateur](#interfaces-utilisateur)
7. [API REST](#api-rest)
8. [Scénarios d'utilisation](#scénarios-dutilisation)
9. [Déploiement](#déploiement)

---

## 🎯 Vue d'ensemble

### Objectif du projet
RoadAlert est une plateforme web et mobile permettant de **signaler, gérer et suivre les problèmes routiers** à Antananarivo. Le système fonctionne en mode **hors ligne** grâce à un serveur de tuiles local et une base PostgreSQL embarquée.

### Fonctionnalités principales
- ✅ **Authentification multi-rôles** (Visiteur, Utilisateur, Manager)
- ✅ **Carte interactive offline** avec tuiles OpenStreetMap locales
- ✅ **Gestion CRUD des signalements** (statut, budget, surface, entreprise)
- ✅ **Dashboard statistiques** avec graphiques
- ✅ **Synchronisation Firebase** (mobile ↔ web)
- ✅ **Blocage/déblocage automatique** après tentatives échouées
- ✅ **Mode hors ligne complet** (excepté sync Firebase)

---

## 🏗️ Architecture système

### Schéma global

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND WEB (React)                     │
│                  http://localhost:5173                      │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐ │
│  │  Login   │   Home   │Dashboard │Management│  Blocked  │ │
│  │          │  Carte   │  Stats   │  CRUD    │   Users   │ │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API (Node.js)                      │
│                  http://localhost:5000                      │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐ │
│  │   Auth   │  Alerts  │  Users   │   Sync   │  Stats    │ │
│  │Controller│Controller│Controller│Controller│ Endpoint  │ │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘ │
└──────┬────────────────────┬─────────────────────────────────┘
       │                    │
       ▼                    ▼
┌──────────────────┐  ┌──────────────────────────────────────┐
│   PostgreSQL     │  │        Firebase Realtime DB          │
│   + PostGIS      │  │     (Sync mobile → web)              │
│  Port 5433       │  │                                      │
│  Docker          │  │  ┌────────────────────────────────┐  │
└──────────────────┘  │  │  FRONTEND MOBILE (Ionic/Vue)   │  │
                      │  │  - Géolocalisation GPS         │  │
┌──────────────────┐  │  │  - Formulaire signalement      │  │
│  OSM Tile Server │  │  │  - Carte Leaflet mobile        │  │
│  Port 8080       │  │  └────────────────────────────────┘  │
│  Docker          │  └──────────────────────────────────────┘
│  (Offline maps)  │
└──────────────────┘
```

### Flux de données

#### 1. Affichage carte (Visiteur)
```
Frontend → Backend GET /signalements 
         ← JSON {id, lat, lng, statut, budget, surface}
Frontend → Tile Server GET /tile/{z}/{x}/{y}.png
         ← Image PNG (tuile carte)
Frontend → Affichage Leaflet avec markers
```

#### 2. Modification signalement (Manager)
```
Frontend → Backend PUT /signalements/:id {statut: "terminé"}
Backend → PostgreSQL UPDATE statut_signalement
        ← Confirmation
Backend → Frontend {success: true}
Frontend → Refresh carte + tableau
```

#### 3. Synchronisation Mobile → Web
```
Mobile → Firebase PUSH /signalement {lat, lng, surface, ...}
Manager (Web) → Bouton "Sync Firebase"
Frontend → Backend POST /sync/firebase
Backend → Firebase GET /signalement
Backend → PostgreSQL INSERT INTO signalement
Backend → Frontend {synced: 5, errors: 0}
Frontend → Refresh automatique
```

---

## 💻 Stack technique

### Frontend Web
| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 18.x | Framework UI |
| **Vite** | 5.4.21 | Build tool & Dev server |
| **Ionic React** | 8.5.0 | Composants UI responsifs |
| **Leaflet** | 1.9.4 | Carte interactive |
| **Chart.js** | 4.5.1 | Graphiques dashboard |
| **React Router** | 6.x | Navigation SPA |
| **Font Awesome** | 6.x | Icônes (local) |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Node.js** | 18.x | Runtime JavaScript |
| **Express** | 4.18.2 | Framework REST API |
| **pg (node-postgres)** | 8.11.0 | Driver PostgreSQL |
| **Firebase Admin** | 11.x | Sync Firebase |
| **Swagger UI** | - | Documentation API |
| **CORS** | - | Cross-origin requests |

### Base de données
| Technologie | Version | Usage |
|-------------|---------|-------|
| **PostgreSQL** | 15 | Base relationnelle |
| **PostGIS** | 3.4 | Extension géospatiale |
| **Docker** | - | Conteneurisation |

### Infrastructure
| Service | Port | Description |
|---------|------|-------------|
| Frontend Vite | 5173 | Interface web React |
| Backend API | 5000 | API REST Node.js |
| PostgreSQL | 5433 | Base de données |
| OSM Tile Server | 8080 | Tuiles carte offline |

---

## 🧩 Composants détaillés

### 1. Backend (API REST)

#### Architecture en couches
```
routes/
├── authRoutes.js       → /auth/register, /auth/login
├── roadAlertRoutes.js  → /signalements (CRUD)
├── userRoutes.js       → /users/blocked
└── webRoutes.js        → /stats, /sync/firebase

controllers/
├── authController.js   → Logique authentification
├── RoadAlertController.js → CRUD signalements
├── userController.js   → Gestion utilisateurs
├── syncController.js   → Synchronisation Firebase
└── webAuthController.js → Auth web spécifique

models/
├── UserModel.js        → Requêtes SQL users
├── RoadAlertModel.js   → Requêtes SQL signalements
└── ApiModel.js         → Helpers base de données

config/
├── postgres.js         → Pool connexion PostgreSQL
├── firebase.js         → Admin SDK Firebase
└── swagger.js          → Config Swagger UI
```

#### Endpoints principaux

**Authentification**
- `POST /auth/register` - Inscription utilisateur
- `POST /auth/login` - Connexion (blocage après 3 échecs)
- `POST /auth/logout` - Déconnexion
- `POST /users/unblock/:id` - Débloquer utilisateur (manager only)

**Signalements**
- `GET /signalements` - Liste tous les signalements
- `GET /signalements/:id` - Détail signalement
- `POST /signalements` - Créer signalement
- `PUT /signalements/:id` - Modifier signalement
- `PATCH /signalements/:id/statut` - Changer statut
- `DELETE /signalements/:id` - Supprimer signalement

**Dashboard & Stats**
- `GET /stats` - Statistiques globales (points, surface, budget)
- `GET /stats/activity` - Activité 7 derniers jours
- `GET /stats/entreprises` - Répartition entreprises

**Synchronisation**
- `POST /sync/firebase` - Importer signalements depuis Firebase
- `GET /users/blocked` - Liste utilisateurs bloqués

#### Middlewares
```javascript
// Vérification authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({error: 'Non autorisé'});
  // Vérifier token...
  next();
};

// Vérification rôle manager
const managerOnly = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({error: 'Accès interdit'});
  }
  next();
};
```

---

### 2. Base de données PostgreSQL

#### Schéma relationnel

**Table : users**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  role_id INTEGER REFERENCES role(id),
  statut_id INTEGER REFERENCES statut_user(id),
  tentatives_connexion INTEGER DEFAULT 0,
  date_blocage TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table : role**
```sql
CREATE TABLE role (
  id SERIAL PRIMARY KEY,
  libelle VARCHAR(50) UNIQUE -- 'visiteur', 'utilisateur', 'manager'
);
```

**Table : statut_user**
```sql
CREATE TABLE statut_user (
  id SERIAL PRIMARY KEY,
  libelle VARCHAR(50) -- 'actif', 'bloqué'
);
```

**Table : signalement**
```sql
CREATE TABLE signalement (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  position GEOGRAPHY(POINT, 4326), -- PostGIS
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  surface NUMERIC(10, 2), -- m²
  budget NUMERIC(15, 2), -- Ar
  entreprise_id INTEGER REFERENCES entreprise(id),
  statut_id INTEGER REFERENCES statut_signalement(id),
  date_signalement TIMESTAMP DEFAULT NOW()
);
```

**Table : statut_signalement**
```sql
CREATE TABLE statut_signalement (
  id SERIAL PRIMARY KEY,
  libelle VARCHAR(50) -- 'nouveau', 'en_cours', 'termine'
);
```

**Table : entreprise**
```sql
CREATE TABLE entreprise (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  contact VARCHAR(100)
);
```

#### Requêtes optimisées

**Statistiques dashboard**
```sql
SELECT 
  COUNT(*) as total_signalements,
  SUM(surface) as surface_totale,
  SUM(budget) as budget_total,
  COUNT(CASE WHEN statut_id = 3 THEN 1 END) * 100.0 / COUNT(*) as avancement
FROM signalement;
```

**Signalements avec jointures**
```sql
SELECT 
  s.id, s.latitude, s.longitude, s.surface, s.budget,
  st.libelle as statut,
  e.nom as entreprise,
  u.email as auteur
FROM signalement s
LEFT JOIN statut_signalement st ON s.statut_id = st.id
LEFT JOIN entreprise e ON s.entreprise_id = e.id
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.date_signalement DESC;
```

---

### 3. Frontend Web (React)

#### Structure des pages

**Pages implémentées**

| Route | Composant | Rôles autorisés | Description |
|-------|-----------|-----------------|-------------|
| `/login` | Login.tsx | Tous | Formulaire connexion |
| `/home` | Home.tsx | Tous | Carte + markers Leaflet |
| `/dashboard` | Dashboard.tsx | Utilisateur, Manager | Stats + graphiques |
| `/management` | Management.tsx | Manager only | CRUD signalements |
| `/blocked-users` | BlockedUsers.tsx | Manager only | Déblocage utilisateurs |

**Composants réutilisables**
```
src/
├── components/
│   ├── MapComponent.tsx      → Carte Leaflet
│   ├── SignalementCard.tsx   → Carte signalement
│   ├── StatCard.tsx          → Carte statistique
│   └── Footer.tsx            → Navigation sticky
├── pages/
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   ├── Management.tsx
│   └── BlockedUsers.tsx
├── utils/
│   └── api.ts                → Client HTTP (fetch)
└── router/
    └── index.tsx             → Routes React Router
```

#### Gestion de l'état

**LocalStorage pour session**
```typescript
// Stockage utilisateur connecté
localStorage.setItem('user', JSON.stringify({
  id: 1,
  email: 'manager@roadalert.mg',
  role: 'manager',
  token: 'jwt_token_here'
}));

// Récupération
const user = JSON.parse(localStorage.getItem('user') || 'null');
```

**Protection des routes**
```typescript
const ProtectedRoute = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Redirect to="/home" />;
  }
  
  return children;
};
```

#### Carte Leaflet (Home.tsx)

**Configuration tuiles offline**
```typescript
const tileLayer = L.tileLayer(
  'http://localhost:8080/tile/{z}/{x}/{y}.png',
  {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 10
  }
);

const map = L.map('map').setView(
  [-18.8792, 47.5079], // Antananarivo
  13
);
```

**Ajout markers signalements**
```typescript
signalements.forEach((sig) => {
  const marker = L.marker([sig.latitude, sig.longitude])
    .bindPopup(`
      <b>Statut:</b> ${sig.statut}<br>
      <b>Surface:</b> ${sig.surface} m²<br>
      <b>Budget:</b> ${sig.budget.toLocaleString()} Ar<br>
      <b>Entreprise:</b> ${sig.entreprise}
    `)
    .addTo(map);
});
```

#### Dashboard (Chart.js)

**Graphique activité**
```typescript
import { Line } from 'react-chartjs-2';

const data = {
  labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  datasets: [{
    label: 'Signalements',
    data: [12, 19, 15, 25, 22, 30, 28],
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1
  }]
};

<Line data={data} />
```

---

### 4. Module Carte Offline

#### Docker Compose (module-cartes/)

**Configuration serveur de tuiles**
```yaml
version: '3.8'
services:
  osm-tile-server:
    image: overv/openstreetmap-tile-server:latest
    ports:
      - "8080:80"
    volumes:
      - osm-data:/data/database/
      - ./region.osm.pbf:/data/region.osm.pbf
    environment:
      - OSM2PGSQL_EXTRA_ARGS=-C 2048
    command: run

volumes:
  osm-data:
    external: true
    name: module-cartes_osm-data
```

**Import données OSM**
```bash
# Téléchargement Madagascar (361 MB)
wget https://download.geofabrik.de/africa/madagascar-latest.osm.pbf

# Import dans PostgreSQL + PostGIS
docker-compose run --rm osm-tile-server import
```

**Vérification tuiles**
```bash
# Tester une tuile
curl http://localhost:8080/tile/10/527/512.png --output test.png

# Résultat attendu : fichier PNG ~103 bytes
```

---

### 5. Application Mobile (Ionic/Vue)

#### Structure projet mobile
```
frontend-mobile/roadAlert/
├── src/
│   ├── views/
│   │   ├── Login.vue
│   │   ├── MapMobile.vue
│   │   ├── SignalementForm.vue
│   │   └── MesSignalements.vue
│   ├── composables/
│   │   ├── useGeolocation.ts  → GPS capacitor
│   │   └── useFirebase.ts     → Firebase SDK
│   └── router/
├── android/                    → Build APK
└── capacitor.config.ts
```

#### Géolocalisation GPS

```typescript
import { Geolocation } from '@capacitor/geolocation';

const getCurrentPosition = async () => {
  const coordinates = await Geolocation.getCurrentPosition();
  return {
    latitude: coordinates.coords.latitude,
    longitude: coordinates.coords.longitude
  };
};
```

#### Synchronisation Firebase

**Enregistrement signalement**
```typescript
import { getDatabase, ref, push } from 'firebase/database';

const addSignalement = async (data) => {
  const db = getDatabase();
  const sigRef = ref(db, 'signalements');
  
  await push(sigRef, {
    latitude: data.lat,
    longitude: data.lng,
    surface: data.surface,
    budget: data.budget,
    entreprise: data.entreprise,
    userId: currentUser.uid,
    timestamp: Date.now()
  });
};
```

---

## 📊 Scénarios d'utilisation détaillés

### Scénario 1 : Visiteur consulte la carte

**Acteurs** : Visiteur (non connecté)  
**Prérequis** : Serveur tuiles + Backend + Frontend démarrés

**Étapes détaillées**

1. **Accès application**
   - URL : `http://localhost:5173`
   - Aucun login requis → accès direct `/home`

2. **Chargement données**
   ```
   Frontend → GET http://localhost:5000/signalements
   Backend  → SELECT * FROM signalement s
              LEFT JOIN statut_signalement st ON s.statut_id = st.id
              LEFT JOIN entreprise e ON s.entreprise_id = e.id
   Backend  → JSON [{id:1, lat:-18.879, lng:47.507, ...}, ...]
   Frontend ← 200 OK
   ```

3. **Affichage carte**
   ```
   Frontend → GET http://localhost:8080/tile/13/{x}/{y}.png (×50 tuiles)
   Tile Server ← Images PNG depuis PostgreSQL/PostGIS
   Frontend → Leaflet affiche carte Antananarivo
   ```

4. **Affichage markers**
   ```javascript
   signalements.forEach(sig => {
     L.marker([sig.latitude, sig.longitude])
       .bindPopup(renderPopup(sig))
       .addTo(map);
   });
   ```

5. **Interaction survol**
   - Clic sur marker
   - Popup affiche :
     - Statut : `nouveau` 🔴 / `en_cours` 🟡 / `termine` 🟢
     - Surface : `250 m²`
     - Budget : `15 000 000 Ar`
     - Entreprise : `TRAVAUX SUD SARL`

**Résultat** : Carte interactive avec tous les signalements visibles

---

### Scénario 2 : Manager modifie un signalement

**Acteurs** : Manager (connecté)  
**Prérequis** : Compte manager actif

**Étapes détaillées**

1. **Connexion**
   ```
   Frontend → POST /auth/login {email, password}
   Backend  → SELECT * FROM users WHERE email = ?
   Backend  → Vérifier password (bcrypt)
   Backend  → Réinitialiser tentatives_connexion = 0
   Backend  → Générer token JWT
   Frontend ← {user: {id, role:'manager'}, token}
   Frontend → localStorage.setItem('user', ...)
   Frontend → Redirect /management
   ```

2. **Accès page Management**
   ```
   Frontend → GET /signalements
   Backend  → SELECT avec jointures (statut + entreprise)
   Frontend ← Liste complète signalements
   Frontend → Affichage tableau éditable
   ```

3. **Modification inline**
   ```
   Manager → Clic sur cellule "Statut"
   Frontend → Affiche SELECT (nouveau, en_cours, termine)
   Manager → Sélectionne "termine"
   
   Frontend → PUT /signalements/42 {statut_id: 3}
   Backend  → UPDATE signalement SET statut_id = 3 WHERE id = 42
   Backend  → SELECT pour récupérer données mises à jour
   Frontend ← {success: true, signalement: {...}}
   Frontend → Refresh tableau + carte
   ```

4. **Modification multi-champs**
   ```
   Manager → Double-clic ligne signalement
   Frontend → Modal édition
   
   Champs modifiables :
   - Surface : 250 → 300 m²
   - Budget : 15M → 18M Ar
   - Entreprise : SELECT depuis table entreprise
   - Latitude/Longitude : -18.8792 / 47.5079
   
   Manager → Clic "Enregistrer"
   Frontend → PUT /signalements/42 {surface, budget, entreprise_id}
   Backend  → UPDATE avec validation
   Frontend → Confirmation toast + refresh
   ```

**Résultat** : Signalement modifié visible partout (carte + dashboard + tableau)

---

### Scénario 3 : Blocage automatique après 3 tentatives

**Acteurs** : Utilisateur, Manager  
**Prérequis** : Compte utilisateur actif

**Phase 1 : Tentatives échouées**

1. **Tentative 1**
   ```
   Frontend → POST /auth/login {email, wrong_password}
   Backend  → SELECT * FROM users WHERE email = ?
   Backend  → bcrypt.compare(wrong_password, hash) → false
   Backend  → UPDATE users SET tentatives_connexion = 1
   Frontend ← 401 {error: "Mot de passe incorrect (1/3)"}
   ```

2. **Tentative 2**
   ```
   Frontend → POST /auth/login {email, wrong_password}
   Backend  → tentatives_connexion = 2
   Frontend ← 401 {error: "Mot de passe incorrect (2/3)"}
   ```

3. **Tentative 3 → Blocage**
   ```
   Frontend → POST /auth/login {email, wrong_password}
   Backend  → tentatives_connexion = 3
   Backend  → UPDATE users SET 
              statut_id = 2, -- 'bloqué'
              date_blocage = NOW()
   Frontend ← 403 {error: "Compte bloqué. Contactez un administrateur."}
   ```

**Phase 2 : Déblocage par manager**

1. **Manager accède utilisateurs bloqués**
   ```
   Frontend → GET /users/blocked
   Backend  → SELECT * FROM users u
              LEFT JOIN statut_user s ON u.statut_id = s.id
              WHERE s.libelle = 'bloqué'
   Frontend ← [{id, email, nom, date_blocage}, ...]
   Frontend → Affiche tableau avec bouton "Débloquer"
   ```

2. **Déblocage**
   ```
   Manager → Clic "Débloquer" (user_id = 5)
   Frontend → POST /users/unblock/5
   Backend  → UPDATE users SET 
              statut_id = 1, -- 'actif'
              tentatives_connexion = 0,
              date_blocage = NULL
              WHERE id = 5
   Frontend ← {success: true, message: "Utilisateur débloqué"}
   Frontend → Refresh tableau (utilisateur disparaît)
   ```

3. **Utilisateur se reconnecte**
   ```
   Frontend → POST /auth/login {email, correct_password}
   Backend  → Compte actif → Login OK
   Frontend ← {user, token}
   ```

**Résultat** : Sécurité anti-bruteforce + workflow déblocage

---

### Scénario 4 : Synchronisation Mobile → Web

**Acteurs** : Utilisateur (mobile), Manager (web)  
**Prérequis** : Firebase configuré

**Phase 1 : Signalement depuis mobile**

1. **Connexion mobile**
   ```
   Mobile → Firebase Auth (email/password)
   Firebase ← {uid, token}
   Mobile → Stockage session
   ```

2. **Géolocalisation**
   ```
   Mobile → Capacitor Geolocation.getCurrentPosition()
   GPS ← {latitude: -18.8792, longitude: 47.5079, accuracy: 15m}
   Mobile → Affiche marker sur carte Leaflet mobile
   ```

3. **Formulaire signalement**
   ```
   Utilisateur saisit :
   - Surface : 120 m²
   - Budget estimé : 8 000 000 Ar
   - Entreprise : SELECT depuis Firebase
   - Photo (optionnel)
   
   Mobile → Bouton "Envoyer"
   ```

4. **Envoi Firebase**
   ```
   Mobile → Firebase Realtime DB
            /signalements/{push_id}
            {
              userId: "firebase_uid_123",
              latitude: -18.8792,
              longitude: 47.5079,
              surface: 120,
              budget: 8000000,
              entreprise: "TRAVAUX SUD",
              timestamp: 1706342400000,
              statut: "nouveau"
            }
   Firebase ← {name: "-NqXYZ123abc"}
   Mobile → Confirmation "Signalement envoyé"
   ```

**Phase 2 : Synchronisation web**

1. **Manager clique "Sync Firebase"**
   ```
   Frontend → POST /sync/firebase
   Backend  → Firebase Admin SDK
              const db = admin.database();
              const ref = db.ref('/signalements');
              const snapshot = await ref.once('value');
   ```

2. **Récupération données**
   ```
   Backend ← {
     "-NqXYZ123abc": {userId, lat, lng, surface, ...},
     "-NqXYZ456def": {...},
     ...
   }
   ```

3. **Insertion PostgreSQL**
   ```
   Pour chaque signalement Firebase :
   
   Backend → SELECT id FROM users WHERE firebase_uid = ?
   Backend → SELECT id FROM entreprise WHERE nom = ?
   Backend → SELECT id FROM statut_signalement WHERE libelle = 'nouveau'
   
   Backend → INSERT INTO signalement (
               user_id, latitude, longitude, position,
               surface, budget, entreprise_id, statut_id
             ) VALUES (
               $1, $2, $3, 
               ST_SetSRID(ST_MakePoint($3, $2), 4326),
               $4, $5, $6, $7
             )
   ```

4. **Réponse synchronisation**
   ```
   Backend  → {
                synced: 5,
                errors: 0,
                nouveauxSignalements: [42, 43, 44, 45, 46]
              }
   Frontend ← 200 OK
   Frontend → Toast "5 signalements synchronisés"
   Frontend → Refresh carte + tableau automatique
   ```

**Résultat** : Signalements mobile visibles sur web

---

## 🚀 Déploiement

### Mode développement

**Prérequis**
```bash
# Vérifier installations
node -v  # >= 18.x
docker --version
docker-compose --version
```

**Étape 1 : PostgreSQL**
```bash
cd D:\ITU_V2\Mr_Rojo\Projet_Cloud

# Démarrer PostgreSQL
docker-compose up -d postgres

# Initialiser tables
Get-Content bdd/firebase/relationnel/users.sql | docker exec -i roadalert_db psql -U postgres
```

**Étape 2 : Serveur tuiles (optionnel hors ligne)**
```bash
cd backend/module-cartes

# Démarrer serveur
docker-compose up -d osm-tile-server

# Vérifier
curl http://localhost:8080/tile/10/527/512.png --output test.png
```

**Étape 3 : Backend**
```bash
cd backend

# Installer dépendances
npm install

# Démarrer serveur
npm start
# → http://localhost:5000
```

**Étape 4 : Frontend**
```bash
cd frontend-web/roadAlert

# Installer dépendances
npm install

# Installer Font Awesome local
npm install --save @fortawesome/fontawesome-free

# Démarrer dev server
npm run dev
# → http://localhost:5173
```

**Étape 5 : Vérification**
- ✅ Backend API : http://localhost:5000/stats
- ✅ Frontend web : http://localhost:5173
- ✅ Swagger docs : http://localhost:5000/api-docs
- ✅ Tuiles carte : http://localhost:8080/tile/13/4219/4097.png

### Mode production

**Build frontend**
```bash
cd frontend-web/roadAlert
npm run build

# Résultat : dist/ folder
```

**Servir avec Nginx**
```nginx
server {
  listen 80;
  server_name roadalert.mg;
  
  # Frontend
  location / {
    root /var/www/roadalert/dist;
    try_files $uri /index.html;
  }
  
  # API proxy
  location /api/ {
    proxy_pass http://localhost:5000/;
  }
  
  # Tuiles
  location /tile/ {
    proxy_pass http://localhost:8080/tile/;
  }
}
```

**Build APK mobile**
```bash
cd frontend-mobile/roadAlert

# Build Android
ionic capacitor build android --prod

# Résultat : android/app/build/outputs/apk/release/app-release.apk
```

---

## 📈 Performance & Optimisation

### Backend
- ✅ **Pool PostgreSQL** : Max 20 connexions
- ✅ **Indexation** : Sur `latitude`, `longitude`, `statut_id`
- ✅ **GZIP compression** : Réponses JSON
- ✅ **Cache** : Requêtes stats (5 minutes)

### Frontend
- ✅ **Code splitting** : Lazy loading routes
- ✅ **Assets locaux** : Font Awesome, Leaflet
- ✅ **Service Worker** : Cache tuiles carte
- ✅ **Minification** : Vite build optimisé

### Carte
- ✅ **Tuiles locales** : Pas de latence réseau
- ✅ **Clustering markers** : > 100 signalements
- ✅ **Lazy loading** : Tuiles à la demande

---

## 🔒 Sécurité

### Authentification
- ✅ **Bcrypt** : Hash passwords (salt rounds = 10)
- ✅ **JWT tokens** : Expiration 24h
- ✅ **Blocage automatique** : 3 tentatives échouées
- ✅ **HTTPS** : Recommandé en production

### Autorisations
- ✅ **RBAC** : Role-Based Access Control (Visiteur < Utilisateur < Manager)
- ✅ **Middleware auth** : Vérification token sur routes protégées
- ✅ **Validation inputs** : Express validator
- ✅ **SQL injection** : Requêtes paramétrées

### Données
- ✅ **CORS** : Origines autorisées
- ✅ **Rate limiting** : 100 req/min
- ✅ **Logs** : Winston (errors + access)

---

## 📝 Conformité avec le sujet

| Fonctionnalité | Statut | Implémentation |
|----------------|--------|----------------|
| Carte interactive offline | ✅ | Leaflet + OSM tile server local |
| Dashboard statistiques | ✅ | GET /stats + Chart.js |
| Gestion signalements | ✅ | CRUD complet (manager only) |
| Authentification multi-rôles | ✅ | JWT + RBAC (3 rôles) |
| Blocage automatique | ✅ | 3 tentatives → blocage |
| Déblocage utilisateurs | ✅ | Page dédiée manager |
| Synchronisation Firebase | ✅ | Mobile → Firebase → Web |
| Mode hors ligne | ✅ | PostgreSQL + tuiles locales |
| Application mobile | ✅ | Ionic/Vue + Capacitor |
| Tests unitaires | ⚠️ | À compléter (Jest + Mocha) |

---

## 🛠️ Maintenance & Support

### Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# PostgreSQL logs
docker logs roadalert_db

# Tile server logs
docker logs module-cartes-osm-tile-server-1
```

### Backup base de données
```bash
# Dump PostgreSQL
docker exec roadalert_db pg_dump -U postgres > backup_$(date +%F).sql

# Restauration
cat backup_2026-01-27.sql | docker exec -i roadalert_db psql -U postgres
```

### Mise à jour données OSM
```bash
cd backend/module-cartes

# Télécharger nouvelles données
wget https://download.geofabrik.de/africa/madagascar-latest.osm.pbf

# Stopper serveur
docker-compose down

# Supprimer ancien volume
docker volume rm module-cartes_osm-data

# Réimporter
docker-compose run --rm osm-tile-server import

# Redémarrer
docker-compose up -d
```

---

## 📞 Contact & Support

**Équipe RoadAlert**  
- Chef de projet : [Nom]
- Développeur Backend : [Nom]
- Développeur Frontend : [Nom]
- Développeur Mobile : [Nom]

**Repository** : https://github.com/[username]/Projet_Cloud

---

**Version** : 2.0  
**Dernière mise à jour** : 27 janvier 2026
