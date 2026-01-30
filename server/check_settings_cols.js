const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.query('DESCRIBE system_settings', (err, results) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Columns in system_settings:');
    results.forEach(col => {
        console.log(`- ${col.Field} (${col.Type})`);
    });
    process.exit(0);
});
