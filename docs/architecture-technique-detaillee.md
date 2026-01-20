# Architecture Technique - Système de Signalement Routier Antananarivo

## Vue d'ensemble du système

Le système de signalement routier est une application complète permettant de gérer et visualiser les problèmes routiers à Antananarivo. Il comprend une application web pour la visualisation et la gestion, une application mobile pour le signalement sur terrain, et un backend API pour la gestion des données.

---

## 1. Composants du système

### 1.1 Backend (API REST)

**Rôle** : Le backend est le cœur du système, il gère toute la logique métier et les accès aux données.

**Responsabilités détaillées** :

#### Authentification et gestion des comptes
- **Inscription** : Création de nouveaux comptes utilisateurs avec validation des données (email unique, mot de passe sécurisé)
- **Connexion** : Vérification des identifiants et génération de tokens d'authentification
- **Sécurité** : Compteur de tentatives de connexion échouées (max 3)
- **Blocage automatique** : Après 3 tentatives échouées, le compte est automatiquement bloqué
- **Déblocage** : Interface administrateur permettant de débloquer un compte utilisateur
- **Gestion des rôles** : Attribution des rôles (utilisateur simple, manager, administrateur)

#### Gestion des signalements
- **Création** : Réception et validation des nouveaux signalements depuis l'application mobile
- **Lecture** : Fourniture des données de signalements à l'application web
- **Modification** : Mise à jour du statut et des informations d'un signalement
- **Filtrage** : Recherche et filtrage des signalements par date, statut, zone géographique
- **Calculs automatiques** : Budget total, surface totale, pourcentage d'avancement

#### Synchronisation Firebase
- **Import** : Récupération des signalements depuis Firebase (base de données mobile)
- **Transformation** : Conversion des données Firebase vers le format de la base de données locale
- **Vérification** : Détection et gestion des doublons

**Technologies utilisées** :
- Node.js avec Express.js
- RESTful API (routes GET, POST, PUT, DELETE)
- JWT (JSON Web Tokens) pour l'authentification
- Port d'écoute : 3000

---

### 1.2 Base de données

**Rôle** : Stockage persistant de toutes les données du système.

**Structure détaillée** :

#### Table `users` (Utilisateurs)
```
- id : identifiant unique (clé primaire)
- email : adresse email (unique)
- password : mot de passe hashé (bcrypt)
- role : rôle (user/manager/admin)
- failed_attempts : nombre de tentatives de connexion échouées
- is_blocked : statut de blocage (true/false)
- created_at : date de création du compte
- last_login : dernière connexion
```

#### Table `signalements` (Problèmes routiers)
```
- id : identifiant unique (clé primaire)
- latitude : coordonnée GPS (latitude)
- longitude : coordonnée GPS (longitude)
- date : date du signalement
- statut : état (nouveau/en_cours/terminé)
- surface : surface en m²
- budget : coût estimé en Ariary
- entreprise : nom de l'entreprise en charge
- description : détails du problème
- photo_url : lien vers la photo (optionnel)
- created_by : id de l'utilisateur créateur
- created_at : timestamp de création
- updated_at : timestamp de dernière modification
```

**Type de base de données** : PostgreSQL ou MySQL

---

### 1.3 Frontend Web (Application Web)

**Rôle** : Interface de visualisation et de gestion des signalements routiers.

**Fonctionnalités détaillées** :

#### Page d'accueil (mode visiteur)
- **Carte interactive Leaflet** :
  - Affichage centré sur Antananarivo (coordonnées : -18.8792, 47.5079)
  - Zoom initial : niveau 13
  - Tuiles cartographiques chargées depuis le serveur local (port 8080)
  - Marqueurs colorés selon le statut :
    - 🔴 Rouge : nouveau
    - 🟡 Jaune : en cours
    - 🟢 Vert : terminé

- **Popup d'informations** (au survol d'un marqueur) :
  ```
  📍 Signalement #12345
  📅 Date : 15/01/2026
  📊 Statut : En cours
  📐 Surface : 25 m²
  💰 Budget : 5 000 000 Ar
  🏢 Entreprise : SOMAROTRA
  ```

- **Tableau de récapitulatif** (en bas de page) :
  ```
  Statistiques globales :
  - Nombre total de signalements : 150
  - Surface totale : 3 750 m²
  - Budget total : 750 000 000 Ar
  - Avancement global : 65%
    • Nouveaux : 30 (20%)
    • En cours : 70 (47%)
    • Terminés : 50 (33%)
  ```

#### Page de connexion (authentification)
- Formulaire avec champs :
  - Email
  - Mot de passe
  - Bouton "Se connecter"
- Affichage d'erreurs en cas d'échec
- Redirection vers le tableau de bord après connexion réussie

#### Tableau de bord Manager
- **Liste des signalements** :
  - Vue tableau avec colonnes : ID, Date, Adresse, Statut, Surface, Budget, Entreprise
  - Filtres : par statut, par date, par zone
  - Boutons d'action : Modifier, Supprimer

- **Formulaire de modification** :
  - Changement de statut (liste déroulante)
  - Modification du budget
  - Attribution à une entreprise
  - Bouton "Enregistrer les modifications"

- **Bouton "Synchroniser avec Firebase"** :
  - Lance la récupération des nouveaux signalements mobiles
  - Affiche une barre de progression
  - Notification de succès/échec

**Technologies utilisées** :
- Framework : Ionic + React
- Carte : Leaflet.js 1.9.4 (hébergé localement)
- HTTP : Axios pour les appels API
- Port : 3001 (dev) ou 80 (production)

---

### 1.4 Serveur de tuiles cartographiques (Mode hors connexion)

**Rôle** : Fournir les images de carte pour fonctionner sans connexion Internet.

**Fonctionnement détaillé** :

#### Conteneur Docker
- **Image** : overv/openstreetmap-tile-server:latest
- **Taille de l'image** : 2.14 GB
- **Port d'accès** : 8080 (host) → 80 (container)

#### Base de données cartographique
- **PostgreSQL 15** avec extension PostGIS 3.3
- **Données importées** :
  - 77 millions de nœuds (points géographiques)
  - 7 millions de routes (ways)
  - 10 000 relations (zones administratives, limites)
- **Source** : Fichier region.osm.pbf (Madagascar - 361 MB)

#### Génération de tuiles
- **Moteur de rendu** : Mapnik
- **Format** : PNG (256x256 pixels)
- **Niveaux de zoom** : 0 (monde) à 19 (bâtiments individuels)
- **URL des tuiles** : `http://localhost:8080/tile/{z}/{x}/{y}.png`
  - `{z}` = niveau de zoom
  - `{x}` = coordonnée X
  - `{y}` = coordonnée Y

#### Cache des tuiles
- Première génération : 10-30 secondes par tuile
- Tuiles suivantes : servies depuis le cache (< 1 seconde)
- Stockage : Volume Docker persistant

---

### 1.5 Application Mobile (Ionic + Firebase)

**Rôle** : Permettre aux utilisateurs sur le terrain de signaler des problèmes routiers.

**Fonctionnalités détaillées** :

#### Écran de connexion
- **Champs** :
  - Email
  - Mot de passe
- **Boutons** :
  - "Se connecter"
  - "Créer un compte"
- **Authentification Firebase** : Vérification instantanée

#### Écran principal
- **Carte de localisation** :
  - Position GPS actuelle de l'utilisateur (point bleu)
  - Bouton "Créer un signalement" (icône +)

#### Formulaire de signalement
1. **Étape 1 : Localisation** (automatique)
   - GPS activé → récupération latitude/longitude
   - Affichage de l'adresse approximative

2. **Étape 2 : Photo** (optionnel)
   - Bouton "Prendre une photo"
   - Ouverture de l'appareil photo
   - Prévisualisation et validation

3. **Étape 3 : Informations**
   - Description du problème (texte libre)
   - Estimation de la surface (en m²)
   - Type de problème (liste déroulante) :
     - Nid-de-poule
     - Affaissement
     - Fissure
     - Autre

4. **Étape 4 : Validation**
   - Récapitulatif des informations
   - Bouton "Envoyer le signalement"

#### Envoi vers Firebase
- Stockage dans Firebase Firestore
- Structure :
  ```
  Collection: signalements
    Document ID: auto-généré
      - latitude: -18.8792
      - longitude: 47.5079
      - date: timestamp
      - description: "..."
      - photo_url: "..."
      - user_id: "..."
      - synced: false
  ```

**Technologies utilisées** :
- Framework : Ionic + Vue.js
- Backend : Firebase (Authentification + Firestore)
- GPS : Capacitor Geolocation Plugin
- Caméra : Capacitor Camera Plugin

---

## 2. Scénarios d'utilisation détaillés

### Scénario 1 : Visiteur consulte la carte (sans connexion)

**Acteurs** : Visiteur (utilisateur non connecté)

**Étapes détaillées** :

1. **Ouverture de l'application**
   - Le visiteur ouvre son navigateur web (Chrome, Firefox, Edge)
   - Il tape l'URL : `http://localhost:3001` (en développement) ou `http://signalements-antananarivo.mg` (en production)
   - Appuie sur Entrée

2. **Chargement de la page d'accueil**
   - Le navigateur envoie une requête HTTP GET vers le serveur web
   - Le serveur répond avec le fichier HTML principal
   - Le navigateur charge les fichiers CSS et JavaScript
   - Leaflet initialise la carte

3. **Affichage de la carte**
   - La carte se centre automatiquement sur Antananarivo (latitude: -18.8792, longitude: 47.5079)
   - Zoom initial : niveau 13
   - Requêtes de tuiles envoyées au serveur local :
     ```
     GET http://localhost:8080/tile/13/5397/4083.png
     GET http://localhost:8080/tile/13/5398/4083.png
     GET http://localhost:8080/tile/13/5397/4084.png
     ...
     ```
   - Les tuiles s'affichent progressivement (en quelques secondes)

4. **Affichage des marqueurs de signalements**
   - Le navigateur envoie une requête à l'API :
     ```
     GET http://localhost:3000/api/signalements
     ```
   - Le backend répond avec la liste des signalements (format JSON) :
     ```json
     [
       {
         "id": 1,
         "latitude": -18.8792,
         "longitude": 47.5079,
         "statut": "nouveau",
         "date": "2026-01-15",
         "surface": 25,
         "budget": 5000000,
         "entreprise": "SOMAROTRA"
       },
       ...
     ]
     ```
   - Leaflet ajoute un marqueur pour chaque signalement sur la carte
   - Couleur du marqueur selon le statut :
     - Rouge : nouveau
     - Jaune : en cours
     - Vert : terminé

5. **Survol d'un marqueur**
   - Le visiteur déplace sa souris sur un marqueur rouge
   - JavaScript détecte l'événement `mouseover`
   - Une popup s'affiche au-dessus du marqueur avec les informations :
     ```
     📍 Signalement #1
     📅 Date : 15/01/2026
     📊 Statut : Nouveau
     📐 Surface : 25 m²
     💰 Budget : 5 000 000 Ar
     🏢 Entreprise : SOMAROTRA
     📝 Nid-de-poule profond
     ```

6. **Clic sur un marqueur**
   - Le visiteur clique sur le marqueur
   - La popup reste affichée (mode permanent)
   - Un bouton "Voir les détails" apparaît dans la popup
   - Si le visiteur clique sur "Voir les détails", une modale s'ouvre avec plus d'informations :
     - Photo du problème (si disponible)
     - Description complète
     - Historique des modifications de statut
     - Bouton "Fermer"

7. **Navigation sur la carte**
   - Le visiteur peut :
     - **Zoomer** : clic sur les boutons + et - (ou molette de la souris)
       - Le zoom augmente/diminue
       - De nouvelles tuiles sont chargées automatiquement
     - **Se déplacer** : clic gauche maintenu + glisser
       - La carte se déplace dans la direction du mouvement
       - Nouvelles tuiles chargées pour la zone visible
     - **Double-clic** : zoom rapide sur une zone

8. **Consultation du tableau de récapitulatif**
   - Le visiteur fait défiler la page vers le bas
   - Un tableau s'affiche avec les statistiques globales :
     ```
     ┌─────────────────────────────────────────────────┐
     │ Statistiques des signalements à Antananarivo    │
     ├─────────────────────────────────────────────────┤
     │ Nombre total de signalements : 150              │
     │ Surface totale affectée : 3 750 m²              │
     │ Budget total estimé : 750 000 000 Ar            │
     │                                                  │
     │ Répartition par statut :                        │
     │   🔴 Nouveaux : 30 (20%)                        │
     │   🟡 En cours : 70 (47%)                        │
     │   🟢 Terminés : 50 (33%)                        │
     │                                                  │
     │ Avancement global : 65%                          │
     │ [████████████████░░░░░░░░░░] 65%               │
     └─────────────────────────────────────────────────┘
     ```

9. **Filtrage des signalements (optionnel)**
   - Des boutons de filtre s'affichent au-dessus de la carte :
     - [ Tous ] [ Nouveaux ] [ En cours ] [ Terminés ]
   - Le visiteur clique sur "En cours"
   - Les marqueurs rouges et verts disparaissent
   - Seuls les marqueurs jaunes restent visibles
   - Le tableau de récapitulatif se met à jour :
     ```
     Signalements en cours : 70
     Surface : 1 750 m²
     Budget : 350 000 000 Ar
     ```

---

### Scénario 2 : Manager modifie le statut d'un signalement

**Acteurs** : Manager (utilisateur connecté avec rôle "manager")

**Étapes détaillées** :

1. **Accès à la page de connexion**
   - Le manager ouvre son navigateur
   - Il va sur l'URL : `http://localhost:3001/login`
   - La page de connexion s'affiche :
     ```
     ┌────────────────────────────────────┐
     │   🗺️  Signalements Antananarivo   │
     │                                     │
     │   Email :                           │
     │   ┌─────────────────────────────┐  │
     │   │ manager@example.com         │  │
     │   └─────────────────────────────┘  │
     │                                     │
     │   Mot de passe :                    │
     │   ┌─────────────────────────────┐  │
     │   │ ••••••••                    │  │
     │   └─────────────────────────────┘  │
     │                                     │
     │   [ Se connecter ]                  │
     │                                     │
     │   Mot de passe oublié ?             │
     └────────────────────────────────────┘
     ```

2. **Saisie des identifiants**
   - Le manager clique dans le champ "Email"
   - Il tape : `manager@example.com`
   - Il appuie sur Tab (pour passer au champ suivant)
   - Il tape son mot de passe : `MotDePasse123!`
   - Il clique sur le bouton "Se connecter"

3. **Authentification**
   - Le navigateur envoie une requête POST à l'API :
     ```
     POST http://localhost:3000/api/auth/login
     Body: {
       "email": "manager@example.com",
       "password": "MotDePasse123!"
     }
     ```
   - Le backend vérifie les identifiants dans la base de données :
     - Hash du mot de passe comparé
     - Vérification du rôle
     - Vérification que le compte n'est pas bloqué
   - Le backend répond avec un token JWT :
     ```json
     {
       "success": true,
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {
         "id": 5,
         "email": "manager@example.com",
         "role": "manager"
       }
     }
     ```
   - Le token est stocké dans le localStorage du navigateur
   - Redirection automatique vers `/dashboard`

4. **Affichage du tableau de bord**
   - La page du tableau de bord se charge
   - En-tête avec menu de navigation :
     ```
     ┌─────────────────────────────────────────────────┐
     │ 🗺️ Signalements | 👤 Manager | 🚪 Déconnexion   │
     └─────────────────────────────────────────────────┘
     ```
   - Sidebar (barre latérale gauche) :
     ```
     📊 Tableau de bord
     📍 Signalements
     👥 Utilisateurs
     🔄 Synchronisation
     ⚙️ Paramètres
     ```

5. **Accès à la liste des signalements**
   - Le manager clique sur "📍 Signalements" dans la sidebar
   - Une requête est envoyée à l'API :
     ```
     GET http://localhost:3000/api/signalements
     Headers: { Authorization: "Bearer eyJhbGciOi..." }
     ```
   - La page affiche un tableau avec tous les signalements :
     ```
     ┌──────┬────────────┬──────────────┬─────────┬─────────┬──────────────┬─────────┐
     │ ID   │ Date       │ Adresse      │ Statut  │ Surface │ Budget       │ Actions │
     ├──────┼────────────┼──────────────┼─────────┼─────────┼──────────────┼─────────┤
     │ #1   │ 15/01/2026 │ Analakely    │ 🔴 Nouv │ 25 m²   │ 5 000 000 Ar │ ✏️ 🗑️   │
     │ #2   │ 14/01/2026 │ Ambohijatovo │ 🟡 Cour │ 30 m²   │ 6 000 000 Ar │ ✏️ 🗑️   │
     │ #3   │ 13/01/2026 │ Tsaralalana  │ 🟢 Term │ 20 m²   │ 4 000 000 Ar │ ✏️ 🗑️   │
     └──────┴────────────┴──────────────┴─────────┴─────────┴──────────────┴─────────┘
     ```

6. **Filtrage des signalements**
   - Au-dessus du tableau, des filtres sont disponibles :
     ```
     Filtrer par statut : [▼ Tous les statuts    ]
     Filtrer par date   : [Du: 01/01/2026] [Au: 20/01/2026]
     Rechercher         : [🔍 Chercher une adresse...      ]
     ```
   - Le manager clique sur "Filtrer par statut"
   - Un menu déroulant s'affiche :
     - Tous les statuts
     - Nouveaux seulement
     - En cours seulement
     - Terminés seulement
   - Il sélectionne "Nouveaux seulement"
   - Le tableau se rafraîchit et n'affiche que les signalements avec statut "nouveau"

7. **Modification d'un signalement**
   - Le manager repère le signalement #1 (Analakely)
   - Il clique sur l'icône ✏️ (crayon) dans la colonne "Actions"
   - Une modale s'ouvre avec le formulaire de modification :
     ```
     ┌─────────────────────────────────────────────────┐
     │ ✏️ Modifier le signalement #1                   │
     ├─────────────────────────────────────────────────┤
     │                                                  │
     │ Date : 15/01/2026 (non modifiable)              │
     │                                                  │
     │ Adresse : Analakely                              │
     │ ┌─────────────────────────────────────────────┐ │
     │ │ Analakely, près de l'ancien marché          │ │
     │ └─────────────────────────────────────────────┘ │
     │                                                  │
     │ Statut :                                         │
     │ ┌─────────────────────────────────────────────┐ │
     │ │ ▼ Nouveau                                   │ │
     │ └─────────────────────────────────────────────┘ │
     │                                                  │
     │ Surface (m²) :                                   │
     │ ┌─────────────────────────────────────────────┐ │
     │ │ 25                                          │ │
     │ └─────────────────────────────────────────────┘ │
     │                                                  │
     │ Budget (Ariary) :                                │
     │ ┌─────────────────────────────────────────────┐ │
     │ │ 5 000 000                                   │ │
     │ └─────────────────────────────────────────────┘ │
     │                                                  │
     │ Entreprise :                                     │
     │ ┌─────────────────────────────────────────────┐ │
     │ │ ▼ SOMAROTRA                                 │ │
     │ └─────────────────────────────────────────────┘ │
     │                                                  │
     │ [ Annuler ]              [ Enregistrer ]         │
     └─────────────────────────────────────────────────┘
     ```

8. **Changement du statut**
   - Le manager clique sur le menu déroulant "Statut"
   - Les options s'affichent :
     - Nouveau
     - En cours ← (le manager clique ici)
     - Terminé
   - Il sélectionne "En cours"
   - Le champ "Entreprise" devient obligatoire (si pas déjà rempli)

9. **Attribution à une entreprise**
   - Le manager clique sur le menu déroulant "Entreprise"
   - La liste des entreprises s'affiche :
     - SOMAROTRA
     - TRAVAUX PUBLICS MADA
     - ROUTE ET CONSTRUCTION ← (le manager clique ici)
     - INFRASTRUCTURE SA
   - Il sélectionne "ROUTE ET CONSTRUCTION"

10. **Enregistrement des modifications**
    - Le manager clique sur le bouton "Enregistrer"
    - Une requête PUT est envoyée à l'API :
      ```
      PUT http://localhost:3000/api/signalements/1
      Headers: { Authorization: "Bearer eyJhbGciOi..." }
      Body: {
        "statut": "en_cours",
        "entreprise": "ROUTE ET CONSTRUCTION"
      }
      ```
    - Le backend met à jour la base de données :
      ```sql
      UPDATE signalements 
      SET statut = 'en_cours', 
          entreprise = 'ROUTE ET CONSTRUCTION',
          updated_at = NOW()
      WHERE id = 1;
      ```
    - Le backend répond :
      ```json
      {
        "success": true,
        "message": "Signalement mis à jour avec succès"
      }
      ```
    - La modale se ferme automatiquement
    - Une notification verte s'affiche en haut à droite :
      ```
      ┌──────────────────────────────────────┐
      │ ✅ Signalement mis à jour avec succès │
      └──────────────────────────────────────┘
      ```
    - Le tableau se rafraîchit automatiquement
    - La ligne du signalement #1 disparaît (car le filtre "Nouveaux" est actif)

11. **Vérification sur la carte**
    - Le manager clique sur "📊 Tableau de bord" dans la sidebar
    - Il revient à la vue carte
    - Le marqueur du signalement #1 a changé de couleur :
      - Avant : 🔴 Rouge (nouveau)
      - Maintenant : 🟡 Jaune (en cours)

---

### Scénario 3 : Blocage d'un compte après 3 tentatives échouées

**Acteurs** : Utilisateur distrait, puis Manager administrateur

**Étapes détaillées** :

#### Phase 1 : Tentatives de connexion échouées

1. **Première tentative**
   - L'utilisateur arrive sur la page de connexion
   - Il tape son email : `utilisateur@example.com`
   - Il tape un mauvais mot de passe : `MotDePass` (oubli du "e123!")
   - Il clique sur "Se connecter"
   - Requête POST envoyée :
     ```
     POST http://localhost:3000/api/auth/login
     Body: {
       "email": "utilisateur@example.com",
       "password": "MotDePass"
     }
     ```
   - Le backend vérifie le mot de passe : ❌ Incorrect
   - Le backend incrémente le compteur `failed_attempts` dans la base :
     ```sql
     UPDATE users 
     SET failed_attempts = failed_attempts + 1 
     WHERE email = 'utilisateur@example.com';
     ```
   - Réponse du backend :
     ```json
     {
       "success": false,
       "message": "Email ou mot de passe incorrect",
       "remaining_attempts": 2
     }
     ```
   - Un message d'erreur s'affiche en rouge :
     ```
     ⚠️ Email ou mot de passe incorrect
     Il vous reste 2 tentatives avant le blocage de votre compte.
     ```

2. **Deuxième tentative**
   - L'utilisateur réessaie avec : `MotDePasse12` (oubli du "3!")
   - Clique sur "Se connecter"
   - Même processus : vérification échoue
   - Compteur passe à 2
   - Message affiché :
     ```
     ⚠️ Email ou mot de passe incorrect
     ⚠️ ATTENTION : Il vous reste 1 tentative avant le blocage !
     ```

3. **Troisième tentative (blocage)**
   - L'utilisateur tente encore : `MotDePasse1` (oubli du "23!")
   - Clique sur "Se connecter"
   - Le backend vérifie : ❌ Incorrect
   - Le compteur atteint 3
   - Le backend bloque automatiquement le compte :
     ```sql
     UPDATE users 
     SET failed_attempts = 3, 
         is_blocked = TRUE,
         blocked_at = NOW()
     WHERE email = 'utilisateur@example.com';
     ```
   - Réponse du backend :
     ```json
     {
       "success": false,
       "message": "Compte bloqué après 3 tentatives échouées",
       "blocked": true
     }
     ```
   - Message d'erreur affiché en rouge :
     ```
     🚫 Votre compte a été bloqué pour des raisons de sécurité.
     
     Raison : 3 tentatives de connexion échouées
     
     Veuillez contacter un administrateur pour débloquer votre compte.
     Email : support@signalements-antananarivo.mg
     ```
   - Le champ de mot de passe est désactivé
   - Le bouton "Se connecter" devient grisé (non cliquable)

4. **Tentative après blocage**
   - L'utilisateur essaie avec le BON mot de passe : `MotDePasse123!`
   - Clique sur "Se connecter"
   - Le backend détecte que `is_blocked = TRUE`
   - Même si le mot de passe est correct, la connexion est refusée :
     ```json
     {
       "success": false,
       "message": "Votre compte est bloqué. Contactez un administrateur."
     }
     ```

#### Phase 2 : Déblocage par le manager

1. **Connexion du manager administrateur**
   - Un manager se connecte avec ses identifiants
   - Il accède au tableau de bord
   - Il clique sur "👥 Utilisateurs" dans la sidebar

2. **Liste des utilisateurs**
   - Un tableau s'affiche avec tous les utilisateurs :
     ```
     ┌────┬───────────────────────────┬─────────┬──────────┬──────────────┐
     │ ID │ Email                     │ Rôle    │ Statut   │ Actions      │
     ├────┼───────────────────────────┼─────────┼──────────┼──────────────┤
     │ 1  │ admin@example.com         │ Admin   │ ✅ Actif │              │
     │ 2  │ manager@example.com       │ Manager │ ✅ Actif │              │
     │ 3  │ utilisateur@example.com   │ User    │ 🔒 Bloqué│ 🔓 Débloquer │
     │ 4  │ autre@example.com         │ User    │ ✅ Actif │              │
     └────┴───────────────────────────┴─────────┴──────────┴──────────────┘
     ```
   - Une icône 🔒 indique que le compte est bloqué
   - Un bouton "🔓 Débloquer" est disponible

3. **Déblocage du compte**
   - Le manager clique sur le bouton "🔓 Débloquer" pour l'utilisateur #3
   - Une boîte de dialogue de confirmation s'affiche :
     ```
     ┌───────────────────────────────────────────┐
     │ Débloquer le compte ?                      │
     │                                            │
     │ Utilisateur : utilisateur@example.com      │
     │ Raison du blocage : 3 tentatives échouées  │
     │ Bloqué depuis : 20/01/2026 10:30           │
     │                                            │
     │ [ Annuler ]          [ Confirmer ]         │
     └───────────────────────────────────────────┘
     ```
   - Le manager clique sur "Confirmer"

4. **Mise à jour dans la base**
   - Requête PUT envoyée :
     ```
     PUT http://localhost:3000/api/users/3/unblock
     Headers: { Authorization: "Bearer ..." }
     ```
   - Le backend exécute :
     ```sql
     UPDATE users 
     SET is_blocked = FALSE, 
         failed_attempts = 0,
         blocked_at = NULL
     WHERE id = 3;
     ```
   - Réponse :
     ```json
     {
       "success": true,
       "message": "Compte débloqué avec succès"
     }
     ```
   - Notification affichée :
     ```
     ✅ Le compte de utilisateur@example.com a été débloqué
     ```
   - Le tableau se rafraîchit :
     - Statut change : 🔒 Bloqué → ✅ Actif
     - Le bouton "Débloquer" disparaît

5. **Email de notification (optionnel)**
   - Le backend envoie automatiquement un email à l'utilisateur :
     ```
     De : noreply@signalements-antananarivo.mg
     À : utilisateur@example.com
     Objet : Votre compte a été débloqué

     Bonjour,

     Votre compte a été débloqué par un administrateur.

     Vous pouvez désormais vous reconnecter avec vos identifiants habituels.

     Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement
     notre support : support@signalements-antananarivo.mg

     Cordialement,
     L'équipe Signalements Antananarivo
     ```

6. **Reconnexion de l'utilisateur**
   - L'utilisateur retourne sur la page de connexion
   - Il entre ses identifiants corrects :
     - Email : `utilisateur@example.com`
     - Mot de passe : `MotDePasse123!`
   - Clique sur "Se connecter"
   - Le backend vérifie :
     - `is_blocked = FALSE` ✅
     - Mot de passe correct ✅
   - Connexion réussie !
   - L'utilisateur est redirigé vers la page d'accueil

---

### Scénario 4 : Synchronisation Mobile → Web (Firebase vers base locale)

**Acteurs** : Utilisateur mobile (sur le terrain) + Manager (sur le web)

**Étapes détaillées** :

#### Phase 1 : Création d'un signalement sur mobile

1. **Ouverture de l'application mobile**
   - L'utilisateur déverrouille son smartphone
   - Il tape sur l'icône de l'application "Signalements Route"
   - L'application s'ouvre sur l'écran de connexion
   - Il voit :
     ```
     ┌────────────────────────────┐
     │    🗺️ Signalements Route   │
     │                             │
     │   📧 Email                  │
     │   ┌─────────────────────┐  │
     │   │                     │  │
     │   └─────────────────────┘  │
     │                             │
     │   🔒 Mot de passe           │
     │   ┌─────────────────────┐  │
     │   │                     │  │
     │   └─────────────────────┘  │
     │                             │
     │   [  Se connecter  ]        │
     │                             │
     │   Pas de compte ?           │
     │   Créer un compte           │
     └────────────────────────────┘
     ```

2. **Connexion via Firebase**
   - L'utilisateur tape son email et mot de passe
   - Appuie sur "Se connecter"
   - L'application appelle Firebase Authentication :
     ```javascript
     firebase.auth().signInWithEmailAndPassword(email, password)
     ```
   - Firebase vérifie les identifiants
   - Si OK, un token est retourné et stocké localement
   - L'utilisateur est redirigé vers l'écran principal

3. **Écran principal avec carte**
   - La carte s'affiche centrée sur la position GPS actuelle de l'utilisateur
   - Un point bleu indique sa position
   - Un gros bouton flottant "+" est visible en bas à droite
   - Interface :
     ```
     ┌────────────────────────────┐
     │  ☰  Signalements Route  📍 │ ← En-tête
     ├────────────────────────────┤
     │                             │
     │      [Carte Leaflet]        │
     │                             │
     │         📍 (vous)           │
     │                             │
     │                             │
     │                             │
     │                       [+]  │ ← Bouton flottant
     └────────────────────────────┘
     ```

4. **Démarrage d'un nouveau signalement**
   - L'utilisateur appuie sur le bouton "+"
   - L'application passe en mode "Nouveau signalement"
   - L'écran change :
     ```
     ┌────────────────────────────┐
     │  ←  Nouveau signalement     │
     ├────────────────────────────┤
     │                             │
     │  📍 Localisation            │
     │  ┌─────────────────────┐   │
     │  │ GPS activé           │   │
     │  │ Lat: -18.8792        │   │
     │  │ Lng: 47.5079         │   │
     │  │                      │   │
     │  │ Adresse approx:      │   │
     │  │ Analakely, près du   │   │
     │  │ marché Petite Vitesse│   │
     │  └─────────────────────┘   │
     │                             │
     │  [ Continuer ]              │
     └────────────────────────────┘
     ```
   - Le GPS s'active automatiquement
   - L'application récupère la position :
     ```javascript
     const position = await Geolocation.getCurrentPosition();
     // { coords: { latitude: -18.8792, longitude: 47.5079 } }
     ```

5. **Prise de photo (optionnel)**
   - L'utilisateur appuie sur "Continuer"
   - L'écran suivant s'affiche :
     ```
     ┌────────────────────────────┐
     │  ←  Photo (optionnel)       │
     ├────────────────────────────┤
     │                             │
     │   [Aperçu photo vide]       │
     │                             │
     │   📸                        │
     │                             │
     │  [ Prendre une photo ]      │
     │                             │
     │  [ Passer cette étape ]     │
     └────────────────────────────┘
     ```
   - Il appuie sur "Prendre une photo"
   - L'appareil photo natif s'ouvre
   - L'utilisateur cadre le nid-de-poule
   - Il appuie sur le déclencheur
   - La photo est capturée
   - Retour à l'application avec prévisualisation :
     ```
     ┌────────────────────────────┐
     │  ←  Photo (optionnel)       │
     ├────────────────────────────┤
     │                             │
     │  [Photo du nid-de-poule]    │
     │                             │
     │  [ Reprendre ]  [ OK ]      │
     │                             │
     │  [ Passer cette étape ]     │
     └────────────────────────────┘
     ```
   - Il appuie sur "OK"

6. **Remplissage des informations**
   - L'écran suivant affiche le formulaire :
     ```
     ┌────────────────────────────┐
     │  ←  Informations            │
     ├────────────────────────────┤
     │                             │
     │  📝 Description             │
     │  ┌─────────────────────┐   │
     │  │ Nid-de-poule        │   │
     │  │ profond qui occupe  │   │
     │  │ toute la chaussée   │   │
     │  └─────────────────────┘   │
     │                             │
     │  📐 Surface estimée (m²)    │
     │  ┌─────────────────────┐   │
     │  │ 25                  │   │
     │  └─────────────────────┘   │
     │                             │
     │  🔧 Type de problème        │
     │  ┌─────────────────────┐   │
     │  │ ▼ Nid-de-poule      │   │
     │  └─────────────────────┘   │
     │                             │
     │  [ Annuler ] [ Envoyer ]    │
     └────────────────────────────┘
     ```
   - L'utilisateur remplit les champs :
     - Description : tape "Nid-de-poule profond qui occupe toute la chaussée"
     - Surface : tape "25"
     - Type : sélectionne "Nid-de-poule" dans la liste

7. **Envoi vers Firebase**
   - L'utilisateur appuie sur "Envoyer"
   - Un spinner de chargement s'affiche : "⏳ Envoi en cours..."
   - L'application envoie les données à Firebase :
     ```javascript
     // 1. Upload de la photo dans Firebase Storage
     const photoRef = storage.ref(`signalements/${Date.now()}.jpg`);
     await photoRef.put(photoBlob);
     const photoURL = await photoRef.getDownloadURL();

     // 2. Enregistrement dans Firestore
     await firestore.collection('signalements').add({
       latitude: -18.8792,
       longitude: 47.5079,
       date: firebase.firestore.Timestamp.now(),
       description: "Nid-de-poule profond qui occupe toute la chaussée",
       surface: 25,
       type: "nid-de-poule",
       photo_url: photoURL,
       user_id: currentUser.uid,
       synced: false,  // Pas encore synchronisé avec le web
       created_at: firebase.firestore.Timestamp.now()
     });
     ```
   - Firebase Firestore enregistre le document
   - Un ID unique est généré automatiquement (ex: `Zf8xK3pQr2mN`)
   - Notification de succès :
     ```
     ✅ Signalement envoyé avec succès !
     ```
   - Retour à l'écran principal
   - Le nouveau signalement est visible sur la carte (marqueur rouge)

#### Phase 2 : Synchronisation côté web

8. **Le manager accède à l'interface de synchronisation**
   - Le manager est connecté sur l'application web
   - Il clique sur "🔄 Synchronisation" dans la sidebar
   - La page de synchronisation s'affiche :
     ```
     ┌────────────────────────────────────────────────┐
     │ 🔄 Synchronisation Firebase → Base locale      │
     ├────────────────────────────────────────────────┤
     │                                                 │
     │ Cette fonctionnalité permet de récupérer les   │
     │ signalements créés via l'application mobile.   │
     │                                                 │
     │ Dernière synchronisation :                      │
     │ 🕐 20/01/2026 à 09:30 (il y a 2 heures)       │
     │                                                 │
     │ État de Firebase :                              │
     │ ✅ Connecté                                     │
     │ 📊 3 nouveaux signalements détectés            │
     │                                                 │
     │ [ Prévisualiser ] [ Synchroniser maintenant ]   │
     │                                                 │
     │ ⚠️ Note : Cette action est irréversible        │
     └────────────────────────────────────────────────┘
     ```

9. **Prévisualisation (optionnel)**
   - Le manager clique sur "Prévisualiser"
   - Une requête est envoyée au backend :
     ```
     GET http://localhost:3000/api/sync/preview
     ```
   - Le backend interroge Firebase :
     ```javascript
     const snapshot = await firestore
       .collection('signalements')
       .where('synced', '==', false)
       .get();
     ```
   - Le backend répond avec la liste des signalements non synchronisés :
     ```json
     {
       "count": 3,
       "signalements": [
         {
           "id": "Zf8xK3pQr2mN",
           "date": "2026-01-20T11:45:00",
           "description": "Nid-de-poule profond...",
           "surface": 25,
           "latitude": -18.8792,
           "longitude": 47.5079
         },
         ...
       ]
     }
     ```
   - Un tableau de prévisualisation s'affiche :
     ```
     ┌─────────────┬──────────────┬────────────────────┬─────────┐
     │ Date        │ Adresse      │ Description        │ Surface │
     ├─────────────┼──────────────┼────────────────────┼─────────┤
     │ 20/01 11:45 │ Analakely    │ Nid-de-poule...    │ 25 m²   │
     │ 20/01 10:30 │ Ambohijatovo │ Affaissement...    │ 30 m²   │
     │ 19/01 16:20 │ Tsaralalana  │ Fissure profonde.. │ 15 m²   │
     └─────────────┴──────────────┴────────────────────┴─────────┘

     Total : 3 signalements (70 m²)

     [ Retour ] [ Continuer avec la synchronisation ]
     ```

10. **Lancement de la synchronisation**
    - Le manager clique sur "Synchroniser maintenant"
    - Une boîte de dialogue de confirmation s'affiche :
      ```
      ┌──────────────────────────────────────┐
      │ Confirmer la synchronisation ?        │
      │                                       │
      │ 3 signalements seront importés        │
      │ depuis Firebase vers la base locale.  │
      │                                       │
      │ [ Annuler ]        [ Confirmer ]      │
      └──────────────────────────────────────┘
      ```
    - Le manager clique sur "Confirmer"

11. **Processus de synchronisation**
    - Requête POST envoyée :
      ```
      POST http://localhost:3000/api/sync/execute
      Headers: { Authorization: "Bearer ..." }
      ```
    - Une barre de progression s'affiche :
      ```
      🔄 Synchronisation en cours...

      [████████████████████░░░░░░░░] 75%

      • Récupération depuis Firebase... ✅
      • Téléchargement des photos... ✅
      • Insertion dans la base de données... 🔄
      • Marquage comme synchronisé... ⏳

      2 / 3 signalements traités
      ```

    - Le backend exécute les étapes suivantes :

      **Étape 1 : Récupération depuis Firebase**
      ```javascript
      const snapshot = await firestore
        .collection('signalements')
        .where('synced', '==', false)
        .get();

      const signalements = snapshot.docs.map(doc => ({
        firebase_id: doc.id,
        ...doc.data()
      }));
      ```

      **Étape 2 : Téléchargement des photos**
      ```javascript
      for (let sig of signalements) {
        if (sig.photo_url) {
          // Télécharger la photo depuis Firebase Storage
          const response = await fetch(sig.photo_url);
          const blob = await response.blob();
          
          // Sauvegarder localement
          const localPath = `/uploads/${sig.firebase_id}.jpg`;
          await fs.writeFile(localPath, blob);
          
          sig.photo_local = localPath;
        }
      }
      ```

      **Étape 3 : Insertion dans la base locale**
      ```javascript
      for (let sig of signalements) {
        await db.query(`
          INSERT INTO signalements 
          (latitude, longitude, date, statut, surface, description, photo_url, firebase_id)
          VALUES (?, ?, ?, 'nouveau', ?, ?, ?, ?)
        `, [
          sig.latitude,
          sig.longitude,
          sig.date,
          sig.surface,
          sig.description,
          sig.photo_local,
          sig.firebase_id
        ]);
      }
      ```

      **Étape 4 : Marquage comme synchronisé dans Firebase**
      ```javascript
      const batch = firestore.batch();
      for (let sig of signalements) {
        const docRef = firestore.collection('signalements').doc(sig.firebase_id);
        batch.update(docRef, { synced: true, synced_at: firebase.firestore.Timestamp.now() });
      }
      await batch.commit();
      ```

12. **Fin de la synchronisation**
    - La barre de progression atteint 100%
    - Message de succès :
      ```
      ✅ Synchronisation terminée avec succès !

      📊 Résumé :
      • 3 signalements importés
      • 2 photos téléchargées
      • 0 erreur

      Les nouveaux signalements sont maintenant visibles sur la carte.

      [ OK ]
      ```
    - Le manager clique sur "OK"

13. **Vérification sur la carte**
    - Le manager clique sur "📊 Tableau de bord"
    - La carte se rafraîchit automatiquement
    - 3 nouveaux marqueurs rouges apparaissent aux emplacements :
      - Analakely (-18.8792, 47.5079)
      - Ambohijatovo
      - Tsaralalana
    - Le tableau de récapitulatif se met à jour :
      ```
      Nombre total de signalements : 153 (+3)
      Surface totale : 3 820 m² (+70)
      Budget total : 764 000 000 Ar (+14 000 000)
      ```

14. **Notification aux utilisateurs mobiles (optionnel)**
    - Le système envoie une notification push à l'utilisateur mobile :
      ```
      📱 Notification
      🗺️ Signalements Route
      
      Votre signalement a été synchronisé et est maintenant visible 
      sur l'application web. Merci pour votre contribution !
      ```

---

## 3. Flux de données techniques

### 3.1 Authentification
```
User → Frontend → Backend API → Base de données → Token JWT → Frontend → LocalStorage
```

### 3.2 Affichage des signalements
```
Frontend → GET /api/signalements → Backend → SELECT * FROM signalements → JSON → Frontend → Leaflet markers
```

### 3.3 Modification de statut
```
Manager → PUT /api/signalements/{id} → Backend → UPDATE signalements → Confirmation → Refresh UI
```

### 3.4 Synchronisation Firebase
```
Mobile → Firebase Firestore → Backend (cron job ou manuel) → Base locale → Frontend refresh
```

---

## 4. Résumé des technologies

| Composant | Technologies |
|-----------|-------------|
| Backend API | Node.js, Express, JWT, bcrypt |
| Base de données | PostgreSQL/MySQL |
| Frontend Web | Ionic, React, Leaflet.js |
| App Mobile | Ionic, Vue.js, Capacitor |
| Authentification Mobile | Firebase Authentication |
| Stockage Mobile | Firebase Firestore + Storage |
| Serveur de tuiles | Docker, PostgreSQL+PostGIS, Mapnik |
| Données cartographiques | OpenStreetMap (Madagascar 361 MB) |

---

**Date de création** : 20 janvier 2026  
**Version** : 2.0 (détaillée)  
**Auteur** : Équipe Signalements Antananarivo
