require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.query('DESCRIBE public_users', (err, results) => {
    if (err) throw err;
    console.log(results.map(col => col.Field));
    db.end();
});
