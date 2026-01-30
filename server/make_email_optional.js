const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');

    // Make email nullable and remove unique constraint
    const alterEmailColumn = `
        ALTER TABLE applicants 
        MODIFY COLUMN email VARCHAR(255) NULL,
        DROP INDEX email
    `;

    db.query(alterEmailColumn, (err) => {
        if (err && err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log('✓ Email unique index already removed');

            // Just modify the column to be nullable
            const modifyOnly = 'ALTER TABLE applicants MODIFY COLUMN email VARCHAR(255) NULL';
            db.query(modifyOnly, (err2) => {
                if (err2) {
                    console.error('Error modifying email column:', err2.message);
                } else {
                    console.log('✓ Email column is now nullable');
                }
                db.end();
            });
        } else if (err) {
            console.error('Error altering email column:', err.message);
            db.end();
        } else {
            console.log('✓ Email column is now nullable and unique constraint removed');
            db.end();
        }
    });
});
