const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function test() {
    console.log('Testing connection with:');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });
        console.log('Successfully connected to the database!');
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('Query result:', rows[0].result);
        await connection.end();
    } catch (err) {
        console.error('Connection failed:');
        console.error(err);
    }
}

test();
