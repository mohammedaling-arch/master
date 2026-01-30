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
        console.error(err);
        process.exit(1);
    }
    db.query('DESCRIBE affidavits', (err, results) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        results.forEach(col => {
            console.log(col.Field);
        });
        db.end();
    });
});
