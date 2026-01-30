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

    const createPublicNotifications = `
        CREATE TABLE IF NOT EXISTS public_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES public_users(id) ON DELETE CASCADE
        )
    `;

    const createStaffNotifications = `
        CREATE TABLE IF NOT EXISTS staff_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            staff_id INT DEFAULT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
            role_id VARCHAR(50) DEFAULT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staff_users(id) ON DELETE CASCADE
        )
    `;

    db.query(createPublicNotifications, (err) => {
        if (err) console.error('Error creating public_notifications:', err);
        else console.log('public_notifications table ready.');

        db.query(createStaffNotifications, (err) => {
            if (err) console.error('Error creating staff_notifications:', err);
            else console.log('staff_notifications table ready.');
            db.end();
        });
    });
});
