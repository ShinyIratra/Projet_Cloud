// Example routes
const express = require('express');
const exampleController = require('../controllers/exampleController');

const router = express.Router();

// Define routes
router.post('/add-item', exampleController.addItem);
router.get('/get-items', exampleController.getItems);

module.exports = router;