import express from 'express';
import TaskController from '../controllers/TaskController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Avancement
 *   description: Suivi d'avancement des signalements (adapté à la base existante)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Avancement:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID du signalement
 *         surface:
 *           type: number
 *         budget:
 *           type: number
 *         statut:
 *           type: string
 *           enum: [nouveau, en_cours, termine]
 *         avancement_pourcentage:
 *           type: integer
 *           description: "Nouveau=0%, En cours=50%, Terminé=100%"
 *         date_signalement:
 *           type: string
 *           format: date-time
 *           description: Date de début (création du signalement)
 *         date_mise_a_jour:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 *         date_fin:
 *           type: string
 *           format: date-time
 *           description: Date de fin (= updated_at quand statut = terminé)
 *         duree_jours:
 *           type: number
 *           description: Durée de traitement en jours
 *         entreprise_nom:
 *           type: string
 *         utilisateur_nom:
 *           type: string
 *     Statistics:
 *       type: object
 *       properties:
 *         total_signalements:
 *           type: integer
 *         signalements_nouveaux:
 *           type: integer
 *         signalements_en_cours:
 *           type: integer
 *         signalements_termines:
 *           type: integer
 *         avancement_moyen:
 *           type: number
 *         delai_moyen_jours:
 *           type: number
 *           description: Délai moyen de traitement des signalements terminés
 *         delai_min_jours:
 *           type: number
 *         delai_max_jours:
 *           type: number
 *         taux_completion:
 *           type: number
 */

// =====================
// ROUTES AVANCEMENT
// =====================

/**
 * @swagger
 * /api/tasks/avancement:
 *   get:
 *     summary: Tous les signalements avec leur avancement calculé automatiquement
 *     tags: [Avancement]
 *     responses:
 *       200:
 *         description: Liste des signalements avec avancement
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Avancement'
 */
router.get('/tasks/avancement', TaskController.getAllAvancement);

/**
 * @swagger
 * /api/tasks/avancement/{id}:
 *   get:
 *     summary: Avancement d'un signalement par ID
 *     tags: [Avancement]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de l'avancement
 *       404:
 *         description: Signalement non trouvé
 */
router.get('/tasks/avancement/:id', TaskController.getAvancementById);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut (calcul automatique du pourcentage)
 *     tags: [Avancement]
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
 *                 description: "nouveau=0%, en_cours=50%, termine=100%"
 *     responses:
 *       200:
 *         description: Statut mis à jour avec pourcentage calculé
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Signalement non trouvé
 */
router.patch('/tasks/:id/status', TaskController.updateStatus);

// =====================
// ROUTES STATISTIQUES
// =====================

/**
 * @swagger
 * /api/tasks/stats/global:
 *   get:
 *     summary: Statistiques globales (avancement moyen, délai moyen de traitement)
 *     tags: [Avancement]
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
 * /api/tasks/stats/entreprises:
 *   get:
 *     summary: Statistiques par entreprise
 *     tags: [Avancement]
 *     responses:
 *       200:
 *         description: Statistiques par entreprise
 */
router.get('/tasks/stats/entreprises', TaskController.getStatistiquesParEntreprise);

/**
 * @swagger
 * /api/tasks/stats/performance:
 *   get:
 *     summary: Tableau de performance détaillé avec dates et durées
 *     tags: [Avancement]
 *     responses:
 *       200:
 *         description: Tableau de performance
 */
router.get('/tasks/stats/performance', TaskController.getPerformanceTable);

/**
 * @swagger
 * /api/tasks/statuts:
 *   get:
 *     summary: Liste des statuts disponibles avec leurs pourcentages
 *     tags: [Avancement]
 *     responses:
 *       200:
 *         description: Liste des statuts
 */
router.get('/tasks/statuts', TaskController.getStatuts);

export default router;
