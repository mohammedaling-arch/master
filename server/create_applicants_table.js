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

    // Create applicants table
    const createApplicantsTable = `
        CREATE TABLE IF NOT EXISTS applicants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            middle_name VARCHAR(100),
            surname VARCHAR(100) NOT NULL,
            gender ENUM('male', 'female', 'other'),
            age INT,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            address TEXT,
            nin VARCHAR(50),
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    db.query(createApplicantsTable, (err) => {
        if (err) {
            console.error('Error creating applicants table:', err);
            db.end();
            process.exit(1);
        }
        console.log('✓ Applicants table created successfully');

        // Add applicant_id and filed_by_staff_id columns to affidavits table
        const alterAffidavitsTable = `
            ALTER TABLE affidavits 
            ADD COLUMN IF NOT EXISTS applicant_id INT NULL AFTER user_id,
            ADD COLUMN IF NOT EXISTS filed_by_staff_id INT NULL AFTER applicant_id,
            ADD CONSTRAINT fk_affidavits_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
            ADD CONSTRAINT fk_affidavits_staff FOREIGN KEY (filed_by_staff_id) REFERENCES staff_users(id) ON DELETE SET NULL
        `;

        db.query(alterAffidavitsTable, (err) => {
            if (err && err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error altering affidavits table:', err);
            } else {
                console.log('✓ Affidavits table updated with applicant_id and filed_by_staff_id columns');
            }

            // Add applicant_id and filed_by_staff_id columns to probate_applications table
            const alterProbateTable = `
                ALTER TABLE probate_applications 
                ADD COLUMN IF NOT EXISTS applicant_id INT NULL AFTER user_id,
                ADD COLUMN IF NOT EXISTS filed_by_staff_id INT NULL AFTER applicant_id,
                ADD CONSTRAINT fk_probate_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
                ADD CONSTRAINT fk_probate_staff FOREIGN KEY (filed_by_staff_id) REFERENCES staff_users(id) ON DELETE SET NULL
            `;

            db.query(alterProbateTable, (err) => {
                if (err && err.code !== 'ER_DUP_FIELDNAME') {
                    console.error('Error altering probate_applications table:', err);
                } else {
                    console.log('✓ Probate applications table updated with applicant_id and filed_by_staff_id columns');
                }

                console.log('\n✅ Database migration completed successfully!');
                console.log('Applicants table is ready for use.');

                db.end();
            });
        });
    });
});
