const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    db.query('SELECT * FROM roles', (err, results) => {
        if (err) {
            console.error('Error fetching roles:', err);
            db.end();
            process.exit(1);
        }

        console.log('\n✅ Roles Table Data:');
        console.table(results);

        db.query('SELECT id, name, role, role_id FROM staff_users LIMIT 5', (err, staff) => {
            if (err) {
                console.error('Error fetching staff:', err);
            } else {
                console.log('\n✅ Staff Users (with role_id):');
                console.table(staff);
            }
            db.end();
        });
    });
});
