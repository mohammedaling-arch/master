const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'crms_db'
});

db.connect(async (err) => {
    if (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
    console.log('Connected to database. Seeding CFO data...');

    try {
        // 1. Ensure we have a valid public user
        const userSql = `INSERT INTO public_users (first_name, surname, email, password, status, created_at) 
                         VALUES ('John', 'Doe', 'john.doe@example.com', 'hashedpass', 'active', NOW())
                         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`;

        // 1b. Ensure we have a valid STAFF user (CFO)
        // Password 'password123' hash: $2a$10$w.2Z0pQLu9b7jC.d./.5EOlq.d.2Z0pQLu9b7jC.d./.5EOlq (dummy, need real hash or simple check)
        // Accessing bcrypt to hash correctly? No, assume app uses bcrypt.
        // Let's Insert a user with a KNOWN hash for 'password123'
        const cfoSql = `INSERT INTO staff_users (name, email, password, role, created_at) 
                        VALUES ('CFO Admin', 'cfo@highcourt.com', '$2a$10$X7.p/u/..g..x..y..z..', 'cfo', NOW())
                        ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`;
        // Note: I cannot generate a real bcrypt hash here easily without the library.
        // Instead I will update the server/index.js temporarily? No.
        // I will just rely on the fact that I can't login, BUT I proved the route exists via 401.

        // Actually, I can require bcryptjs in this script if it's in node_modules!
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('password123', 10);

        const cfoQuery = `INSERT INTO staff_users (name, email, password, role, status, created_at) 
                          VALUES ('CFO Admin', 'cfo@highcourt.com', '${hash}', 'cfo', 'active', NOW())
                          ON DUPLICATE KEY UPDATE password='${hash}'`;

        db.query(cfoQuery, (err) => {
            if (err) console.error('Staff create error:', err);
            else console.log('CFO User ensured: cfo@highcourt.com / password123');
        });

        db.query(userSql, (err, result) => {
            if (err) throw err;
            const userId = result.insertId;
            console.log('User guaranteed with ID:', userId);

            // 2. Insert/Update Affidavits for testing
            const affidavits = [
                { type: 'Affidavit of Good Conduct', status: 'pending_cfo', content: '<p>Standard content</p>' },
                { type: 'Declaration of Age', status: 'completed', content: '<p>Born in 1990</p>' },
                { type: 'Loss of Document', status: 'pending_cfo', content: '<p>Lost passport</p>' },
                { type: 'Change of Name', status: 'pending_registry', content: '<p>Changing name</p>' }
            ];

            let pending = affidavits.length;

            affidavits.forEach(aff => {
                const sql = `INSERT INTO affidavits (user_id, type, status, content, created_at) 
                             VALUES (?, ?, ?, ?, NOW())`;
                db.query(sql, [userId, aff.type, aff.status, aff.content], (err) => {
                    if (err) console.error(err);
                    else console.log(`Created ${aff.status} affidavit`);

                    pending--;
                    if (pending === 0) {
                        console.log('Seeding complete.');
                        db.end();
                    }
                });
            });
        });

    } catch (error) {
        console.error('Seeding error:', error);
        db.end();
    }
});
