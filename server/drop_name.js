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
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');

    const sql = 'ALTER TABLE public_users DROP COLUMN name';

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error dropping column:', err);
            process.exit(1);
        }
        console.log('Column name dropped successfully');
        db.end();
        process.exit(0);
    });
});
