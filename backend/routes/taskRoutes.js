import express from 'express';
import TaskController from '../controllers/TaskController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Gestion des travaux et suivi d'avancement
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique du travail
 *         titre:
 *           type: string
 *           description: Titre du travail
 *         description:
 *           type: string
 *           description: Description détaillée
 *         statut:
 *           type: string
 *           enum: [nouveau, en_cours, termine]
 *           description: Statut du travail
 *         avancement_pourcentage:
 *           type: integer
 *           description: Pourcentage d'avancement (0, 50 ou 100)
 *         date_debut:
 *           type: string
 *           format: date-time
 *           description: Date de début du travail
 *         date_fin:
 *           type: string
 *           format: date-time
 *           description: Date de fin réelle
 *         date_prevue_fin:
 *           type: string
 *           format: date-time
 *           description: Date prévue de fin
 *         duree_jours:
 *           type: number
 *           description: Durée en jours
 *         en_retard:
 *           type: boolean
 *           description: Indique si le travail est en retard
 *     Statistics:
 *       type: object
 *       properties:
 *         total_travaux:
 *           type: integer
 *         travaux_nouveaux:
 *           type: integer
 *         travaux_en_cours:
 *           type: integer
 *         travaux_termines:
 *           type: integer
 *         avancement_moyen:
 *           type: number
 *         delai_moyen_jours:
 *           type: number
 *         delai_min_jours:
 *           type: number
 *         delai_max_jours:
 *           type: number
 */

// =====================
// ROUTES CRUD
// =====================

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Créer un nouveau travail
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titre
 *             properties:
 *               titre:
 *                 type: string
 *               description:
 *                 type: string
 *               statut:
 *                 type: string
 *                 enum: [nouveau, en_cours, termine]
 *                 default: nouveau
 *               date_debut:
 *                 type: string
 *                 format: date-time
 *               date_fin:
 *                 type: string
 *                 format: date-time
 *               date_prevue_fin:
 *                 type: string
 *                 format: date-time
 *               id_signalement:
 *                 type: integer
 *               id_entreprise:
 *                 type: integer
 *               id_users_responsable:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Travail créé avec succès
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/tasks', TaskController.createTask);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Récupérer tous les travaux avec leur avancement
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Liste des travaux
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: Erreur serveur
 */
router.get('/tasks', TaskController.getAllTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Récupérer un travail par son ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du travail
 *     responses:
 *       200:
 *         description: Détails du travail
 *       404:
 *         description: Travail non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/tasks/:id', TaskController.getTaskById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Mettre à jour un travail
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               description:
 *                 type: string
 *               statut:
 *                 type: string
 *               date_debut:
 *                 type: string
 *                 format: date-time
 *               date_fin:
 *                 type: string
 *                 format: date-time
 *               date_prevue_fin:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Travail mis à jour
 *       404:
 *         description: Travail non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put('/tasks/:id', TaskController.updateTask);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'un travail (avec calcul automatique du %)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [nouveau, en_cours, termine]
 *                 description: "nouveau = 0%, en_cours = 50%, termine = 100%"
 *     responses:
 *       200:
 *         description: Statut mis à jour avec pourcentage calculé
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Travail non trouvé
 */
router.patch('/tasks/:id/status', TaskController.updateTaskStatus);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Supprimer un travail
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Travail supprimé
 *       404:
 *         description: Travail non trouvé
 */
router.delete('/tasks/:id', TaskController.deleteTask);

// =====================
// ROUTES STATISTIQUES
// =====================

/**
 * @swagger
 * /api/tasks/stats/global:
 *   get:
 *     summary: Récupérer les statistiques globales de performance
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Statistiques globales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Statistics'
 */
router.get('/tasks/stats/global', TaskController.getStatistiques);

/**
 * @swagger
 * /api/tasks/stats/periode:
 *   get:
 *     summary: Récupérer les statistiques par période
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: date_debut
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début de la période
 *       - in: query
 *         name: date_fin
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin de la période
 *     responses:
 *       200:
 *         description: Statistiques de la période
 */
router.get('/tasks/stats/periode', TaskController.getStatistiquesPeriode);

/**
 * @swagger
 * /api/tasks/stats/entreprises:
 *   get:
 *     summary: Récupérer les statistiques par entreprise
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Statistiques par entreprise
 */
router.get('/tasks/stats/entreprises', TaskController.getStatistiquesParEntreprise);

/**
 * @swagger
 * /api/tasks/stats/performance:
 *   get:
 *     summary: Récupérer le tableau de performance détaillé
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Tableau de performance avec durées par travail
 */
router.get('/tasks/stats/performance', TaskController.getPerformanceTable);

/**
 * @swagger
 * /api/tasks/statuts:
 *   get:
 *     summary: Récupérer les statuts disponibles avec leurs pourcentages
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Liste des statuts
 *         content:
 *           application/json:
 *             example:
 *               - code: nouveau
 *                 label: Nouveau
 *                 pourcentage: 0
 *               - code: en_cours
 *                 label: En cours
 *                 pourcentage: 50
 *               - code: termine
 *                 label: Terminé
 *                 pourcentage: 100
 */
router.get('/tasks/statuts', TaskController.getStatuts);

export default router;
