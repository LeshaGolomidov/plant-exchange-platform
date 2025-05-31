const Plant = require('../models/plantModel');

// POST /api/plants - Создать новое растение
const createPlantHandler = async (req, res) => {
    try {
        // В req.body должны быть: user_id, name. Species, description, image_url - опционально.
        // Валидацию user_id и других полей хорошо бы добавить.
        // Для простоты, ожидаем user_id в теле запроса.
        // В реальном приложении user_id обычно берется из аутентификации (req.user.id)
        const { user_id, name, species, description, image_url } = req.body;

        if (!user_id || !name) {
            return res.status(400).json({ message: 'user_id and name are required fields.' });
        }

        const newPlant = await Plant.createPlant({ user_id, name, species, description, image_url });
        res.status(201).json(newPlant);
    } catch (error) {
        console.error('Error in createPlantHandler:', error);
        // Проверяем, не ошибка ли это внешнего ключа (если user_id не существует)
        if (error.code === '23503') { // Код ошибки PostgreSQL для foreign key violation
             return res.status(400).json({ message: `User with user_id ${req.body.user_id} does not exist.` });
        }
        res.status(500).json({ message: 'Server Error creating plant' });
    }
};

// GET /api/plants - Получить все растения
const getAllPlantsHandler = async (req, res) => {
    try {
        const plants = await Plant.getAllPlants();
        res.status(200).json(plants);
    } catch (error) {
        console.error('Error in getAllPlantsHandler:', error);
        res.status(500).json({ message: 'Server Error fetching plants' });
    }
};

// GET /api/plants/:id - Получить одно растение по ID
const getPlantByIdHandler = async (req, res) => {
    try {
        const plantId = parseInt(req.params.id, 10);
        if (isNaN(plantId)) {
            return res.status(400).json({ message: 'Plant ID must be an integer.' });
        }
        const plant = await Plant.getPlantById(plantId);
        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }
        res.status(200).json(plant);
    } catch (error) {
        console.error('Error in getPlantByIdHandler:', error);
        res.status(500).json({ message: 'Server Error fetching plant' });
    }
};

// PUT /api/plants/:id - Обновить растение по ID
const updatePlantByIdHandler = async (req, res) => {
    try {
        const plantId = parseInt(req.params.id, 10);
        if (isNaN(plantId)) {
            return res.status(400).json({ message: 'Plant ID must be an integer.' });
        }
        // Мы не позволяем менять user_id растения через этот эндпоинт
        const { name, species, description, image_url } = req.body;
        if (!name) { // Имя сделаем обязательным при обновлении
            return res.status(400).json({ message: 'Name field is required for update.' });
        }

        const updatedPlant = await Plant.updatePlantById(plantId, { name, species, description, image_url });
        if (!updatedPlant) {
            return res.status(404).json({ message: 'Plant not found or no changes made' });
        }
        res.status(200).json(updatedPlant);
    } catch (error) {
        console.error('Error in updatePlantByIdHandler:', error);
        res.status(500).json({ message: 'Server Error updating plant' });
    }
};

// DELETE /api/plants/:id - Удалить растение по ID
const deletePlantByIdHandler = async (req, res) => {
    try {
        const plantId = parseInt(req.params.id, 10);
        if (isNaN(plantId)) {
            return res.status(400).json({ message: 'Plant ID must be an integer.' });
        }
        const deletedPlant = await Plant.deletePlantById(plantId);
        if (!deletedPlant) {
            return res.status(404).json({ message: 'Plant not found' });
        }
        // res.status(200).json({ message: 'Plant deleted successfully', plant: deletedPlant });
        res.status(204).send(); // Стандартный ответ для успешного удаления без тела ответа
    } catch (error) {
        console.error('Error in deletePlantByIdHandler:', error);
        res.status(500).json({ message: 'Server Error deleting plant' });
    }
};

module.exports = {
    createPlantHandler,
    getAllPlantsHandler,
    getPlantByIdHandler,
    updatePlantByIdHandler,
    deletePlantByIdHandler,
}; 