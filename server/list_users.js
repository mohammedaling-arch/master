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
        console.error('Error connecting:', err);
        process.exit(1);
    }
    console.log('--- Public Users ---');
    db.query('SELECT id, email, first_name, surname FROM public_users', (err, results) => {
        if (err) console.error(err);
        else console.table(results);

        console.log('--- Staff Users ---');
        db.query('SELECT id, email, name, role FROM staff_users', (err, results) => {
            if (err) console.error(err);
            else console.table(results);
            db.end();
            process.exit(0);
        });
    });
});
