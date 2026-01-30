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

    console.log('Querying notifications for role "cfo"...');
    db.query('SELECT * FROM staff_notifications WHERE role_id = "cfo" OR role_id = "registrar"', (err, results) => {
        if (err) {
            console.error(err);
        } else {
            console.log(JSON.stringify(results, null, 2));
        }

        console.log('\nChecking staff_users "role" column vs "role_id" column...');
        db.query('SELECT id, name, email, role, role_id FROM staff_users', (err, staff) => {
            if (err) console.error(err);
            else console.log(JSON.stringify(staff, null, 2));
            db.end();
        });
    });
});
