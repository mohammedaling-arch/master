const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const sql = `
    SELECT p.*, u.first_name, u.surname, u.email
    FROM probate_applications p
    JOIN public_users u ON p.user_id = u.id
    WHERE p.status = 'pending_registrar'
    ORDER BY p.created_at ASC
`;

connection.query(sql, (err, results) => {
    if (err) {
        console.error("Error Execution SQL:", err.message);
        process.exit(1);
    }
    console.log("Results Length:", results.length);
    process.exit(0);
});
