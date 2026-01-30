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

    // Add columns to affidavits table
    const alterAffidavits1 = 'ALTER TABLE affidavits ADD COLUMN applicant_id INT NULL AFTER user_id';
    const alterAffidavits2 = 'ALTER TABLE affidavits ADD COLUMN filed_by_staff_id INT NULL AFTER applicant_id';

    db.query(alterAffidavits1, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Error adding applicant_id to affidavits:', err.message);
        } else if (err && err.code === 'ER_DUP_FIELDNAME') {
            console.log('✓ applicant_id column already exists in affidavits');
        } else {
            console.log('✓ Added applicant_id column to affidavits');
        }

        db.query(alterAffidavits2, (err) => {
            if (err && err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error adding filed_by_staff_id to affidavits:', err.message);
            } else if (err && err.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ filed_by_staff_id column already exists in affidavits');
            } else {
                console.log('✓ Added filed_by_staff_id column to affidavits');
            }

            // Add columns to probate_applications table
            const alterProbate1 = 'ALTER TABLE probate_applications ADD COLUMN applicant_id INT NULL AFTER user_id';
            const alterProbate2 = 'ALTER TABLE probate_applications ADD COLUMN filed_by_staff_id INT NULL AFTER applicant_id';

            db.query(alterProbate1, (err) => {
                if (err && err.code !== 'ER_DUP_FIELDNAME') {
                    console.error('Error adding applicant_id to probate_applications:', err.message);
                } else if (err && err.code === 'ER_DUP_FIELDNAME') {
                    console.log('✓ applicant_id column already exists in probate_applications');
                } else {
                    console.log('✓ Added applicant_id column to probate_applications');
                }

                db.query(alterProbate2, (err) => {
                    if (err && err.code !== 'ER_DUP_FIELDNAME') {
                        console.error('Error adding filed_by_staff_id to probate_applications:', err.message);
                    } else if (err && err.code === 'ER_DUP_FIELDNAME') {
                        console.log('✓ filed_by_staff_id column already exists in probate_applications');
                    } else {
                        console.log('✓ Added filed_by_staff_id column to probate_applications');
                    }

                    console.log('\n✅ Database migration completed!');
                    db.end();
                });
            });
        });
    });
});
