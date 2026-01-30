const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function diagnose() {
    console.log('--- Database Diagnosis ---');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });
        console.log('✅ Connection Successful');

        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables in database:', tables.map(t => Object.values(t)[0]));

        const tablesToCheck = ['public_users', 'staff_users'];
        for (const table of tablesToCheck) {
            try {
                const [cols] = await connection.execute(`DESCRIBE ${table}`);
                console.log(`✅ Table ${table} exists. Columns:`, cols.map(c => c.Field).join(', '));
            } catch (e) {
                console.error(`❌ Table ${table} error:`, e.message);
            }
        }

        await connection.end();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

diagnose();
