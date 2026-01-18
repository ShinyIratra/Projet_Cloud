# Projet Cloud S5 - Signalement et Suivi des Travaux Routiers (Antananarivo)

![ETU](https://img.shields.io/badge/N°ETUDIANT-ETU003264-green)
![ETU](https://img.shields.io/badge/N°ETUDIANT-ETU003332-blue)
![ETU](https://img.shields.io/badge/N°ETUDIANT-ETU001532-pink)

## 📌 Présentation du Projet
Ce projet consiste à mettre en place une solution complète (Web, Mobile et API) permettant de signaler et de suivre l'évolution des travaux routiers dans la ville d'Antananarivo. 

L'application permet aux citoyens de signaler des problèmes et aux gestionnaires (Managers) de suivre le budget, la surface des travaux et l'état d'avancement des réparations.

## 🚀 Stack Technique
- **API (Fournisseur d'Identité) :** Node.js / Express 
- **Web :** Ionic / React.js
- **Mobile :** Ionic / Vue.js
- **Base de données :** PostgreSQL (Local) & Firebase (Cloud)
- **Cartographie :** Leaflet & OpenStreetMap (Serveur de tuiles offline via Docker)
- **Documentation API :** Swagger

## 🛠️ Fonctionnalités Principales

### 🔐 Module Authentification
- Connexion via Firebase (si internet) ou PostgreSQL local (si offline).
- Inscription et modification des informations utilisateurs.
- Gestion de la durée de vie des sessions.
- Limitation des tentatives de connexion (3 tentatives max, réinitialisable par API).

### 🗺️ Module Cartes
- Serveur de cartes offline sur Docker.
- Affichage de la ville d'Antananarivo et de ses rues via Leaflet.

### 🌐 Module Web (React)
- **Visiteur :** Visualisation de la carte, détails des problèmes au survol, tableau récapitulatif (surface totale, budget, avancement %).
- **Utilisateur :** Création de compte et connexion.
- **Manager :** Synchronisation des données (Firebase/Local), déblocage d'utilisateurs, gestion des détails des travaux (budget, entreprise, statut).

### 📱 Module Mobile (Ionic/Vue)
- Connexion via Firebase.
- Signalement de problèmes routiers par géolocalisation sur carte.
- Filtre pour afficher uniquement ses propres signalements.

## 📦 Installation

### Backend (API avec Express)
1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-compte/projet-cloud-s5.git
   ```
2. Naviguer dans le répertoire du backend :
   ```bash
   cd projet-cloud-s5/backend
   ```
3. Installer les dépendances :
   ```bash
   npm install
   ```
4. Démarrer le serveur :
   ```bash
   npm start
   ```
5. Accéder à l'API :
   - Documentation Swagger disponible sur `http://localhost:5000/api-docs`

### Frontend Web (Ionic/React)
1. Naviguer dans le répertoire du frontend-web :
   ```bash
   cd projet-cloud-s5/frontend-web/roadAlert
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Démarrer le serveur de développement Ionic :
   ```bash
   ionic serve
   ```
4. Accéder à l'application :
   - Ouvrir un navigateur et aller sur `http://localhost:8100`

### Frontend Mobile (Ionic/Vue)
1. Naviguer dans le répertoire du frontend-mobile :
   ```bash
   cd projet-cloud-s5/frontend-mobile/roadAlert
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Démarrer l'application mobile avec Ionic :
   ```bash
   ionic serve
   ```
4. Tester sur un appareil ou un émulateur :
   - Suivre les instructions dans la documentation Ionic pour déployer sur un appareil physique ou un simulateur.