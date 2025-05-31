// routes/plantRoutes.js
const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');

// Маршруты для растений
router.post('/', plantController.createPlantHandler);          // POST /api/plants
router.get('/', plantController.getAllPlantsHandler);           // GET /api/plants
router.get('/:id', plantController.getPlantByIdHandler);        // GET /api/plants/:id
router.put('/:id', plantController.updatePlantByIdHandler);     // PUT /api/plants/:id
router.delete('/:id', plantController.deletePlantByIdHandler);  // DELETE /api/plants/:id

module.exports = router; 