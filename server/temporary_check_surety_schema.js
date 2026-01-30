const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) { console.error(err); process.exit(1); }

    db.query("DESCRIBE probate_sureties", (err, res) => {
        if (err) console.error(err);
        else console.log(res); // Check columns, specifically expecting a name column or similar?

        // Wait, probate_sureties might BE the table with the name, or it links to a 'sureties' table? 
        // Based on previous code, probate_sureties seemed to have the name directly or link to it.
        // Let's check if 'sureties' table exists or if 'probate_sureties' has a 'name' column.

        db.query("SHOW TABLES LIKE 'sureties'", (err, tables) => {
            console.log("Tables matching 'sureties':", tables);
            process.exit();
        });
    });
});
