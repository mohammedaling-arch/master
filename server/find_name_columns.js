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
        process.exit(1);
    }
    db.query('SHOW TABLES', (err, tables) => {
        if (err) process.exit(1);
        const tableNames = tables.map(t => Object.values(t)[0]);
        let completed = 0;
        tableNames.forEach(table => {
            db.query(`DESCRIBE ${table}`, (err, columns) => {
                const hasName = columns.some(c => c.Field === 'name');
                if (hasName) {
                    console.log(`Table '${table}' HAS a 'name' column.`);
                } else {
                    console.log(`Table '${table}' DOES NOT have a 'name' column.`);
                }
                completed++;
                if (completed === tableNames.length) {
                    db.end();
                    process.exit(0);
                }
            });
        });
    });
});
