const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const staffId = 7; // As seen in check_jurat_payments.js

const sql = `
    SELECT p.*, 
           COALESCE(app.first_name, u.first_name) as first_name,
           COALESCE(app.surname, u.surname) as surname,
           COALESCE(app.email, u.email) as email,
           COALESCE(app.phone, u.phone) as phone,
           COALESCE(app.address, u.address) as address,
           COALESCE(app.gender, u.gender) as gender,
           COALESCE(app.age, u.age) as age,
           COALESCE(app.nin, u.nin) as nin,
           p.created_at as payment_date,
           a.type as affidavit_title, 
           pr.deceased_name
    FROM payments p
    LEFT JOIN applicants app ON p.applicant_id = app.id
    LEFT JOIN public_users u ON p.user_id = u.id
    LEFT JOIN affidavits a ON p.affidavit_id = a.id
    LEFT JOIN probate_applications pr ON p.probate_application_id = pr.id
    WHERE p.filed_by_staff_id = ?
    ORDER BY p.created_at DESC
`;

db.connect(err => {
    if (err) process.exit(1);
    db.query(sql, [staffId], (err, results) => {
        if (err) console.error(err);
        else {
            console.log('--- Payment Results Details ---');
            results.forEach((r, i) => {
                console.log(`Result ${i}: Name=${r.first_name} ${r.surname}, Email=${r.email}, Phone=${r.phone}`);
            });
        }
        db.end();
    });
});
