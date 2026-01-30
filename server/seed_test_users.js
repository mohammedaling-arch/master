const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

async function seed() {
    const password = await bcrypt.hash('123456', 10);

    db.connect(async (err) => {
        if (err) throw err;

        console.log('Seeding users...');

        // Clean and Seed Public User
        db.query('DELETE FROM public_users WHERE email = "kubo@gmail.com"', () => {
            db.query('INSERT INTO public_users (first_name, surname, email, password) VALUES (?, ?, ?, ?)',
                ['Kubo', 'Computers', 'kubo@gmail.com', password], (err) => {
                    if (err) console.error('Public seed error:', err);
                    else console.log('Public user seeded: kubo@gmail.com / 123456');

                    // Clean and Seed Staff User
                    db.query('DELETE FROM staff_users WHERE email = "staff@crms.com"', () => {
                        db.query('INSERT INTO staff_users (name, email, password, role) VALUES (?, ?, ?, ?)',
                            ['Judicial Staff', 'staff@crms.com', password, 'admin'], (err) => {
                                if (err) console.error('Staff seed error:', err);
                                else console.log('Staff user seeded: staff@crms.com / 123456');
                                db.end();
                            });
                    });
                });
        });
    });
}

seed();
