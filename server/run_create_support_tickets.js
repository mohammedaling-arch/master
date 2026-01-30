const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }

    console.log('Connected to database');

    const sql = fs.readFileSync('./create_support_tickets_table.sql', 'utf8');

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error creating tables:', err);
            process.exit(1);
        }

        console.log('✓ Support tickets tables created successfully');
        process.exit(0);
    });
});
