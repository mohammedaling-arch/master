const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const tables = ['probate_applications', 'probate_beneficiaries', 'probate_sureties', 'probate_properties'];

const checkTables = async () => {
    for (const table of tables) {
        console.log(`--- Table: ${table} ---`);
        try {
            const [rows] = await db.promise().query(`DESCRIBE ${table}`);
            console.log(rows.map(r => `${r.Field} (${r.Type})`).join(', '));
        } catch (err) {
            console.log(`Error or Table Missing: ${err.message}`);
        }
    }
    process.exit();
};

checkTables();
