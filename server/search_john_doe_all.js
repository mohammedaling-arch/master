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
    if (err) throw err;
    db.query("SELECT * FROM public_users WHERE first_name LIKE '%John%' OR surname LIKE '%Doe%'", (err, res) => {
        console.log('Public Users:', res);
        db.query("SELECT * FROM applicants WHERE first_name LIKE '%John%' OR surname LIKE '%Doe%'", (err2, res2) => {
            console.log('Applicants:', res2);
            db.query("SELECT * FROM staff_users WHERE name LIKE '%John%' OR name LIKE '%Doe%'", (err3, res3) => {
                console.log('Staff Users:', res3);
                db.end();
            });
        });
    });
});
