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
    if (err) {
        process.exit(1);
    }
    db.query('DESCRIBE affidavits', (err, results) => {
        console.log('--- affidavits ---');
        if (!err) console.table(results);
        db.query('DESCRIBE probate_applications', (err, results) => {
            console.log('--- probate_applications ---');
            if (!err) console.table(results);
            db.end();
            process.exit(0);
        });
    });
});
