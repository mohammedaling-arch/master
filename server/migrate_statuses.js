const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'crms_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Connected to database. Starting migration...');

async function migrateStatuses() {
    try {
        // Migrate 'pending_registry' and 'pending_cfo' and 'pending' to 'submitted'
        // This unifies all "in-progress" items to the new initial state 'submitted'
        const updateQuery = `
            UPDATE affidavits 
            SET status = 'submitted' 
            WHERE status IN ('pending_registry', 'pending_cfo', 'pending')
        `;

        db.query(updateQuery, (err, result) => {
            if (err) {
                console.error('Error migrating statuses:', err);
                process.exit(1);
            }

            console.log(`Migration successful.`);
            console.log(`Updated ${result.changedRows} records to 'submitted'.`);

            // Optional: Check current distribution
            db.query('SELECT status, COUNT(*) as count FROM affidavits GROUP BY status', (err, results) => {
                if (err) console.error(err);
                console.log('Current Status Distribution:', results);
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateStatuses();
