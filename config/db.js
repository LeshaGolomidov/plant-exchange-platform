const { Client } = require('pg');

const client = new Client({
    user: 'plant_app_user',    // Имя пользователя, которое ты создал в pgAdmin (например, plant_app_user)
    host: 'localhost',         // PostgreSQL запущен на твоей машине (Windows)
    database: 'plant_exchange_db', // Имя базы данных, которую ты создал в pgAdmin (например, plant_exchange_db)
    password: 'SuperSecure123!', // 
    port: 5433,                // Стандартный порт PostgreSQL
});

client.connect()
    .then(() => {
        console.log('Успешное подключение к PostgreSQL!');
        console.log(`  Хост: ${client.host}`);
        console.log(`  Порт: ${client.port}`);
        console.log(`  База данных: ${client.database}`);
        console.log(`  Пользователь: ${client.user}`);
    })
    .catch(err => {
        console.error('Ошибка подключения к PostgreSQL:', err.stack);
        console.error('--------------------------------------------------------------------');
        console.error('ПРОВЕРЬТЕ СЛЕДУЮЩЕЕ:');
        console.error('1. PostgreSQL сервер запущен на Windows (проверь службы Windows или статус сервера в pgAdmin).');
        console.error('2. Имя пользователя (user), пароль (password), имя базы данных (database) и порт (port) в config/db.js указаны ВЕРНО.');
        console.error('   - Пользователь: \'plant_app_user\' (или как ты его назвал)');
        console.error('   - База данных: \'plant_exchange_db\' (или как ты ее назвал)');
        console.error('   - Пароль: тот, что ты задал для этого пользователя в pgAdmin.');
        console.error('   - Хост: \'localhost\' (если Node.js и PostgreSQL на одной машине).');
        console.error('   - Порт: 5432 (стандартный для PostgreSQL).');
        console.error('3. Пользователю \'plant_app_user\' даны права на подключение к базе \'plant_exchange_db\' (ты это делал в pgAdmin).');
        console.error('--------------------------------------------------------------------');
    });

module.exports = client; 