const mysql = require('mysql2');
require('dotenv').config({ path: '.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.query('DESCRIBE probate_applications', (err, results) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(results, null, 2));
    db.end();
});
