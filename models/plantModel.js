const db = require('../config/db'); // Наше настроенное подключение к БД

// Создать новое растение
// (Предполагаем, что user_id будет передан, или его нужно будет получать из сессии/токена в будущем)
const createPlant = async (plantData) => {
    const { user_id, name, species, description, image_url } = plantData;
    const query = `
        INSERT INTO plants (user_id, name, species, description, image_url, added_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *;
    `;
    // В реальном приложении user_id должен быть действительным ID из таблицы users
    // Для простоты сейчас предполагаем, что он корректен
    const values = [user_id, name, species, description, image_url];
    try {
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating plant in model:', error);
        throw error;
    }
};

// Получить все растения
const getAllPlants = async () => {
    const query = 'SELECT * FROM plants ORDER BY added_at DESC;';
    try {
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching all plants in model:', error);
        throw error;
    }
};

// Получить одно растение по ID
const getPlantById = async (plantId) => {
    const query = 'SELECT * FROM plants WHERE plant_id = $1;';
    try {
        const result = await db.query(query, [plantId]);
        return result.rows[0]; // Возвращает растение или undefined, если не найдено
    } catch (error) {
        console.error(`Error fetching plant with id ${plantId} in model:`, error);
        throw error;
    }
};

// Обновить растение по ID
const updatePlantById = async (plantId, plantData) => {
    const { name, species, description, image_url } = plantData;
    // Мы не будем обновлять user_id или added_at здесь
    const query = `
        UPDATE plants
        SET name = $1, species = $2, description = $3, image_url = $4
        WHERE plant_id = $5
        RETURNING *;
    `;
    const values = [name, species, description, image_url, plantId];
    try {
        const result = await db.query(query, values);
        return result.rows[0]; // Возвращает обновленное растение или undefined
    } catch (error) {
        console.error(`Error updating plant with id ${plantId} in model:`, error);
        throw error;
    }
};

// Удалить растение по ID
const deletePlantById = async (plantId) => {
    const query = 'DELETE FROM plants WHERE plant_id = $1 RETURNING *;';
    try {
        const result = await db.query(query, [plantId]);
        return result.rows[0]; // Возвращает удаленное растение или undefined
    } catch (error) {
        console.error(`Error deleting plant with id ${plantId} in model:`, error);
        throw error;
    }
};

module.exports = {
    createPlant,
    getAllPlants,
    getPlantById,
    updatePlantById,
    deletePlantById,
}; 