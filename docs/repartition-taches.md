# Répartition des Tâches - Suivi des Travaux Routiers à Antananarivo

## 👥 Membres de l'équipe

| Identifiant | Nom complet | Rôle principal | Responsabilités |
|-------------|-------------|----------------|-----------------|
| **ETU003264** | ANDRIATSARA Iratra Fernand | Backend Lead + Frontend Web | API REST, Base de données, Frontend Web, Documentation |
| **ETU003332** | RABADRIANASOLO Tafita Fitia | Firebase Lead + Mobile | Firebase, Application Mobile Ionic/Vue, Synchronisation |
| **ETU001532** | ANDRIAMORIA Jennifer Kanto | DevOps + Infrastructure | Docker, Serveur de tuiles, Module Carte, Infrastructure |

---

## 📋 Vue d'ensemble des tâches

### Statistiques globales
- **Total des tâches** : 60 tâches
- **Tâches ETU003264** (Iratra) : 22 tâches
- **Tâches ETU003332** (Tafita) : 22 tâches
- **Tâches ETU001532** (Jennifer) : 16 tâches

### Répartition par scénario
- **Scénario 1** (Visiteur sans connexion) : 15 tâches
- **Scénario 2** (Manager modifie statut) : 14 tâches
- **Scénario 3** (Blocage après 3 tentatives) : 10 tâches
- **Scénario 4** (Synchronisation Mobile→Web) : 21 tâches

### Légende des statuts
- ✅ **Terminé** : Tâche complétée
- 🔄 **En cours** : Tâche en développement
- ⏳ **À faire** : Tâche planifiée mais non démarrée
 | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **C-01** | Initialisation Github et Projet | **ETU003264** (Iratra) | ⏳ À faire | Tous |
| **C-02** | Répartition des tâches + Todo à faire | **ETU003264** (Iratra) | ✅ Terminé | Tous |
| **C-03** | Configuration du Projet Firebase | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4 |
| **C-04** | Initialisation Environnement Docker | **ETU001532** (Jennifer) | ✅ Terminé | Scénario 1 |

### 1.2 Module Carte (Setup)

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **C-05** | Télécharger & importer données OSM Antananarivo | **ETU001532** (Jennifer) | ✅ Terminé | Scénario 1 |
| **C-06** | Test affichage des tiles depuis serveur local | **ETU001532** (Jennifer) | ✅ Terminé | Scénario 1 |

### 1.3 Setup Frontend

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **C-07** | Setup projet Web (React) | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 1, 2, 3 |
| **C-08** | Initialisation projet Mobile (Ionic/Vue) | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4|

### 1.3 Setup Frontend

| ID | Tâche | Responsable(s) | Statut | Couvert par scénario |
|----|-------|----------------|--------|---------------------|
| **C-07** | Setup projet Web (React + Ionic) | **À assigner** | 📝 Partiellement | Scénarios 1, 2 (Web) |
| **C-08** | Initialisation projet Mobile (Ionic/Vue) | **À assigner** | 📝 Partiellement | Scénario 4 (Mobile) |
 | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **D-01** | MCD final | **ETU003264** (Iratra) | ⏳ À faire | Tous |
| **D-02** | Architecture technique | **ETU001532** (Jennifer) | ✅ Terminé | Tous |
| **D-03** | Documentation API via Swagger | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 1, 2, 3, 4 |

### 2.2 Documentation utilisateur

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **D-04** | Scénarios d'utilisation + captures d'écran | **ETU003264** (Iratra) | ✅ Terminé | Tous |
| **D-05** | Liste des membres (Nom, Prénom, NumETU) | **ETU003264** (Iratra) | ✅ Terminé

### 2.2 Documentation utilisateur

| ID | Tâche | Responsable(s) | Statut | Couvert par scénario |
|----|-------|----------------|--------|---------------------|
| **D-04** | Scénarios d'utilisation + captures d'écran | ETU003264 | ✅ Documenté | Scénarios 1, 2, 3, 4 (complet) |
| **D-05** | Liste des membres (Nom, Prénom, NumETU) | ETU003264 | ⬜ Hors scénarios | - |
 | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **DB-01** | Conception des tables d'authentification et utilisateurs | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 2, 3 |
| **DB-02** | Configuration avec Firebase | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4 |
| **DB-03** | Insertion des types (Visiteur, Utilisateur, Manager) | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 2, 3
### 3.1 Conception de la base de données

| ID | Tâche | Responsable(s) | Statut | Couvert par scénario |
|----|-------|----------------|--------|---------------------|
| **DB-01** | Conception des tables d'authentification et utilisateurs | ETU003264 | ✅ Documenté | Scénarios 2, 3 (Table users) |
| **DB-02** | Configuration de la base Firebase (Firestore) | ETU003332 | ✅ Documenté | Scénario 4 (Collection signalements) |
| **DB-03** | Création du schéma de base local (PostgreSQL/MySQL) | ETU003264 | ✅ Documenté | Scénarios 1, 2 (Table signalements) |

---

## 🔐 Phase 4 : Module Authentification (Priorité : Critique)

### 4.1 Backend API - Authentification

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **AUTH-01** | Inscription des utilisateurs | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 2, 3 |
| **AUTH-02** | Authentification des utilisateurs | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 2, 3 |
| **AUTH-03** | Modification des informations utilisateurs | **ETU003264** (Iratra) | ⏳ À faire | Scénario 2 |
| **AUTH-04** | Réinitialisation du blocage | **ETU003264** (Iratra) | ⏳ À faire | Scénario 3 |
| **AUTH-05** | Gestion de tentatives de connexion | **ETU003264** (Iratra) | ⏳ À faire | Scénario 3 |
| **AUTH-06** | Blocage temporaire d'utilisateur si dépassement de tentative | **ETU003264** (Iratra) | ⏳ À faire | Scénario 3 |
| **AUTH-07** | Tests unitaires Authentification | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 2, 3 |

### 4.2 Frontend Web - Authentification

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **AUTH-08** | Page / formulaire de connexion | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 2, 3 |
| **AUTH-09** | Creation formulaire d'inscription | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 2, 3 |
| **AUTH-10** | Routing selon profils (Visiteur / Utilisateur / Manager) | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 1, 2, 3 |

### 4.3 Frontend Mobile - Authentification

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **AUTH-11** | Connexion via Firebase Auth | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4 |
| **AUTH-12** | Authentification Firebase auth | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4 |

---

## 🗺️ Phase 5 : Module Carte (Priorité : Haute)
& Signalements (Priorité : Haute)

### 5.1 Backend API - Signalements

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **SIG-01** | Liste données routiers filtrés | **ETU003264** (Iratra) | ⏳ À faire | Scénario 1 |
| **SIG-02** | Donnée problème par id | **ETU003264** (Iratra) | ⏳ À faire | Scénario 1 |
| **SIG-03** | Liste des signalements | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 1, 2 |
| **SIG-04** | Modification Statut Signalement | **ETU003264** (Iratra) | ⏳ À faire | Scénario 2 |
| **SIG-05** | Gestions des informations signalements | **ETU003264** (Iratra) | ⏳ À faire | Scénario 2 |
| **SIG-06** | Liste récapitulatif | **ETU003264** (Iratra) | ⏳ À faire | Scénario 1 |
| **SIG-07** | Endpoints statistiques GET /stats | **ETU003264** (Iratra) | ⏳ À faire | Scénario 1 |

### 5.2 Frontend Web - Carte

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **MAP-01** | Leaflet : affichage carte de base | **ETU001532** (Jennifer) | ⏳ À faire | Scénarios 1, 2 |
| **MAP-02** | Connexion Leaflet au serveur offline | **ETU001532** (Jennifer) | ⏳ À faire | Scénarios 1, 2 |
| **MAP-03** | Affichage marquers signalements | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 1, 2 |
| **MAP-04** | Affichage details au survol | **ETU003264** (Iratra) | ⏳ À faire | Scénario 1 |

### 5.3 Frontend Mobile - Carte & Signalements

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **MOB-01** | Carte mobile + tuiles OpenStreetMap | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4 |
| **MOB-02** | Géolocalisation GPS utilisateur | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4 |
| **� Phase 6 : Module Web Dashboard Manager (Priorité : Haute)

### 6.1 Backend API - Gestion Manager

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **MGR-01** | Liste personnes bloqués | **ETU003264** (Iratra) | ⏳ À faire | Scénario 3 |
| **MGR-02** | Débloquer les utilisateurs bloqués | **ETU003264** (Iratra) | ⏳ À faire | Scénario 3 |
| **MGR-03** | Synchronisation avec Firebase | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4 |

### 6.2 Frontend Web - Dashboard Manager

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **WEB-01** | Page récapitulatif | **ETU003264** (Iratra) | ⏳ À faire | Scénario 1 |
| **WEB-02** | Interface Dashboard Manager | **ETU003264** (Iratra) | ⏳ À faire | Scénarios 2, 3 |
| **WEB-03** | Formulaire de gestion (surface, budget, entreprise) | **ETU003264** (Iratra) | ⏳ À faire | Scénario 2 |
| **WEB-04** | Bouton de synchronisation | **ETU001532** (Jennifer) | ⏳ À faire | Scénario 4 |
| **WEB-05** | Design responsive (mobile / tablette / desktop) | **ETU003264** (Iratra) | ⏳ À faire | Tous
### 6.2 Frontend Mobile - Signalement

| ID� Phase 7 : Déploiement & Tests (Priorité : Moyenne)

### 7.1 Build & Packaging

| ID | Tâche | Responsable | Statut | Scénario concerné |
|----|-------|-------------|--------|-------------------|
| **DEP-01** | Build APK signé | **ETU003332** (Tafita) | ⏳ À faire | Scénario 4 |
| **DEP-02** | Tests end-to-end tous scénarios | **Tous** | ⏳ À faire | Tous8: Tableau récap) |
| **WEB-07** | Endpoints statistiques GET /stats | **À assigner** | 📝 Partiellement | Scénario 1 (Calculs automatiques) |

### 7.2 Frontend Web - Dashboard

| ID | Tâche | Responsable(s) | Statut | Couvert par scénario |
|----|-------|----------------|--------|---------------------|
| **WEB-08** | Page récapitulatif (tableau statistiques) | **À assigner** | ✅ Documenté | Scénario 1 (Tableau 150 signalements) |
| **WEB-09** | Interface Dashboard Manager | **À assigner** | ✅ Documenté | Scénario 2 (Étapes 4-5: Sidebar + tableau) |
| **WEB-10** | Formulaire de gestion (surface, budget, entreprise) | **À assigner** | ✅ Documenté | Scénario 2 (Étape 7: Modale modification) |
| **WEB-11** | Bouton de synchronisation avec Firebase | **À assigner** | ✅ Documenté | Scénario 4 (Étapes 8-12: Prévisualisation + sync) |
| **WEB-12** | Design responsive (mobile / tablette / desktop) | **À assigner** | ⬜ Hors scénarios | - |

---

## 🚀 Phase 8 : Déploiement (Priorité : Moyenne)

### 8.1 Build & Packaging

---

## 📊 Répartition détaillée par membre

### 👤 ETU003264 - ANDRIATSARA Iratra Fernand (22 tâches)
**Domaine** : Backend API REST + Frontend Web + Documentation

#### Setup & Documentation (5 tâches)
- C-01 : Initialisation Github et Projet
- C-02 : Répartition des tâches + Todo ✅
- C-07 : Setup projet Web (React)
- D-01 : MCD final
---

## 🎯� Scénario 1 : Visiteur (sans connexion) - 15 tâches

**Responsable principal** : ETU003264 (Iratra) + ETU001532 (Jennifer)

| Tâche | Responsable | Phase |
|-------|-------------|-------|
| C-04 : Docker serveur tuiles | **ETU001532** ✅ | Infrastructure |
| C-05 : Import OSM Antananarivo | **ETU001532** ✅ | Infrastructure |
| C-06 : Test tiles | **ETU001532** ✅ | Infrastructure |
| C-07 : Setup Web React | **ETU003264** | Frontend |
| MAP-01 : Leaflet carte base | **ETU001532** | Frontend Carte |
| MAP-02 : Connexion serveur offline | **ETU001532** | Frontend Carte |
| SIG-01 : Liste données filtrés | **ETU003264** | Backend API |
| SIG-02 : Donnée par id | **ETU003264** | Backend API |
| SIG-03 : Liste signalements | **ETU003264** | Backend API |
| SIG-06 : Liste récapitulatif | **ETU003264** | Backend API |
| SIG-07 : GET /stats | **ETU003264** | Backend API |
| MAP-03 : Affichage marquers | **ETU003264** | Frontend Carte |
| MAP-04 : Détails au survol | **ETU003264** | Frontend Carte |
| WEB-01 : Page récapitulatif | **ETU003264** | Frontend Web |
| AUTH-10 : Routing profils | **ETU003264** | Frontend Web |

---

### 📋 Scénario 2 : Manager modifie un statut - 14 tâches

**Responsable principal** : ETU003264 (Iratra)

| Tâche | Responsable | Phase |
|-------|-------------|-------|
| DB-01 : Tables authentification | **ETU003264** | Base de données |
| DB-03 : Types utilisateurs | **ETU003264** | Base de données |
| AUTH-01 : Inscription | **ETU003264** | Backend Auth |
| AUTH-02 : Authentification | **ETU003264** | Backend Auth |
| AUTH-03 : Modification infos | **ETU003264** | Backend Auth |
| AUTH-08 : Page connexion | **ETU003264** | Frontend Auth |
| AUTH-10 : Routing profils | **ETU003264** | Frontend Auth |
| SIG-03 : Liste signalements | **ETU003264** | Backend API |
| SIG-04 : Modification statut | **ETU003264** | Backend API |
| SIG-05 : Gestion infos | **ETU003264** | Backend API |
| WEB-02 : Dashboard Manager | **ETU003264** | Frontend Web |
| WEB-03 : Formulaire gestion | **ETU003264** | Frontend Web |
| MAP-03 : Affichage marquers | **ETU003264** | Frontend Carte |
| D-03 : Swagger | **ETU003264** | Documentation |

---

### 📋 Scénario 3 : Blocage après 3 tentatives - 10 tâches

**Responsable principal** : ETU003264 (Iratra)

| Tâche | Responsable | Phase |
|-------|-------------|-------|
| DB-01 : Tables authentification | **ETU003264** | Base de données |
| AUTH-02 : Authentification | **ETU003264** | Backend Auth |
| AUTH-04 : Réinitialisation blocage | **ETU003264** | Backend Auth |
| AUTH-05 : Gestion tentatives | **ETU003264** | Backend Auth |
| AUTH-06 : Blocage temporaire | **ETU003264** | Backend Auth |
| AUTH-07 : Tests authentification | **ETU003264** | Backend Auth |
| AUTH-08 : Page connexion | **ETU003264** | Frontend Auth |
| MGR-01 : Liste bloqués | **ETU003264** | Backend Manager |
| MGR-02 : Débloquer utilisateurs | **ETU003264** | Backend Manager |
| WEB-02 : Dashboard Manager | **ETU003264** | Frontend Web |

---

### 📋 Scénario 4 : Synchronisation Mobile → Web - 21 tâches

**Responsable principal** : ETU003332 (Tafita) + ETU001532 (Jennifer)

| Tâche | Responsable | Phase |
|-------|-------------|-------|
| C-03 : Config Firebase | **ETU003332** | Setup |
| C-08 : Init Mobile Ionic/Vue | **ETU003332** | Setup |
| DB-02 : Config Firebase | **ETU003332** | Base de données |
| AUTH-11 : Connexion Firebase | **ETU003332** | Auth Mobile |
| AUTH-12 : Auth Firebase | **ETU003332** | Auth Mobile |
| MOB-01 : Carte mobile | **ETU003332** | Mobile Carte |
| MOB-02 : GPS localisation | **ETU003332** | Mobile Carte |
| MOB-03 : Page liste | **ETU003332** | Mobile Signalement |
| MOB-04 : Page ajout | **ETU003332** | Mobile Signalement |
| MOB-05 : Carte + Liste | **ETU003332** | Mobile Signalement |
| MOB-06 : Formulaire + photo | **ETU003332** | Mobile Signalement |
| MOB-07 : Signalement localisation | **ETU003332** | Mobile Signalement |
| MOB-08 : Markers Firebase | **ETU003332** | Mobile Carte |
| MOB-09 : Tableau récap mobile | **ETU003332** | Mobile Interface |
| MOB-10 : Filtre mes signalements | **ETU003332** | Mobile Interface |
| MGR-03 : Sync avec Firebase | **ETU003332** | Backend Sync |
| WEB-04 : Bouton sync | **ETU001532** | Frontend Web |
| DEP-01 : Build APK | **ETU003332** | Déploiement |
| D-02 : Architecture ✅ | **ETU001532** | Documentation |

#### Application Mobile Complète (10 tâches)
- MOB-01 : Carte mobile + tuiles OpenStreetMap
- MOB-02 : Géolocalisation GPS utilisateur
- MOB-03 : Page signalement (liste)
- MOB-04 : Page signalement (ajout)
- MOB-05 : Carte + Liste des problèmes routiers
- MOB-06 : Formulaire de signalement + ajout photo
- MOB-07 : Signalement des problèmes routiers avec localisation
- MOB-08 : Carte avec markers depuis Firebase
- MOB-09 : Tableau récapitulatif mobile
- MOB-10 : Filtre « Mes signalements uniquement »

#### Synchronisation (1 tâche)
- MGR-03 : Synchronisation avec Firebase

#### Déploiement (1 tâche)
- DEP-01 : Build APK signé

---

### 👤 ETU001532 - ANDRIAMORIA Jennifer Kanto (16 tâches)
**Domaine** : DevOps + Infrastructure Docker + Serveur de tuiles + Module Carte

#### Setup Infrastructure (4 tâches)
- C-04 : Initialisation Environnement Docker ✅
- C-05 : Télécharger & importer données OSM Antananarivo ✅
- C-06 : Test affichage des tiles depuis serveur local ✅
- D-02 : Architecture technique ✅

#### Frontend Web - Carte (3 tâches)
- MAP-01 : Leaflet : affichage carte de base
- MAP-02 : Connexion Leaflet au serveur offline
- WEB-04 : Bouton de synchronisation

#### Tests (1 tâche)
- DEP-02 : Tests end-to-end (avec l'équipe)

---

## 📊 Statistiques de progression

### Par membre

| Membre | Tâches totales | Terminées | En cours | À faire | Progression |
|--------|---------------|-----------|----------|---------|-------------|
| **ETU003264** (Iratra) | 22 | 3 | 0 | 19 | 13.6% |
| **ETU003332** (Tafita) | 22 | 0 | 0 | 22 | 0% |
| **ETU001532** (Jennifer) | 16 | 4 | 0 | 12 | 25% |
| **TOTAL** | **60** | **7** | **0** | **53** | **11.7%** |

### Par scénario

| Scénario | Tâches | Terminées | Progression | Responsable principal |
|----------|--------|-----------|-------------|----------------------|
| **Scénario 1** | 15 | 3 | 20% | ETU003264 + ETU001532 |
| **Scénario 2** | 14 | 0 | 0% | ETU003264 |
| **Scénario 3** | 10 | 0 | 0% | ETU003264 |
| **Scénario 4** | 21 | 1 | 4.8% | ETU003332 + ETU001532 |

### Par phase

| Phase | Tâches | Terminées | Progression |
|-------|--------|-----------|-------------|
| Setup & Configuration | 8 | 5 | 62.5% |
| Documentation | 5 | 3 | 60% |
| Base de données | 3 | 0 | 0% |
| Authentification | 12 | 0 | 0% |
| Signalements Backend | 7 | 0 | 0% |
| Carte Frontend Web | 4 | 0 | 0% |
| Application Mobile | 10 | 0 | 0% |
| Dashboard Manager | 8 | 0 | 0% |
| Déploiement | 2 | 0 | 0% |

| ID | Tâche | Module | Suggestion |
|----|-------|--------|------------|
| C-07 | Setup projet Web (React + Ionic) | Setup | **→ ETU003264** |
| C-08 | Initialisation projet Mobile (Ionic/Vue) | Setup | **→ ETU003332** |
| AUTH-10 | Page / formulaire de connexion (Web) | Auth Web | **→ ETU003264** |
| AUTH-11 | Formulaire d'inscription (Web) | Auth Web | **→ ETU003264** |
| AUTH-12 | Routing selon profils | Auth Web | **→ ETU003264** |
| AUTH-13 | Authentification Firebase (Mobile) | Auth Mobile | **→ ETU003332** |

### Module Carte (7 tâches)

| ID | Tâche | Module | Suggestion |
|----|-------|--------|------------|
| MAP-04 | Leaflet : affichage carte de base | Carte Web | **→ ETU001532** |
| MAP-05 | Connexion Leaflet serveur offline | Carte Web | **→ ETU001532** |
| MAP-06 | Affichage marqueurs | Carte Web | **→ ETU003264** |
| MAP-07 | Détails au survolDocumentées dans les scénarios)

### Frontend Web - Documentées dans scénarios (7 tâches)

---

## 📅 Planning de développement (4 semaines)

### Semaine 1 : Infrastructure + Documentation + Scénario 1 (Partie 1)
**Objectif** : Fondations techniques + Carte visiteur

#### Jours 1-2 : Setup & Infrastructure
- **Jennifer** : C-04 ✅, C-05 ✅, C-06 ✅, MAP-01, MAP-02
- **Iratra** : C-01, C-07, D-01, D-03
- **Tafita** : C-03, C-08

#### Jours 3-5 : Backend API Signalements (Scénario 1)
- **Iratra** : DB-01, SIG-01, SIG-02, SIG-03, SIG-06, SIG-07
- **Jennifer** : Support infrastructure
- **Tafita** : DB-02 (Firebase)

#### Jours 6-7 : Frontend Web Carte (Scénario 1)
- **Iratra** : MAP-03, MAP-04, WEB-01
- **Jennifer** : MAP-01, MAP-02
- **Tafita** : Préparation mobile

**Livrable S1** : Carte web fonctionnelle pour visiteurs avec données backend

---

### Semaine 2 : Authentification + Scénarios 2 & 3
**Objectif** : Login, gestion utilisateurs, Dashboard Manager

#### Jours 1-3 : Backend Authentification
- **Iratra** : DB-03, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
- **Jennifer** : Support
- **Tafita** : Tests Firebase Auth

#### Jours 4-5 : Frontend Authentification & Manager
- **Iratra** : AUTH-08, AUTH-09, AUTH-10, WEB-02
- **Jennifer** : WEB-04
- **Tafita** : AUTH-11, AUTH-12

#### Jours 6-7 : Gestion Signalements Manager (Scénario 2)
- **Iratra** : SIG-04, SIG-05, WEB-03, MGR-01, MGR-02
- **Jennifer** : Tests
- **Tafita** : Préparation mobile

**Livrable S2** : Authentification complète + Dashboard Manager opérationnel

---

### Semaine 3 : Application Mobile Complète (Scénario 4)
**Objectif** : App mobile Ionic/Vue avec signalement + photo

#### Jours 1-2 : Setup & Carte Mobile
- **Tafita** : MOB-01, MOB-02, MOB-08
- **Iratra** : Support backend signalements
- **Jennifer** : Tests synchronisation

#### Jours 3-5 : Signalement Mobile
- **Tafita** : MOB-03, MOB-04, MOB-05, MOB-06, MOB-07
- **Iratra** : API endpoints manquants
- **Jennifer** : Tests

#### Jours 6-7 : Interface Mobile & Sync Firebase
- **Tafita** : MOB-09, MOB-10, MGR-03
- **Iratra** : Backend sync
- **Jennifer** : WEB-04 (Bouton sync), tests

**Livrable S3** : Application mobile fonctionnelle + synchronisation Firebase→Web

---

### Semaine 4 : Finalisations + Tests + Déploiement
**Objectif** : Polish, tests end-to-end, build APK

#### Jours 1-2 : Tests des 4 scénarios
- **Tous** : Tests end-to-end Scénarios 1, 2, 3, 4
- **Iratra** : Corrections backend
- **Tafita** : Corrections mobile
- **Jennifer** : Corrections infrastructure

#### Jours 3-4 : Polish & Responsive
- **Iratra** : WEB-05, AUTH-07, corrections
- **Tafita** : DEP-01 (Build APK)
- **Jennifer** : Tests finaux

#### Jours 5-7 : Documentation finale & Démo
- **Iratra** : Documentation complète API
- **Tafita** : Guide utilisation mobile
- **Jennifer** : Documentation technique
- **Tous** : DEP-02, préparation démo

**Livrable S4** : Application complète testée + APK + DocumentationOB-04, MOB-05, MOB-06, MOB-07
- Web Sync : WEB-01 (partagé)
- Déploiement : DEP-01
- Tests : DEP-03 (partagé)
Répartition recommandée (Basée uniquement sur les scénarios documentés)

### ETU003264 (Backend API + Frontend Web) - 16 tâches documentées

**Tâches couvertes par les scénarios** :
- ✅ **DB-01** : Table users (Scénarios 2, 3)
- ✅ **DB-03** : Table signalements (Scénarios 1, 2)
- ✅ **AUTH-03** : API Login POST /api/auth/login (Scénarios 2, 3)
- ✅ **AUTH-05** : Compteur failed_attempts (Scénario 3)
- ✅ **AUTH-07** : PUT /api/users/{id}/unblock (Scénario 3)
- ✅ **D-04** : Documentation 4 scénarios détaillés
- ✅ **MAP-01** : GET /api/signalements (Scénario 1)
- ✅ **MAP-02** : Filtres par statut/date/zone (Scénario 1)
- ✅ **AUTH-10** : Page formulaire connexion Web (Scénarios 2, 3)
- ✅ **MAP-06** : Marqueurs coloréscénario

### ✅ Scénario 1 : Visiteur consulte la carte (14 tâches)
- [x] **C-03** : Docker serveur tuiles opérationnel
- [x] **C-05** : Données OSM Antananarivo importées (361 MB)
- [x] **C-06** : Tiles accessibles sur localhost:8080
- [x] **D-02** : Architecture technique documentée
- [ ] **DB-03** : Table signalements créée (PostgreSQL/MySQL)
- [ ] **MAP-01** : API GET /api/signalements fonctionnelle
- [ ] **MAP-02** : Filtres par statut/date implémentés
- [ ] **MAP-04** : Leaflet initialisé sur Antananarivo
- [ ] **MAP-05** : Connexion serveur tuiles offline OK
- [ ] **MAP-06** : Marqueurs colorés affichés (rouge/jaune/vert)
- [ ] **MAP-07** : Popup au survol avec infos complètes
- [ ] **WEB-08** : Tableau statistiques (150 signalements, 3750m², budget)

**Progression** : 4/14 (28.6%)

---

### ⏳ Scénario 2 : Manager modifie statut (12 tâches)
- [x] **D-02** : Scénario 2 documenté (11 étapes détaillées)
- [ ] **DB-01** : Table users créée (id, email, password, role, failed_attempts, is_blocked)
- [ ] **DB-03** : Table signalements avec statut/entreprise
- [ ] **AUTH-03** : POST /api/auth/login avec JWT
- [ ] **AUTH-10** : Page formulaire connexion (email, password)
- [ ] **MAP-01** : GET /api/signalements pour liste manager
- [ ] **WEB-04** : PUT /api/signalements/{id} modifier statut
- [ ] **WEB-05** : Formulaire surface/budget/entreprise
- [ ] **WEB-09** : Dashboard Manager avec sidebar
- [ ] **WEB-10** : Modale modification signalement
- [ ] **WEB-11** : Notification succès après modification

**Progression** : 1/12 (8.3%)

---

### ⏳ Scénario 3 : Blocage après 3 tentatives (9 tâches)
- [x] **D-02** : Scénario 3 documenté (Phase 1 & 2, 6 étapes)
- [ ] **DB-01** : Champs failed_attempts + is_blocked
- [ ] **AUTH-03** : Login avec vérification compteur
- [ ] **AUTH-05** : Incrémentation compteur après échec
- [ ] **AUTH-06** : Blocage automatique si failed_attempts >= 3
- [ ] **AUTH-07** : PUT /api/users/{id}/unblock
- [ ] **AUTH-10** : Message d'erreur avec tentatives restantes
- [ ] **WEB-02** : API déblocage utilisateur
- [ ] **WEB-03** : Tableau utilisateurs bloqués (icône 🔒)

**Progression** : 1/9 (11.1%)

---

### ⏳ Scénario 4 : Synchronisation Mobile → Web (11 tâches)
- [x] **D-02** : Scénario 4 documenté (14 étapes, 2 phases)
- [ ] **C-02** : Firebase configuré (Auth + Firestore)
- [ ] **DB-02** : Collection Firestore signalements
- [ ] **AUTH-04** : firebase.auth().signInWithEmailAndPassword()
- [ ] **AUTH-13** : Écran connexion mobile Ionic
- [ ] **MAP-08** : Carte Leaflet mobile
- [ ] **MAP-09** : Capacitor Geolocation getCurrentPosition()
- [ ] **MOB-01** : firestore.collection().add()
- [ ] **MOB-03** : Page nouveau signalement
- [ ] **MOB-04** : Formulaire + Capacitor Camera
- [ ] **WEB-01** : Sync Firebase (4 étapes: récup, photos, insert, marquage)
- [ ] **WEB-11** : Bouton "Synchroniser maintenant"

**Progression** : 1/11 (9.1%)

---

## 📊 Progression globale des scénarios

| Scénario | Tâches | Terminées | En cours | Progression |
|----------|--------|-----------|----------|-------------|
| **Scénario 1** | 14 | 4 | 10 | 28.6% |
| **Scénario 2** | 12 | 1 | 11 | 8.3% |
| **Scénario 3** | 9 | 1 | 8 | 11.1% |
| **Scénario 4** | 11 | 1 | 10 | 9.1% |
| **TOTAL** | **35** | **4** | **31** | **11.4%** |

**Note** : Les 23 tâches restantes ne sont pas couvertes par les 4 scénarios documentés et ne sont donc pas listées ici collection signalements (Scénario 4)
- ✅ **AUTH-03** : API Login (Scénarios 2, 3) - partagé
- ✅ **AUTH-04** : firebase.auth().signInWithEmailAndPassword (Scénario 4)
- ✅ **WEB-01** : Synchronisation Firebase 4 étapes (Scénario 4)
- ✅ **AUTH-13** : Écran connexion mobile (Scénario 4)
- ✅ **MAP-08** : Carte mobile Leaflet (Scénario 4)
- ✅ **MAP-09** : getCurrentPosition() GPS (Scénario 4)
- ✅ **MOB-01** : firestore.collection().add() (Scénario 4)
- ✅ **MOB-03** : Page nouveau signalement (Scénario 4)
- ✅ **MOB-04** : Formulaire + Capacitor Camera (Scénario 4)

**Tâches NON couvertes** : C-08, D-01, D-03, AUTH-02, AUTH-09, MAP-03, MAP-10, MOB-02, MOB-05, MOB-06, MOB-07, DEP-01

---

### ETU001532 (DevOps + Infrastructure) - 8 tâches documentées

**Tâches couvertes par les scénarios** :
- ✅ **C-03** : Docker overv/openstreetmap-tile-server (Scénario 1) **[TERMINÉ]**
- ✅ **C-05** : Import region.osm.pbf 361 MB (Scénario 1) **[TERMINÉ]**
- ✅ **C-06** : Test tiles localhost:8080 (Scénario 1) **[TERMINÉ]**
- ✅ **D-02** : Architecture technique 4 scénarios (Tous) **[TERMINÉ]**
- ✅ **AUTH-06** : Blocage is_blocked=TRUE (Scénario 3)
- ✅ **WEB-01** : Sync Firebase (Scénario 4) - partagé
- ✅ **WEB-02** : PUT /api/users/{id}/unblock (Scénario 3)
- ✅ **WEB-03** : Tableau utilisateurs bloqués (Scénario 3)
- ✅ **MAP-04** : Leaflet init carte (Scénario 1)
- ✅ **MAP-05** : URL http://localhost:8080/tile/{z}/{x}/{y}.png (Scénario 1)
- ✅ **WEB-11** : Bouton "Synchroniser" (Scénario 4)

**Tâches NON couvertes** : AUTH-01, WEB-07, DEP-02

---

## 📌 Résumé de la répartition basée sur scénarios

| Membre | Tâches documentées | Tâches terminées | Tâches restantes | Tâches hors scénarios |
|--------|-------------------|------------------|------------------|---------------------|
| **ETU003264** | 16 | 1 (D-04) | 15 | 10 |
| **ETU003332** | 11 | 0 | 11 | 12 |
| **ETU001532** | 11 | 4 (C-03, C-05, C-06, D-02) | 7 | 3 |

**Total** : **35 tâches documentées** dans les 4 scénarios détaillés  
**Restant** : **23 tâches non couvertes** par les scénarios actuels
### Phase 2 : Documentation
- [x] Architecture technique documentée
- [x] Scénarios d'utilisation rédigés
- [ ] MCD finalisé et validé
- [ ] Swagger complet
- [ ] Liste des selon couverture des scénarios

#### Tâches documentées dans les 4 scénarios
- ✅ **Entièrement documentées** : 31 tâches (53.4%)
- 📝 **Partiellement documentées** : 4 tâches (6.9%)
- ⬜ **Non couvertes par scénarios** : 23 tâches (39.7%)

#### Par scénario
- **Scénario 1** (Visiteur carte) : 14 tâches documentées
- **Scénario 2** (Manager modif statut) : 12 tâches documentées
- **Scénario 3** (Blocage/déblocage) : 9 tâches documentées
- **Scénario 4** (Sync Mobile→Web) : 11 tâches documentées

#### Implémentation effective
- ✅ **Terminées** : 4 tâches (C-03, C-05, C-06, D-02)
- 📝 **Documentées mais non implémentées** : 31 tâches
- ⬜ **Non couvertes** : 23 tâches

#### Par membre (tâches documentées uniquement)
- **ETU003264** : 9 tâches documentées dans scénarios
- **ETU003332** : 8 tâches documentées dans scénarios
- **ETU001532** : 8 tâches documentées (4 terminées