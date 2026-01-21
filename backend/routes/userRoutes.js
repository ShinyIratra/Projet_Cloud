import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

/**
 * @swagger
 * /api/users/tentative:
 *   post:
 *     summary: Récupérer les tentatives de connexion d'un utilisateur
 *     tags: [Utilisateurs]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID de l'utilisateur
 *     responses:
 *       200:
 *         description: Tentatives récupérées avec succès
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post('/users/tentative', userController.getTentativeUser);

/**
 * @swagger
 * /api/users/blocked:
 *   post:
 *     summary: Vérifier si un utilisateur est bloqué
 *     tags: [Utilisateurs]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID de l'utilisateur
 *     responses:
 *       200:
 *         description: Statut récupéré avec succès
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post('/users/blocked', userController.isUserBlocked);

export default router;