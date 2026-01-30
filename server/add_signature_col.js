require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.query("ALTER TABLE public_users ADD COLUMN signature_url VARCHAR(255) DEFAULT NULL AFTER profile_pic", (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column signature_url already exists.');
        } else {
            console.error(err);
        }
    } else {
        console.log('Column signature_url added successfully.');
    }
    db.end();
});
