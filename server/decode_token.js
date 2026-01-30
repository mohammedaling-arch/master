const mysql = require('mysql2');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

// Get token from command line argument
const token = process.argv[2];

if (!token) {
    console.log('Usage: node decode_token.js <JWT_TOKEN>');
    console.log('\nTo get your token:');
    console.log('1. Open browser console (F12)');
    console.log('2. Run: localStorage.getItem("token")');
    console.log('3. Copy the token and paste here');
    process.exit(1);
}

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('\n✅ Token is valid!');
    console.log('Decoded payload:', decoded);

    // Check if user exists
    const db = require('mysql2').createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    db.connect((err) => {
        if (err) {
            console.error('DB Error:', err);
            return;
        }

        db.query('SELECT id, email, last_seen, is_online FROM public_users WHERE id = ?', [decoded.id], (err, results) => {
            if (err) {
                console.error('Query error:', err);
            } else if (results.length === 0) {
                console.log('\n❌ WARNING: User ID', decoded.id, 'does NOT exist in database!');
            } else {
                console.log('\n✅ User found in database:');
                console.table(results);
            }
            db.end();
        });
    });

} catch (err) {
    console.error('\n❌ Invalid token:', err.message);
}
