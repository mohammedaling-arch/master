const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const alterTable = "ALTER TABLE affidavits MODIFY COLUMN virtual_oath_taken ENUM('pending', 'requested', 'completed', 'verified') DEFAULT 'pending'";

    db.query(alterTable, (err, result) => {
        if (err) {
            console.error('Migration failed:', err.message);
        } else {
            console.log('Migration successful: virtual_oath_taken column updated to ENUM');

            // Check current schema
            db.query("SHOW CREATE TABLE affidavits", (err, results) => {
                if (!err) {
                    console.log('New Schema:', results[0]['Create Table']);
                }
                db.end();
            });
        }
    });
});
