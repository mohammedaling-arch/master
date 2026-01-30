const mysql = require('mysql2');
require('dotenv').config({ path: '.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.query('SHOW CREATE TABLE probate_documents', (err, results) => {
    if (err) throw err;
    const fs = require('fs');
    fs.writeFileSync('create_table.txt', results[0]['Create Table']);
    db.end();
});
