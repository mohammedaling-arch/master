const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
});

const sql = `
ALTER TABLE public_users 
ADD COLUMN is_email_verified TINYINT(1) DEFAULT 0,
ADD COLUMN email_verification_token VARCHAR(255) NULL,
ADD COLUMN reset_password_token VARCHAR(255) NULL,
ADD COLUMN reset_password_expires DATETIME NULL;
`;

db.query(sql, (err, result) => {
    if (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
    console.log('Migration successful: Added email verification and password reset columns to public_users');
    process.exit(0);
});
