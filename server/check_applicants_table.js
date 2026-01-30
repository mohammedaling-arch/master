const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.query('SHOW TABLES LIKE "applicants"', (err, res) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Table exists:', res.length > 0);
        if (res.length > 0) {
            db.query('SELECT COUNT(*) as count FROM applicants', (err2, res2) => {
                if (err2) console.error('Count error:', err2);
                else console.log('Applicants count:', res2[0].count);
                db.end();
            });
        } else {
            console.log('Applicants table does not exist!');
            db.end();
        }
    }
});
