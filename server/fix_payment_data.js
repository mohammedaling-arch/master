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
    // Set user_id to NULL where filed_by_staff_id is set. 
    // This fixes records where the staff's ID was incorrectly stored as the user's ID.
    const sql = "UPDATE payments SET user_id = NULL WHERE filed_by_staff_id IS NOT NULL";
    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log(`Updated ${result.affectedRows} payment records to remove incorrect user_id associations.`);
        db.end();
    });
});
