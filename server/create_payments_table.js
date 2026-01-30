const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');

    db.query('DROP TABLE IF EXISTS payments', (err) => {
        if (err) console.error('Error dropping table:', err);

        const createPaymentsTable = `
            CREATE TABLE payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                applicant_id INT NOT NULL,
                affidavit_id INT NULL,
                probate_application_id INT NULL,
                item_paid VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
                transaction_id VARCHAR(100),
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES public_users(id) ON DELETE CASCADE,
                FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
                FOREIGN KEY (affidavit_id) REFERENCES affidavits(id) ON DELETE SET NULL,
                FOREIGN KEY (probate_application_id) REFERENCES probate_applications(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        db.query(createPaymentsTable, (err) => {
            if (err) {
                console.error('Error creating payments table:', err);
            } else {
                console.log('✓ Payments table created successfully with user_id');
            }
            db.end();
        });
    });
});
