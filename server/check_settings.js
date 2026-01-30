const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.query('SELECT * FROM system_settings', (err, results) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('System Settings:');
    results.forEach(row => {
        console.log(`- ${row.setting_key}: ${row.setting_value}`);
    });
    process.exit(0);
});
