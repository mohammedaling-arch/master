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

    const alterPaymentsTable = `
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER applicant_id,
        ADD CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES public_users(id) ON DELETE CASCADE
    `;

    db.query(alterPaymentsTable, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Error altering payments table:', err);
        } else {
            console.log('✓ Payments table updated with user_id');
        }
        db.end();
    });
});
