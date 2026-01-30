const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to DB:', err);
        return;
    }

    console.log('=== MySQL Timezone Check ===\n');

    // Check MySQL timezone settings
    db.query("SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP()", (err, results) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('MySQL Timezone Settings:');
            console.table(results);
        }

        // Check what's currently in the database
        db.query("SELECT id, email, last_seen, UTC_TIMESTAMP() as current_utc FROM public_users WHERE id = 6", (err, results2) => {
            if (err) {
                console.error('Error:', err);
            } else {
                console.log('\nUser 6 data:');
                console.table(results2);

                if (results2.length > 0) {
                    const lastSeen = new Date(results2[0].last_seen);
                    const currentUTC = new Date(results2[0].current_utc);
                    console.log('\nTime Comparison:');
                    console.log('last_seen (from DB):', lastSeen.toISOString());
                    console.log('UTC_TIMESTAMP():', currentUTC.toISOString());
                    console.log('Diff (seconds):', Math.floor((currentUTC - lastSeen) / 1000));
                }
            }
            db.end();
        });
    });
});
