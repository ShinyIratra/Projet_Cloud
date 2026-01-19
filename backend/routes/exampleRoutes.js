// Example routes
import express from 'express';
import exampleController from '../controllers/exampleController.js';

const router = express.Router();

// Define routes
router.post('/add-item', exampleController.addItem);
router.get('/get-items', exampleController.getItems);

export default router;