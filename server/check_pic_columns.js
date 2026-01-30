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

    db.query("SHOW COLUMNS FROM applicants LIKE 'picture_path'", (err, results) => {
        if (!err && results.length > 0) {
            console.log("applicants table has 'picture_path'");
        } else {
            console.log("applicants table DOES NOT have 'picture_path'");
        }
    });

    db.query("SHOW COLUMNS FROM applicants LIKE 'profile_pic'", (err, results) => {
        if (!err && results.length > 0) {
            console.log("applicants table has 'profile_pic'");
        } else {
            console.log("applicants table DOES NOT have 'profile_pic'");
        }
    });

    db.query("SHOW COLUMNS FROM public_users LIKE 'profile_pic'", (err, results) => {
        if (!err && results.length > 0) {
            console.log("public_users table has 'profile_pic'");
        } else {
            console.log("public_users table DOES NOT have 'profile_pic'");
        }
    });

    db.end();
});
