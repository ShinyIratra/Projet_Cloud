import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// Définition des routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/update', authController.updateEmailandPassword);

export default router;