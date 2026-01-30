const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'crms'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }

    db.query("DESCRIBE affidavits", (err, results) => {
        if (err) {
            console.error(err);
        } else {
            const columns = results.map(r => r.Field);
            console.log('Columns:', columns);
            if (!columns.includes('approved_by')) {
                console.log('Adding approved_by column...');
                db.query("ALTER TABLE affidavits ADD COLUMN approved_by INT NULL DEFAULT NULL AFTER status", (err) => {
                    if (err) console.error(err);
                    else console.log('Column approved_by added.');
                    process.exit(0);
                });
            } else {
                console.log('approved_by column already exists.');
                process.exit(0);
            }
        }
    });
});
