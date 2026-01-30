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

    // Step 1: Create roles table
    const createRolesTable = `
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;

    db.query(createRolesTable, (err) => {
        if (err) {
            console.error('Error creating roles table:', err);
            db.end();
            process.exit(1);
        }
        console.log('✓ Roles table created successfully.');

        // Step 2: Insert existing roles from staff_users
        const insertRoles = `
            INSERT IGNORE INTO roles (name, display_name, description) VALUES
            ('admin', 'Administrator', 'Full system access and management'),
            ('registrar', 'Registrar', 'Handles registration and initial review'),
            ('cr', 'Court Registrar', 'Court registry management'),
            ('cfo', 'Chief Filing Officer', 'Reviews and approves affidavits'),
            ('jurat', 'Jurat Officer', 'Files affidavits on behalf of applicants')
        `;

        db.query(insertRoles, (err) => {
            if (err) {
                console.error('Error inserting roles:', err);
                db.end();
                process.exit(1);
            }
            console.log('✓ Default roles inserted successfully.');

            // Step 3: Add role_id column to staff_users
            const addRoleIdColumn = `
                ALTER TABLE staff_users 
                ADD COLUMN role_id INT DEFAULT NULL AFTER role,
                ADD CONSTRAINT fk_staff_role FOREIGN KEY (role_id) REFERENCES roles(id)
            `;

            db.query(addRoleIdColumn, (err) => {
                if (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        console.log('✓ role_id column already exists.');
                        updateRoleIds();
                    } else {
                        console.error('Error adding role_id column:', err);
                        db.end();
                        process.exit(1);
                    }
                } else {
                    console.log('✓ role_id column added successfully.');
                    updateRoleIds();
                }
            });
        });
    });
});

function updateRoleIds() {
    // Step 4: Update role_id based on existing role column
    const updateRoleIds = `
        UPDATE staff_users s
        INNER JOIN roles r ON s.role = r.name
        SET s.role_id = r.id
        WHERE s.role_id IS NULL
    `;

    db.query(updateRoleIds, (err, result) => {
        if (err) {
            console.error('Error updating role_id:', err);
            db.end();
            process.exit(1);
        }
        console.log(`✓ Updated ${result.affectedRows} staff users with role_id.`);

        // Verify the migration
        verifyMigration();
    });
}

function verifyMigration() {
    const verifyQuery = `
        SELECT s.id, s.name, s.email, s.role, r.name as role_name, s.role_id
        FROM staff_users s
        LEFT JOIN roles r ON s.role_id = r.id
        LIMIT 5
    `;

    db.query(verifyQuery, (err, results) => {
        if (err) {
            console.error('Error verifying migration:', err);
        } else {
            console.log('\n✓ Migration verification (sample):');
            console.table(results);
        }

        db.end();
        console.log('\n✅ Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update server.js to use role_id instead of role');
        console.log('2. Update frontend to fetch roles from /api/roles');
        console.log('3. Test thoroughly before removing the old role column');
    });
}
