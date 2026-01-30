const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'crms_db'
});

db.connect((err) => {
    if (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }

    console.log('Checking data counts...');

    console.log('Checking JOIN query...');

    const queries = [
        `SELECT a.id, a.status, u.first_name, u.surname, u.email 
        FROM affidavits a 
        JOIN public_users u ON a.user_id = u.id 
        ORDER BY a.created_at DESC LIMIT 5`,
        'SELECT id, first_name, surname, email, phone, nin, status, created_at FROM public_users ORDER BY created_at DESC'
    ];

    let completed = 0;

    queries.forEach((q, idx) => {
        db.query(q, (err, results) => {
            if (err) console.error(`Query ${idx} error:`, err);
            else {
                console.log(`Query ${idx} result count: ${results.length}`);
                if (results.length > 0) console.log('Sample row:', results[0]);
            }
            completed++;
            if (completed === queries.length) db.end();
        });
    });
});
