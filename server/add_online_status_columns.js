const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to DB:', err);
        return;
    }
    console.log('Connected to DB');

    const sql = `
        ALTER TABLE public_users 
        ADD COLUMN last_seen TIMESTAMP NULL DEFAULT NULL,
        ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Columns already exist.');
            } else {
                console.error('Error adding columns:', err);
            }
        } else {
            console.log('Successfully added last_seen and is_online columns.');
        }
        db.end();
    });
});
