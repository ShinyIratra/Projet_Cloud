import express from 'express';
import RoadAlertController from '../controllers/RoadAlertController.js';

/**
 * @swagger
 * tags:
 *   name: RoadAlerts
 *   description: Gestion des signalements routiers
 */

/**
 * @swagger
 * /road_alerts:
 *   post:
 *     summary: Créer un nouveau signalement routier
 *     tags: [RoadAlerts]
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
 *               - status
 *               - lattitude
 *               - longitude
 *               - UID
 *               - date_alert
 *             properties:
 *               surface:
 *                 type: number
 *               budget:
 *                 type: number
 *               concerned_entreprise:
 *                 type: string
 *               status:
 *                 type: string
 *               lattitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               UID:
 *                 type: string
 *               date_alert:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Signalement créé avec succès
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /road_alerts:
 *   get:
 *     summary: Récupérer tous les signalements routiers
 *     tags: [RoadAlerts]
 *     responses:
 *       200:
 *         description: Liste des signalements
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /road_alerts:
 *   put:
 *     summary: Mettre à jour un signalement routier
 *     tags: [RoadAlerts]
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
 *                 type: string
 *               surface:
 *                 type: number
 *               budget:
 *                 type: number
 *               concerned_entreprise:
 *                 type: string
 *               lattitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               UID:
 *                 type: string
 *               date_alert:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Signalement mis à jour avec succès
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /road_alerts/status:
 *   patch:
 *     summary: Mettre à jour le statut d'un signalement routier
 *     tags: [RoadAlerts]
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
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /road_alerts/user/{UID}:
 *   get:
 *     summary: Récupérer les signalements routiers par utilisateur
 *     tags: [RoadAlerts]
 *     parameters:
 *       - in: path
 *         name: UID
 *         required: true
 *         schema:
 *           type: string
 *         description: UID de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des signalements de l'utilisateur
 *       500:
 *         description: Erreur serveur
 */

const router = express.Router();

// Route to create a new road alert
router.post('/road_alerts', RoadAlertController.new_road_alert);

// Route to get all road alerts
router.get('/road_alerts', RoadAlertController.get_all_road_alerts);

// Route to update a road alert
router.put('/road_alerts', RoadAlertController.update_road_alert);

// Route to update the status of a road alert
router.patch('/road_alerts/status', RoadAlertController.update_road_alert_status);

// Route to get road alerts by user
router.get('/road_alerts/user/:UID', RoadAlertController.getByUser);

export default router;