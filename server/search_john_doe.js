const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    db.query('SELECT p.*, app.first_name as app_f, app.surname as app_s, u.first_name as u_f, u.surname as u_s FROM payments p LEFT JOIN applicants app ON p.applicant_id = app.id LEFT JOIN public_users u ON p.user_id = u.id', (err, results) => {
        if (err) throw err;
        results.forEach(r => {
            const f = r.app_f || r.u_f;
            const s = r.app_s || r.u_s;
            if (f === 'John' || s === 'Doe') {
                console.log('Found John Doe in payment association:', r);
            }
        });
        db.end();
    });
});
