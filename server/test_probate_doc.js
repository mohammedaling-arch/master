const mysql = require('mysql2');
require('dotenv').config({ path: '.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const sql = 'INSERT INTO probate_documents (probate_application_id, document_name, document_type, document_path, pay_status) VALUES (?, ?, ?, ?, ?)';
const params = [5, "Test Death Cert", "pdf", "/uploads/test.pdf", "waived"];

db.query(sql, params, (err, result) => {
    const fs = require('fs');
    if (err) {
        fs.writeFileSync('test_result.txt', "FAIL: " + err.message);
    } else {
        fs.writeFileSync('test_result.txt', "SUCCESS: " + result.insertId);
    }
    db.end();
});
