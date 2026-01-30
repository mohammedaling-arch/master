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
    SELECT 
        (SELECT COUNT(*) FROM public_users) as total_users,
        (SELECT COUNT(*) FROM staff_users) as total_staff,
        (SELECT COUNT(*) FROM affidavit_templates) as total_templates,
        (SELECT COUNT(*) FROM banners) as total_banners,
        (SELECT COUNT(*) FROM activity_logs WHERE timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recent_activities,
        (SELECT COUNT(*) FROM activity_logs) as total_activities,
        (SELECT timestamp FROM activity_logs ORDER BY timestamp DESC LIMIT 1) as last_activity
`;

db.query(sql, (err, results) => {
    if (err) {
        console.error('SQL Error:', err);
    } else {
        console.log('Results:', results[0]);
    }
    process.exit();
});
