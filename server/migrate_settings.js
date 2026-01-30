const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(async err => {
    if (err) {
        console.error('DB Connect Error:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    const runQuery = (sql) => new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });

    try {
        // 1. Create system_settings table
        console.log('Creating system_settings table...');
        await runQuery(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(50) UNIQUE NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Insert default settings if not exists
        await runQuery(`
            INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES 
            ('court_stamp_path', ''),
            ('commissioner_name', 'HON. IBRAHIM MOHAMMED'),
            ('commissioner_signature_path', '')
        `);

        // 2. Add signature_path to staff_users
        console.log('Checking staff_users table...');
        const columns = await runQuery(`SHOW COLUMNS FROM staff_users LIKE 'signature_path'`);
        if (columns.length === 0) {
            console.log('Adding signature_path column...');
            await runQuery(`ALTER TABLE staff_users ADD COLUMN signature_path VARCHAR(255) DEFAULT NULL`);
        } else {
            console.log('signature_path column already exists.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
});
