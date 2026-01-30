require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.query("ALTER TABLE staff_users ADD COLUMN division VARCHAR(255) DEFAULT NULL AFTER role", (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column division already exists.');
        } else {
            console.error(err);
        }
    } else {
        console.log('Column division added successfully.');
    }
    db.end();
});
