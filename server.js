require('dotenv').config(); // Для загрузки переменных из .env файла
// server.js - НОВАЯ ВЕРСИЯ ПОСЛЕ УДАЛЕНИЯ СТАРОГО
const express = require('express');
const path = require('path'); // path нужен для res.sendFile
const https = require('https'); // Added for OpenAI API calls
const app = express();

// Подключение к БД
const dbClient = require('./config/db');

// OpenAI API Key - Снова читается из переменных окружения
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Маршруты API
const plantRoutes = require('./routes/plantRoutes');
// const itemsRoutes = require('./routes/itemsRoutes'); // Если items не используются, можно удалить или оставить закомментированным

app.use(express.json()); // Middleware для парсинга JSON тел запросов

// Подключаем маршруты API
app.use('/api/plants', plantRoutes);
// app.use('/api/items', itemsRoutes); // Если items не используются

// New API endpoint for OpenAI queries
app.post('/api/ask-ai', async (req, res) => {
    const { query, type } = req.body; // 'type' can be "flower" or "general"

    if (!OPENAI_API_KEY) {
        console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: OPENAI_API_KEY is not set.`);
        return res.status(500).json({ error: "OpenAI API key is not configured on the server." });
    }

    if (!query) {
        return res.status(400).json({ error: "Missing 'query' in request body" });
    }

    let system_content = "Ты — эрудированный и увлекательный рассказчик.";
    if (type === "flower") {
        system_content = "Ты — эксперт-глоссарий по цветам и растениям. Твоя задача — предоставлять интересную, подробную и точную информацию о различных цветах (растениях), их видах, истории, символизме, значении, особенностях ухода, интересных фактах и т.д. Если пользователь спрашивает о растении, у которого много видов (например, роза, тюльпан), уточни, какой именно вид его интересует, предложив несколько популярных вариантов, или попроси пользователя уточнить запрос. Отвечай подробно и увлекательно, как будто рассказываешь занимательную историю.";
    }

    const requestData = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: system_content },
            { role: "user", content: query }
        ]
    });

    const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    let responseData = '';
    const apiReq = https.request(options, (apiRes) => {
        apiRes.on('data', (chunk) => {
            responseData += chunk;
        });
        apiRes.on('end', () => {
            try {
                const parsedResponse = JSON.parse(responseData);
                if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
                    if (parsedResponse.choices && parsedResponse.choices.length > 0 && parsedResponse.choices[0].message && parsedResponse.choices[0].message.content) {
                        res.json({ response: parsedResponse.choices[0].message.content.trim() });
                    } else {
                        console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: OpenAI response format error. Response: ${JSON.stringify(parsedResponse)}`);
                        res.status(500).json({ error: "Unexpected response format from OpenAI." });
                    }
                } else {
                    console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: OpenAI API Error (Status ${apiRes.statusCode}). Response: ${JSON.stringify(parsedResponse)}`);
                    res.status(apiRes.statusCode).json({ error: `OpenAI API error: ${parsedResponse.error?.message || 'Unknown error'}` });
                }
            } catch (parseError) {
                console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Error parsing OpenAI response. Error: ${String(parseError)}. Raw response: ${responseData}`);
                res.status(500).json({ error: "Error processing OpenAI response." });
            }
        });
    });

    apiReq.on('error', (error) => {
        console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Error making OpenAI request. Error: ${String(error)}`);
        res.status(500).json({ error: "Failed to communicate with OpenAI." });
    });

    apiReq.write(requestData);
    apiReq.end();
});

// Главный маршрут - отдает index.html
app.get('/', (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] GET / : Попытка отправить index.html`);
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            console.error(`[${new Date().toLocaleTimeString()}] Ошибка при отправке index.html:`, err);
            res.status(500).send("Ошибка сервера: не удалось загрузить клиентскую страницу. Проверьте логи сервера.");
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] index.html успешно отправлен.`);
        }
    });
});

console.log(`[${new Date().toLocaleTimeString()}] server.js: Конфигурация сервера завершена. Попытка запуска...`);

const port = process.env.PORT || 3001
app.listen(port, () => {
    console.log(`[${new Date().toLocaleTimeString()}] Сервер УСПЕШНО запущен на http://localhost:${port}`);
    console.log(`[${new Date().toLocaleTimeString()}] Клиент (index.html) должен быть доступен по адресу: http://localhost:${port}/`);
    if (dbClient) {
        // Сообщение об успешном подключении к БД уже выводится из config/db.js
        // Можно добавить дополнительное подтверждение здесь, если нужно
        console.log(`[${new Date().toLocaleTimeString()}] Статус подключения к БД: клиент существует (вероятно, успешно).`);
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] КЛИЕНТ БД НЕ СУЩЕСТВУЕТ! Проверьте config/db.js.`);
    }
});