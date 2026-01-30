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
    const sql = 'SELECT id, email, last_seen, is_online FROM public_users ORDER BY id';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error querying:', err);
        } else {
            console.log('All Users Status:');
            console.table(results);
        }
        db.end();
    });
});
