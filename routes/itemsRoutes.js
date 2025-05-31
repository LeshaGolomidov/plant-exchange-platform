// routes/itemsRoutes.js
const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController'); // Ты его адаптируешь

// Вместо /items будут маршруты для /plants, /users, /offers и т.д.
router.get('/items', itemsController.getItems);
router.post('/items', itemsController.createItem);

// router.get('/plants', plantController.getAllPlants);
// router.post('/plants', plantController.createPlant);
// router.put('/plants/:id', plantController.updatePlant);
// router.delete('/plants/:id', plantController.deletePlant);

module.exports = router; 