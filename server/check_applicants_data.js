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
    db.query('SELECT id, first_name, surname, email FROM applicants ORDER BY id DESC LIMIT 5', (err, results) => {
        console.log('--- Latest Applicants ---');
        console.table(results);
        db.end();
    });
});
