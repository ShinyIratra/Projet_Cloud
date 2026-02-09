import express from 'express';
import webAuthController from '../controllers/webAuthController.js';
import webSignalementController from '../controllers/webSignalementController.js';
import syncController from '../controllers/syncController.js';
import { verifyToken, isManager } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Web Auth
 *     description: Authentification web via PostgreSQL (base locale)
 *   - name: Web Signalements
 *     description: Gestion des signalements via interface web
 *   - name: Synchronisation
 *     description: Synchronisation Firebase/Local
 */

/**
 * @swagger
 * /api/web/login:
 *   post:
 *     summary: Connexion utilisateur web
 *     tags: [Web Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Email ou mot de passe incorrect
 *       429:
 *         description: Trop de tentatives de connexion
 */
router.post('/login', webAuthController.login);

/**
 * @swagger
 * /api/web/register:
 *   post:
 *     summary: Inscription utilisateur web
 *     tags: [Web Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - displayName
 *               - type_user
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               displayName:
 *                 type: string
 *                 example: Jean Dupont
 *               type_user:
 *                 type: string
 *                 enum: [utilisateur, manager]
 *                 example: utilisateur
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/register', webAuthController.register);

/**
 * @swagger
 * /api/web/unblock:
 *   post:
 *     summary: Débloquer un utilisateur (Manager uniquement)
 *     tags: [Web Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: firebase-uid-here
 *     responses:
 *       200:
 *         description: Utilisateur débloqué
 *       403:
 *         description: Accès refusé (pas manager)
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/unblock', verifyToken, isManager, webAuthController.unblockUser);

/**
 * @swagger
 * /api/web/users/blocked:
 *   get:
 *     summary: Liste des utilisateurs bloqués (Manager uniquement)
 *     tags: [Web Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   uid:
 *                     type: string
 *                   email:
 *                     type: string
 *                   blockedAt:
 *                     type: string
 *                     format: date-time
 *       403:
 *         description: Accès refusé (pas manager)
 */
router.get('/users', verifyToken, isManager, webAuthController.getAllUsers);
router.get('/users/blocked', verifyToken, isManager, webAuthController.getBlockedUsers);

/**
 * @swagger
 * /api/web/user/update:
 *   put:
 *     summary: Modifier les informations de l'utilisateur connecté
 *     tags: [Web Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: Jean Dupont
 *               email:
 *                 type: string
 *                 example: nouveau-email@example.com
 *               password:
 *                 type: string
 *                 example: nouveauMotDePasse123
 *     responses:
 *       200:
 *         description: Informations modifiées avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/user/update', verifyToken, webAuthController.updateUserInfo);

/**
 * @swagger
 * /api/web/users/create:
 *   post:
 *     summary: Créer un nouvel utilisateur (Manager uniquement)
 *     tags: [Web Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: nouveauuser
 *               email:
 *                 type: string
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               type_user:
 *                 type: string
 *                 enum: [utilisateur, manager]
 *                 default: utilisateur
 *                 example: utilisateur
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (pas manager)
 */
router.post('/users/create', verifyToken, isManager, webAuthController.createUser);

// Signalements
/**
 * @swagger
 * /api/web/signalements:
 *   get:
 *     summary: Récupérer tous les signalements (Visiteurs)
 *     tags: [Web Signalements]
 *     responses:
 *       200:
 *         description: Liste des signalements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   surface:
 *                     type: number
 *                   budget:
 *                     type: number
 *                   status:
 *                     type: string
 *                   lattitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   date_alert:
 *                     type: string
 *                     format: date-time
 */
router.get('/signalements', webSignalementController.getAll);

/**
 * @swagger
 * /api/web/signalements:
 *   post:
 *     summary: Créer un nouveau signalement
 *     tags: [Web Signalements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - surface
 *               - budget
 *               - concerned_entreprise
 *               - lattitude
 *               - longitude
 *             properties:
 *               surface:
 *                 type: number
 *                 example: 100
 *               budget:
 *                 type: number
 *                 example: 5000000
 *               concerned_entreprise:
 *                 type: string
 *                 example: Entreprise ABC
 *               lattitude:
 *                 type: number
 *                 example: -18.8792
 *               longitude:
 *                 type: number
 *                 example: 47.5079
 *     responses:
 *       201:
 *         description: Signalement créé
 *       400:
 *         description: Données invalides
 */
router.post('/signalements', verifyToken, webSignalementController.create);

/**
 * @swagger
 * /api/web/signalements/stats:
 *   get:
 *     summary: Statistiques des signalements (Visiteurs)
 *     tags: [Web Signalements]
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 en_cours:
 *                   type: integer
 *                 termine:
 *                   type: integer
 *                 budget_total:
 *                   type: number
 */
router.get('/signalements/stats', webSignalementController.getStats);

/**
 * @swagger
 * /api/web/signalements:
 *   put:
 *     summary: Mettre à jour un signalement
 *     tags: [Web Signalements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *               surface:
 *                 type: number
 *               budget:
 *                 type: number
 *               status:
 *                 type: string
 *               concerned_entreprise:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signalement mis à jour
 *       404:
 *         description: Signalement non trouvé
 */
router.put('/signalements', verifyToken, webSignalementController.update);

/**
 * @swagger
 * /api/web/signalements/status:
 *   patch:
 *     summary: Changer le statut d'un signalement
 *     tags: [Web Signalements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [nouveau, en_cours, termine]
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       404:
 *         description: Signalement non trouvé
 */
router.patch('/signalements/status', verifyToken, isManager, webSignalementController.updateStatus);

/**
 * @swagger
 * /api/web/entreprises:
 *   get:
 *     summary: Liste des entreprises
 *     tags: [Web Signalements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des entreprises
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/entreprises', webSignalementController.getEntreprises);

/**
 * @swagger
 * /api/web/signalements/performance:
 *   get:
 *     summary: Données de performance et délais de traitement (Manager uniquement)
 *     tags: [Web Signalements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données de performance récupérées
 *       403:
 *         description: Accès refusé (pas manager)
 */
router.get('/signalements/performance', verifyToken, isManager, webSignalementController.getPerformance);

// Sync
/**
 * @swagger
 * /api/web/sync/from-firebase:
 *   post:
 *     summary: Synchroniser depuis Firebase vers local (Manager uniquement)
 *     tags: [Synchronisation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Synchronisation terminée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 synced:
 *                   type: integer
 *                   description: Nombre de signalements synchronisés
 *                 updated:
 *                   type: integer
 *                   description: Nombre de signalements mis à jour
 *       403:
 *         description: Accès refusé (pas manager)
 */
router.post('/sync/from-firebase', verifyToken, isManager, syncController.syncFromFirebase);

/**
 * @swagger
 * /api/web/sync/to-firebase:
 *   post:
 *     summary: Synchroniser vers Firebase (Manager uniquement)
 *     tags: [Synchronisation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Synchronisation terminée
 *       403:
 *         description: Accès refusé (pas manager)
 */
router.post('/sync/to-firebase', verifyToken, isManager, syncController.syncToFirebase);

/**
 * @swagger
 * /api/web/sync/users-to-firebase:
 *   post:
 *     summary: Synchroniser les utilisateurs vers Firebase (Manager uniquement)
 *     tags: [Synchronisation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Synchronisation des utilisateurs terminée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addedToFirebase:
 *                   type: integer
 *                   description: Nombre d'utilisateurs ajoutés à Firebase
 *                 updatedInFirebase:
 *                   type: integer
 *                   description: Nombre d'utilisateurs mis à jour dans Firebase
 *       403:
 *         description: Accès refusé (pas manager)
 */
router.post('/sync/users-to-firebase', verifyToken, isManager, syncController.syncUsersToFirebase);

export default router;
