const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        process.exit(1);
    }
    db.query('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = "public_users" AND COLUMN_NAME = "name" AND TABLE_SCHEMA = ?', [process.env.DB_NAME], (err, results) => {
        if (err) {
            console.error(err);
        } else {
            if (results.length > 0) {
                console.log('COLUMN "name" EXISTS in "public_users"');
            } else {
                console.log('COLUMN "name" DOES NOT EXIST in "public_users"');
            }
        }
        db.end();
        process.exit(0);
    });
});
