import express from 'express';
import webAuthController from '../controllers/webAuthController.js';
import webSignalementController from '../controllers/webSignalementController.js';
import syncController from '../controllers/syncController.js';

const router = express.Router();

// Auth
router.post('/login', webAuthController.login);
router.post('/register', webAuthController.register);
router.post('/unblock', webAuthController.unblockUser);
router.get('/users/blocked', webAuthController.getBlockedUsers);

// Signalements
router.get('/signalements', webSignalementController.getAll);
router.get('/signalements/stats', webSignalementController.getStats);
router.put('/signalements', webSignalementController.update);
router.patch('/signalements/status', webSignalementController.updateStatus);
router.get('/entreprises', webSignalementController.getEntreprises);

// Sync
router.post('/sync/from-firebase', syncController.syncFromFirebase);
router.post('/sync/to-firebase', syncController.syncToFirebase);

export default router;
