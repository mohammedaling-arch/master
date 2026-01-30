const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const sql = `
CREATE TABLE IF NOT EXISTS affidavit_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    amount DECIMAL(10, 2) DEFAULT 2000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(sql, (err) => {
    if (err) {
        console.error('Error creating affidavit_templates table:', err);
    } else {
        console.log('affidavit_templates table ready');

        // Seed some initial data if empty
        db.query('SELECT COUNT(*) as count FROM affidavit_templates', (err, results) => {
            if (results[0].count === 0) {
                const initialTemplates = [
                    ['Affidavit of Good Conduct', '<p>I, <strong>[NAME]</strong>, of Borno State, do hereby solemnly swear and declare that I have been a person of good conduct and high moral character throughout my stay in this jurisdiction...</p>', 2500.00],
                    ['Affidavit of Loss', '<p>I, <strong>[NAME]</strong>, resident of [ADDRESS], do hereby state that on [DATE], I lost my original [DOCUMENT NAME] under the following circumstances: ...</p>', 2000.00],
                    ['Affidavit of Identity', '<p>I, <strong>[NAME]</strong>, do solemnly swear that I am the same person whose photograph and signature appear on the attached documents, and that my real name is as stated above...</p>', 1500.00]
                ];

                db.query('INSERT INTO affidavit_templates (title, content, amount) VALUES ?', [initialTemplates], (err) => {
                    if (err) console.error('Error seeding templates:', err);
                    else console.log('Initial templates seeded');
                    process.exit();
                });
            } else {
                process.exit();
            }
        });
    }
});
