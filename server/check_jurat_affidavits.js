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
    if (err) process.exit(1);
    db.query('SELECT id, user_id, applicant_id, filed_by_staff_id, type FROM affidavits WHERE filed_by_staff_id IS NOT NULL ORDER BY id DESC LIMIT 5', (err, results) => {
        console.log('--- Latest Jurat Affidavits ---');
        console.table(results);
        db.end();
    });
});
