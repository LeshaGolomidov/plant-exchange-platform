require('dotenv').config(); // Для загрузки переменных из .env файла
// server.js - Версия для работы с IO API (intelligence.io.solutions)
const express = require('express');
const path = require('path');
const https = require('https'); // Для HTTPS запросов (можно заменить на node-fetch или axios для удобства, но оставим пока так для минимальных изменений)
const app = express();

// Подключение к БД (если используется)
const dbClient = require('./config/db'); 

// Ключи и базовый URL для IO API из .env файла
const IO_API_KEY = process.env.IO_API_KEY;
const IO_API_BASE = process.env.IO_API_BASE;

// Маршруты API (если используются, например, для растений)
const plantRoutes = require('./routes/plantRoutes');

app.use(express.json()); // Middleware для парсинга JSON тел запросов
app.use('/api/plants', plantRoutes); // Пример подключения других маршрутов

// API endpoint для IO API
app.post('/api/ask-ai', async (req, res) => {
    const { query, type } = req.body; // 'type' может быть "flower" или "general"

    if (!IO_API_KEY || !IO_API_BASE) {
        const errorMsg = `[${new Date().toLocaleTimeString()}] /api/ask-ai: IO_API_KEY или IO_API_BASE не установлены в .env`;
        console.error(errorMsg);
        return res.status(500).json({ error: "AI API ключи не сконфигурированы на сервере." });
    }

    if (!query) {
        return res.status(400).json({ error: "Отсутствует 'query' в теле запроса" });
    }

    // Формирование системного промпта
    let base_system_prompt = "Ты — эрудированный и увлекательный рассказчик.";
    if (type === "flower") {
        base_system_prompt = "Ты — эксперт-глоссарий по цветам и растениям. Твоя задача — предоставлять интересную, подробную и точную информацию о различных цветах (растениях), их видах, истории, символизме, значении, особенностях ухода, интересных фактах и т.д. Если пользователь спрашивает о растении, у которого много видов (например, роза, тюльпан), уточни, какой именно вид его интересует, предложив несколько популярных вариантов, или попроси пользователя уточнить запрос.";
    }
    const length_instruction = " Старайся давать краткие или средние по длине ответы, чтобы они легко помещались в одно-два сообщения или абзаца на веб-странице. Если тема обширная, лучше логически разбей информацию на несколько последовательных блоков, но каждый индивидуальный блок должен быть относительно коротким и законченным.";
    const system_content = base_system_prompt + length_instruction;

    const selected_model = "deepseek-ai/DeepSeek-R1-0528"; // Модель, как в Python-скрипте

    const payload = {
        model: selected_model,
        messages: [
            { role: "system", content: system_content },
            { role: "user", content: query }
        ]
    };

    const requestData = JSON.stringify(payload);
    
    // Разбираем IO_API_BASE на hostname и path
    let apiUrlParsed;
    try {
        apiUrlParsed = new URL(IO_API_BASE + '/chat/completions'); // Добавляем эндпоинт
    } catch (e) {
        console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Неверный формат IO_API_BASE: ${IO_API_BASE}`);
        return res.status(500).json({ error: "Ошибка конфигурации AI API URL на сервере." });
    }

    const options = {
        hostname: apiUrlParsed.hostname,
        path: apiUrlParsed.pathname + apiUrlParsed.search, // Учитываем возможные query params в IO_API_BASE, хотя для /chat/completions их обычно нет
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${IO_API_KEY}`,
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    let responseData = '';
    console.log(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Отправка запроса на ${apiUrlParsed.href}`);
    console.log(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Заголовки: ${JSON.stringify(options.headers)}`);
    console.log(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Тело запроса: ${requestData}`);

    const apiReq = https.request(options, (apiRes) => {
        apiRes.on('data', (chunk) => {
            responseData += chunk;
        });
        apiRes.on('end', () => {
            console.log(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Получен ответ от API. Статус: ${apiRes.statusCode}`);
            console.log(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Тело ответа: ${responseData}`);
            try {
                const parsedResponse = JSON.parse(responseData);
                if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
                    let text_response = null;
                    if (parsedResponse.choices && parsedResponse.choices.length > 0 && parsedResponse.choices[0].message && parsedResponse.choices[0].message.content) {
                        text_response = parsedResponse.choices[0].message.content;
                    } else if (parsedResponse.text) {
                        text_response = parsedResponse.text;
                    } else if (parsedResponse.completion) {
                        text_response = parsedResponse.completion;
                    } else if (parsedResponse.data && typeof parsedResponse.data === 'object' && parsedResponse.data.text) {
                        text_response = parsedResponse.data.text;
                    } else if (typeof parsedResponse.response === 'string') {
                        text_response = parsedResponse.response;
                    } else {
                        text_response = `Не удалось извлечь текстовый ответ. Полный ответ: ${responseData}`;
                    }
                    res.json({ response: text_response.trim() });
                } else {
                    console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Ошибка от IO API (Статус ${apiRes.statusCode}):`, parsedResponse);
                    res.status(apiRes.statusCode).json({ error: `Ошибка от AI API: ${parsedResponse.detail || JSON.stringify(parsedResponse)}` });
                }
            } catch (parseError) {
                console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Ошибка парсинга ответа от IO API. Error: ${String(parseError)}. Raw response: ${responseData}`);
                res.status(500).json({ error: "Ошибка обработки ответа от AI API." });
            }
        });
    });

    apiReq.on('error', (error) => {
        console.error(`[${new Date().toLocaleTimeString()}] /api/ask-ai: Ошибка при запросе к IO API. Error: ${String(error)}`);
        res.status(500).json({ error: "Не удалось связаться с AI API." });
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

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`[${new Date().toLocaleTimeString()}] Сервер УСПЕШНО запущен на http://localhost:${port}`);
    console.log(`[${new Date().toLocaleTimeString()}] Клиент (index.html) должен быть доступен по адресу: http://localhost:${port}/`);
    if (IO_API_KEY && IO_API_BASE) {
        console.log(`[${new Date().toLocaleTimeString()}] IO API Key и Base URL загружены из .env (или переменных окружения).`);
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ВНИМАНИЕ: IO_API_KEY или IO_API_BASE не найдены! Проверьте .env файл или переменные окружения.`);
    }
    // Проверка подключения к БД, если dbClient существует
    if (dbClient) {
        console.log(`[${new Date().toLocaleTimeString()}] Статус подключения к БД: клиент существует (вероятно, успешно).`);
    } else {
        // Это не обязательно ошибка, если БД не используется или dbClient не экспортируется
        // console.warn(`[${new Date().toLocaleTimeString()}] Клиент БД (dbClient) не определен в server.js.`);
    }
});