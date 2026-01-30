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
        SELECT a.id, a.user_id, a.type, a.status, a.virtual_oath_taken, 
               u.email, u.last_seen, u.is_online
        FROM affidavits a
        JOIN public_users u ON a.user_id = u.id
        WHERE a.status = 'submitted' AND a.virtual_oath_taken >= 1
        ORDER BY a.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error querying:', err);
        } else {
            console.log('Affidavits in Virtual Oath Queue:');
            console.table(results);
        }
        db.end();
    });
});
