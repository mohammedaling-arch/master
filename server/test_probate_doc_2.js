const mysql = require('mysql2');
require('dotenv').config({ path: '.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// App ID 5 exists based on previous check
const appId = 5;
const documentName = "Test Doc Server Code";
const filePath = "/uploads/test_server_code.pdf";

const sql = 'INSERT INTO probate_documents (probate_application_id, document_name, document_path, pay_status) VALUES (?, ?, ?, ?)';

console.log("Running query without document_type...");
db.query(sql, [appId, documentName, filePath, 'waived'], (err, result) => {
    if (err) {
        console.error("FAIL:", err.message);
    } else {
        console.log("SUCCESS. ID:", result.insertId);
    }
    db.end();
});
