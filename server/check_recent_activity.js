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
    const sql = `
        SELECT id, email, last_seen, is_online,
               TIMESTAMPDIFF(SECOND, last_seen, UTC_TIMESTAMP()) as seconds_ago
        FROM public_users 
        WHERE is_online = 1 OR last_seen > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 MINUTE)
        ORDER BY last_seen DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error querying:', err);
        } else {
            console.log('Recently Active Users (last 2 minutes):');
            console.table(results);
        }
        db.end();
    });
});
