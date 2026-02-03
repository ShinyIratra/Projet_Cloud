import express from 'express';
import NotificationController from '../controllers/notificationController.js';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications utilisateur
 */

/**
 * @swagger
 * /api/notifications/user/{UID}:
 *   get:
 *     summary: Récupérer toutes les notifications d'un utilisateur
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: UID
 *         required: true
 *         schema:
 *           type: string
 *         description: UID de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des notifications
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/notifications/unread/{UID}:
 *   get:
 *     summary: Récupérer les notifications non lues d'un utilisateur
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: UID
 *         required: true
 *         schema:
 *           type: string
 *         description: UID de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des notifications non lues
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/notifications/read:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
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
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Marquer toutes les notifications d'un utilisateur comme lues
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - UID
 *             properties:
 *               UID:
 *                 type: string
 *     responses:
 *       200:
 *         description: Toutes les notifications ont été marquées comme lues
 *       500:
 *         description: Erreur serveur
 */

const router = express.Router();

// Route pour récupérer toutes les notifications d'un utilisateur
router.get('/notifications/user/:UID', NotificationController.getUserNotifications);

// Route pour récupérer les notifications non lues d'un utilisateur
router.get('/notifications/unread/:UID', NotificationController.getUnreadNotifications);

// Route pour marquer une notification comme lue
router.patch('/notifications/read', NotificationController.markAsRead);

// Route pour marquer toutes les notifications comme lues
router.patch('/notifications/read-all', NotificationController.markAllAsRead);

export default router;
