process.env.TZ = 'Africa/Lagos'; // Forces Node.js to WAT (GMT+1)
const path = require('path');
const fs = require('fs');
require('dotenv').config({
    path: '.env',
    override: true,
    debug: true
});
console.log("SERVER VERSION: 3105-FIX-APPLIED");
const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendAffidavitNotification, sendVerificationEmail, sendResetPasswordEmail, sendEmailNotification, sendStaffCredentialsEmail } = require('./emailService');
const multer = require('multer');
const { generateToken04 } = require('./utils/zegoTokenGenerator');
const { generateAffidavitPDF, generateProbateLetterPDF, GENERATOR_VERSION } = require('./pdfGenerator');
console.log(`[INIT] PDF Generator Version: ${GENERATOR_VERSION} (Live)`);

const app = express();
app.use(cors({
    origin: '*', // Allow any origin (for mobile LAN access)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Handle double /api/api prefix from proxy misconfiguration
app.use('/api/api', (req, res, next) => {
    req.url = req.url.replace('/api', '');
    next();
});

// Global Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[INCOMING] ${req.method} ${req.originalUrl}`);
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[COMPLETED] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

app.get('/debug/routes', (req, res) => {
    const routes = [];
    const print = (path, layer) => {
        if (layer.route) {
            layer.route.stack.forEach(s => routes.push(`${s.method.toUpperCase()} ${path}${layer.route.path}`));
        } else if (layer.name === 'router' && layer.handle.stack) {
            layer.handle.stack.forEach(l => print(path + (layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '')), l));
        }
    };
    app._router.stack.forEach(layer => print('', layer));
    res.json([...new Set(routes)]);
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    }
}));

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+01:00' // Explicitly sets the connection to GMT+1
});


db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database via pool');

    // Ensure applicant table has legacy columns for picture and signature
    db.query("SHOW COLUMNS FROM affidavits LIKE 'meeting_id'", (err, result) => {
        if (!err && result.length === 0) {
            db.query("ALTER TABLE affidavits ADD COLUMN meeting_id VARCHAR(255) NULL AFTER status", (err) => {
                if (err) console.error("Failed to add meeting_id column:", err);
                else console.log("Added meeting_id column to affidavits table");
            });
        }
    });
});

// Middleware: Authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.warn('Auth Failed: No token provided');
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Auth Failed: Invalid token', err.message);
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
};

// Middleware: Admin Authorization
const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.type === 'staff' && req.user.role === 'admin') {
        next();
    } else {
        console.warn('Auth Failed: Admin privileges required. User:', req.user);
        res.status(403).json({
            error: 'DEBUG: Access denied. Admin privileges required.',
            roleReceived: req.user?.role,
            typeReceived: req.user?.type
        });
    }
};

// Middleware: Activity Logging
const logActivity = (req, res, next) => {
    // Don't block the request - call next() immediately
    next();

    // Log activity asynchronously
    try {
        const userId = req.user?.id || null;
        let userType = req.user?.type;

        // Ensure userType matches ENUM('public', 'staff') or is NULL
        if (userType !== 'public' && userType !== 'staff') {
            userType = null;
        }

        const action = `${req.method} ${req.originalUrl}`;
        const ip = req.ip || req.connection.remoteAddress;

        db.query(
            'INSERT INTO activity_logs (user_id, user_type, action, ip_address) VALUES (?, ?, ?, ?)',
            [userId, userType, action, ip],
            (err) => {
                if (err) {
                    console.error('Error logging activity:', err.message);
                    console.error('Failed to log:', { userId, userType, action, ip });
                }
            }
        );
    } catch (error) {
        console.error('Exception in logActivity middleware:', error);
    }
};

// Notification Endpoints
app.get('/api/notifications/public', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM public_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/notifications/staff', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    // Fetch notifications for the specific staff member OR their role
    const sql = `
        SELECT * FROM staff_notifications 
        WHERE (staff_id = ? OR role_id = ?) 
        ORDER BY created_at DESC LIMIT 50
    `;

    db.query(sql, [req.user.id, req.user.role], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.put('/api/notifications/public/:id/read', authenticateToken, (req, res) => {
    db.query('UPDATE public_notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Marked as read' });
    });
});

app.put('/api/notifications/staff/:id/read', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    // Allow marking as read if it's assigned to this staff OR for their role
    db.query('UPDATE staff_notifications SET is_read = TRUE WHERE id = ? AND (staff_id = ? OR role_id = ?)',
        [req.params.id, req.user.id, req.user.role], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Marked as read' });
        });
});

app.delete('/api/notifications/public/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM public_notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Notification deleted' });
    });
});

app.delete('/api/notifications/staff/:id', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });
    db.query('DELETE FROM staff_notifications WHERE id = ? AND staff_id = ?', [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Notification deleted' });
    });
});



app.get('/api/diag', (req, res) => {
    db.query('SELECT 1 + 1 AS result', (err, results) => {
        if (err) return res.status(500).json({ status: 'DB Error', error: err.message });
        res.json({ status: 'OK', result: results[0].result, envHost: process.env.DB_HOST });
    });
});




// ZegoCloud Token Endpoint
app.get('/api/zego/token', (req, res) => {
    const appID = parseInt(process.env.APP_ID || process.env.ZEGO_APP_ID);
    const serverSecret = process.env.SERVER_SECRET || process.env.ZEGO_SERVER_SECRET;
    const userId = req.query.userId;
    const roomId = req.query.roomId;

    if (!appID || !serverSecret) {
        console.error('ZegoCloud configured incorrectly: Missing Keys');
        return res.status(500).json({ error: 'ZegoCloud keys not configured' });
    }

    if (!userId || !roomId) {
        return res.status(400).json({ error: 'UserId and RoomId are required' });
    }

    const effectiveTimeInSeconds = 7200; // 2 hours
    const payload = '';

    try {
        const token = generateToken04(appID, userId, serverSecret, effectiveTimeInSeconds, payload);
        res.json({ token, appID });
    } catch (error) {
        console.error('Error generating ZegoCloud token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

app.get('/api/auth/check', authenticateToken, (req, res) => {
    res.json({
        user: req.user,
        serverTime: new Date()
    });
});



app.get(['/api/public-test/stats', '/public-test/stats'], (req, res) => {
    console.log('Public Connectivity Test Requested');
    const sql = 'SELECT (SELECT COUNT(*) FROM public_users) as users';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...results[0], note: "Public Test Success" });
    });
});

app.get(['/api/admin/system/stats', '/admin/system/stats'], authenticateToken, (req, res) => {
    console.log(`Admin System Stats Requested by: ${req.user.email}`);
    if (req.user.type !== 'staff' || req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM public_users) as total_users,
            (SELECT COUNT(*) FROM staff_users) as total_staff,
            (SELECT COUNT(*) FROM affidavit_templates) as total_templates,
            (SELECT COUNT(*) FROM banners) as total_banners,
            (SELECT COUNT(*) FROM activity_logs WHERE \`timestamp\` > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recent_activities,
            (SELECT COUNT(*) FROM activity_logs) as total_activities,
            (SELECT \`timestamp\` FROM activity_logs ORDER BY \`timestamp\` DESC LIMIT 1) as last_activity
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

// Verification Routes (Public)
require('./verificationRoutes')(app, db);

// Old Verification Routes (Shadowed by above)
// app.get(['/api/verify/affidavit/:id', '/verify/affidavit/:id'], (req, res) => {
/*
let appId = req.params.id;
let dbId = appId;
if (appId && appId.toUpperCase().startsWith('CRMS-')) {
    dbId = appId.substring(5);
}
const sql = `
        SELECT 
            a.id,
            a.application_id, 
            a.approved_at, 
            a.template_data,
            CONCAT(u.first_name, ' ', u.surname) as deponent_name,
            s.name as commissioner_name
        FROM affidavits a
        LEFT JOIN public_users u ON a.user_id = u.id
        LEFT JOIN staff_users s ON a.approved_by = s.id
        WHERE (a.application_id = ? OR a.id = ?) AND a.status = 'approved'
    `;

db.query(sql, [appId, dbId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Valid approved affidavit not found with this ID.' });

    const data = results[0];
    let contentSnippet = '';
    try {
        const tmpl = typeof data.template_data === 'string' ? JSON.parse(data.template_data) : data.template_data;
        contentSnippet = tmpl.heading || tmpl.content || 'Affidavit Declaration';
        if (contentSnippet.length > 100) contentSnippet = contentSnippet.substring(0, 100) + '...';

        // Override deponent name if in template data
        if (tmpl.deponent_name) data.deponent_name = tmpl.deponent_name;
    } catch (e) {
        contentSnippet = 'Content available on physical document';
    }

    res.json({
        application_id: `CRMS-${data.id}`,
        deponent_name: data.deponent_name,
        commissioner_name: data.commissioner_name,
        approved_at: data.approved_at,
        content_snippet: contentSnippet
    });
});
});

app.get(['/api/verify/probate/:id', '/verify/probate/:id'], (req, res) => {
    let appId = req.params.id;
    let dbId = appId;
    const sql = `
        SELECT 
            p.id,
            p.application_id, 
            p.created_at as completed_at, 
            p.deceased_name,
            p.estate_type,
            CONCAT(u.first_name, ' ', u.surname) as applicant_name
        FROM probate_applications p
        LEFT JOIN public_users u ON p.user_id = u.id
        WHERE (p.application_id = ? OR p.id = ?) AND p.status IN ('approved', 'issued', 'completed')
    `;

    db.query(sql, [appId, dbId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Valid completed probate application not found with this ID.' });

        const data = results[0];
        res.json({
            application_id: data.application_id || `PRB/${data.id}`,
            deceased_name: data.deceased_name,
            applicant_name: data.applicant_name,
            completed_at: data.completed_at,
            estate_type: data.estate_type
        });
    });
});
*/


// Auth Routes for Public Users
app.post('/api/public/register', async (req, res) => {
    console.log('--- Registration Attempt ---');
    const { firstName, middleName, surname, gender, age, email, phone, address, nin, password } = req.body;

    try {
        // Check if user already exists
        db.query('SELECT id FROM public_users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length > 0) return res.status(400).json({ status: 'error', message: 'Email already registered' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = crypto.randomBytes(32).toString('hex');

            const sql = 'INSERT INTO public_users (first_name, middle_name, surname, gender, age, email, phone, address, nin, password, email_verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(sql, [firstName, middleName, surname, gender, age, email, phone, address, nin, hashedPassword, verificationToken], async (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                // Send verification email
                await sendVerificationEmail(email, firstName, verificationToken);

                res.status(201).json({
                    status: 'success',
                    message: 'User registered successfully. Please check your email to verify your account.'
                });
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Email Verification Endpoint
app.get('/api/auth/verify-email', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    db.query('SELECT id FROM public_users WHERE email_verification_token = ?', [token], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(400).json({ error: 'Invalid or expired verification token' });

        const userId = results[0].id;
        db.query('UPDATE public_users SET is_email_verified = 1, email_verification_token = NULL WHERE id = ?', [userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Email verified successfully! You can now log in.' });
        });
    });
});

// Forgot Password Request
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    db.query('SELECT id, first_name FROM public_users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            // For security, don't reveal if user exists
            return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        const user = results[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Calculate expiration: 1 hour from now in UTC format
        const expires = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');

        db.query('UPDATE public_users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?', [resetToken, expires, user.id], async (err) => {
            if (err) return res.status(500).json({ error: err.message });

            await sendResetPasswordEmail(email, user.first_name, resetToken);
            res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        });
    });
});

// Reset Password Execution
app.post('/api/auth/reset-password', (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });

    // Use UTC NOW() to match the 'Z' timezone configuration
    db.query('SELECT id FROM public_users WHERE reset_password_token = ? AND reset_password_expires > NOW()', [token], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });

        const userId = results[0].id;
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query('UPDATE public_users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?', [hashedPassword, userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
        });
    });
});

app.post('/api/public/login', (req, res) => {
    const { email, password, captchaToken } = req.body;
    console.log(`[Public Login] Attempt for email: ${email}`);

    // Check if captcha is required
    db.query('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ("captcha_enabled", "captcha_secret_key")', async (err, settingsResults) => {
        if (err) {
            console.error('[Public Login] Database error:', err);
            return res.status(500).json({ error: 'Database error checking settings' });
        }

        const settings = {};
        settingsResults.forEach(r => settings[r.setting_key] = r.setting_value);

        if (settings.captcha_enabled === '1') {
            if (!captchaToken) {
                return res.status(400).json({ message: 'reCAPTCHA verification is required' });
            }

            try {
                const verRes = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${settings.captcha_secret_key}&response=${captchaToken}`);
                if (!verRes.data.success) {
                    return res.status(400).json({ message: 'reCAPTCHA verification failed' });
                }
            } catch (verErr) {
                console.error('reCAPTCHA verification error:', verErr);
                return res.status(500).json({ message: 'External verification service error' });
            }
        }

        const sql = 'SELECT * FROM public_users WHERE email = ?';
        db.query(sql, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

            try {
                const user = results[0];

                if (!user.is_email_verified) {
                    return res.status(401).json({
                        message: 'Please verify your email address before logging in.',
                        needsVerification: true
                    });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

                const token = jwt.sign({ id: user.id, type: 'public' }, process.env.JWT_SECRET, { expiresIn: '1d' });

                // Prepare user object (exclude password)
                const userProfile = { ...user };
                delete userProfile.password;
                userProfile.role_display_name = 'Applicant';

                // Add camelCase aliases for legacy frontend support
                userProfile.firstName = user.first_name;
                userProfile.middleName = user.middle_name;

                res.json({
                    token,
                    user: userProfile
                });
            } catch (error) {
                console.error('Login processing error:', error);
                res.status(500).json({ error: 'Internal server error during login', message: error.message });
            }
        });
    });
});
// Profile Upload Config
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const type = file.fieldname === 'signature' ? 'sig' : 'avatar';
        // req.user is populated by authenticateToken, so this middleware must come AFTER auth
        cb(null, `${type}-${req.user.id}-${Date.now()}${ext}`);
    }
});
const profileUpload = multer({ storage: profileStorage });

// Get Current Public User Profile
app.get('/api/public/profile', authenticateToken, (req, res) => {
    db.query('SELECT * FROM public_users WHERE id = ?', [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        const user = results[0];
        delete user.password;
        user.role_display_name = 'Applicant';
        res.json(user);
    });
});

// Public User Profile Update with Uploads
app.put('/api/public/profile', authenticateToken, profileUpload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]), (req, res) => {
    const { first_name, middle_name, surname, phone, address, nin } = req.body;
    const userId = req.user.id;

    let updates = [];
    let params = [];

    if (first_name) { updates.push('first_name = ?'); params.push(first_name); }
    if (middle_name) { updates.push('middle_name = ?'); params.push(middle_name); }
    if (surname) { updates.push('surname = ?'); params.push(surname); }
    if (phone) { updates.push('phone = ?'); params.push(phone); }
    if (address) { updates.push('address = ?'); params.push(address); }
    if (nin) { updates.push('nin = ?'); params.push(nin); }

    if (req.files && req.files['avatar']) {
        updates.push('profile_pic = ?');
        params.push(`/uploads/${req.files['avatar'][0].filename}`);
    }
    if (req.files && req.files['signature']) {
        updates.push('signature_path = ?');
        params.push(`/uploads/${req.files['signature'][0].filename}`);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No changes provided' });

    params.push(userId);
    const sql = `UPDATE public_users SET ${updates.join(', ')} WHERE id = ?`;

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Return updated user object
        db.query('SELECT * FROM public_users WHERE id = ?', [userId], (err, results) => {
            if (err || results.length === 0) return res.json({ message: 'Profile updated' });
            const user = results[0];
            delete user.password;
            user.role_display_name = 'Applicant';
            res.json({ message: 'Profile updated', user });
        });
    });
});

// Public User Change Password
app.put('/api/public/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    db.query('SELECT password FROM public_users WHERE id = ?', [userId], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, results[0].password);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE public_users SET password = ? WHERE id = ?', [hashedPassword, userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Password updated successfully' });
        });
    });
});

// Auth Routes for Staff Users
app.post('/api/staff/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`[Staff Login] Attempt for email: ${email}`);
    const sql = `
        SELECT s.*, r.display_name as role_display_name 
        FROM staff_users s 
        LEFT JOIN roles r ON s.role_id = r.id 
        WHERE s.email = ?
    `;
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        try {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

            const token = jwt.sign({ id: user.id, type: 'staff', role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({
                token,
                forcePasswordChange: !!user.force_password_change,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    role_display_name: user.role_display_name,
                    signature_path: user.signature_path,
                    division: user.division
                }
            });
        } catch (error) {
            console.error('Staff Login processing error:', error);
            res.status(500).json({ error: 'Internal server error during login', message: error.message });
        }
    });
});

// Get Current Staff Profile
app.get('/api/staff/profile', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    const sql = `
        SELECT s.id, s.name, s.email, s.role, s.role_id, s.division, s.signature_path,
               r.display_name as role_display_name
        FROM staff_users s
        LEFT JOIN roles r ON s.role_id = r.id
        WHERE s.id = ?
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
    });
});

// Update Staff Profile (Name, Division, Signature)
app.put('/api/staff/profile', authenticateToken, profileUpload.single('signature'), (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    const { name, division, email } = req.body; // Email usually read-only but here for completeness if needed
    const userId = req.user.id;
    let updates = [];
    let params = [];

    // Only allow signature update as requested by user ("all fields are deactivated except signature upload")
    if (req.file) {
        updates.push('signature_path = ?');
        params.push(`/uploads/${req.file.filename}`);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No changes provided' });

    params.push(userId);
    const sql = `UPDATE staff_users SET ${updates.join(', ')} WHERE id = ?`;

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Return updated staff object
        const fetchSql = `
            SELECT s.id, s.name, s.email, s.role, s.role_id, s.division, s.signature_path,
                   r.display_name as role_display_name
            FROM staff_users s
            LEFT JOIN roles r ON s.role_id = r.id
            WHERE s.id = ?
        `;
        db.query(fetchSql, [userId], (err, results) => {
            if (err || results.length === 0) return res.json({ message: 'Profile updated' });
            res.json({ message: 'Profile updated', user: results[0] });
        });
    });
});

// Staff Change Password (moved up to avoid conflict with /api/staff/:id)
app.put('/api/staff/change-password', authenticateToken, async (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    db.query('SELECT password FROM staff_users WHERE id = ?', [userId], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(String(currentPassword), String(results[0].password));
        if (!isMatch) {
            console.warn(`[Password Change] Incorrect current password for user ID: ${userId}`);
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE staff_users SET password = ?, force_password_change = 0 WHERE id = ?', [hashedPassword, userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Password updated successfully' });
        });
    });
});



// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed!'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Notification Helpers
const createPublicNotification = (userId, title, message, type = 'info') => {
    const sql = 'INSERT INTO public_notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)';
    db.query(sql, [userId, title, message, type], (err) => {
        if (err) {
            console.error('[Notification Error] Public:', err);
        } else {
            // Also send Email
            db.query('SELECT email, first_name FROM public_users WHERE id = ?', [userId], async (fetchErr, results) => {
                if (!fetchErr && results.length > 0 && results[0].email) {
                    console.log(`[Email Trigger] Sending notification email to: ${results[0].email}`);
                    await sendEmailNotification(results[0].email, title, title, `Dear ${results[0].first_name}, <br><br>${message}`);
                } else if (fetchErr) {
                    console.error('[Notification Email Error] Failed to fetch user email:', fetchErr);
                } else {
                    console.warn(`[Notification Email Warn] No email found for user ID: ${userId}`);
                }
            });
        }
    });
};

const createStaffNotification = (staffId, title, message, type = 'info', roleId = null) => {
    const sql = 'INSERT INTO staff_notifications (staff_id, title, message, type, role_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [staffId, title, message, type, roleId], (err) => {
        if (err) {
            console.error('[Notification Error] Staff:', err);
        } else {
            // Also send Email
            if (staffId) {
                db.query('SELECT email, first_name FROM staff_users WHERE id = ?', [staffId], async (fetchErr, results) => {
                    if (!fetchErr && results.length > 0 && results[0].email) {
                        await sendEmailNotification(results[0].email, title, title, `Dear ${results[0].first_name}, <br><br>${message}`);
                    }
                });
            } else if (roleId) {
                // For role-based notifications, send to all staff in that role
                db.query('SELECT email, first_name FROM staff_users WHERE role = ?', [roleId], async (fetchErr, results) => {
                    if (!fetchErr && results.length > 0) {
                        for (const staff of results) {
                            if (staff.email) await sendEmailNotification(staff.email, title, title, `Dear ${staff.first_name}, <br><br>${message}`);
                        }
                    }
                });
            }
        }
    });
};

// Global Notifications to all staff (e.g. for new applications)
const notifyAllStaff = (title, message, type = 'info') => {
    db.query('SELECT id FROM staff_users', (err, results) => {
        if (!err) {
            results.forEach(staff => createStaffNotification(staff.id, title, message, type));
        }
    });
};

// Notify staff by role (e.g. notify all 'registrar' or 'cfo' staff)
const notifyStaffByRole = (role, title, message, type = 'info') => {
    // Handle both single role string and array of roles
    const roles = Array.isArray(role) ? role : [role];

    roles.forEach(roleName => {
        const sql = 'INSERT INTO staff_notifications (staff_id, title, message, type, role_id) VALUES (NULL, ?, ?, ?, ?)';
        db.query(sql, [title, message, type, roleName], (err) => {
            if (err) {
                console.error(`[Notification Error] Role-based (${roleName}):`, err);
            } else {
                // Also send Email to all staff with this role
                db.query('SELECT email, first_name FROM staff_users WHERE role = ?', [roleName], async (fetchErr, results) => {
                    if (!fetchErr && results.length > 0) {
                        for (const staff of results) {
                            if (staff.email) await sendEmailNotification(staff.email, title, title, `Dear ${staff.first_name}, <br><br>${message}`);
                        }
                    }
                });
            }
        });
    });
};

// Settings endpoints
app.get('/api/settings', (req, res) => {
    db.query('SELECT * FROM system_settings', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        results.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    });
});

// Bulk update settings (Admin only)
app.put('/api/settings/bulk', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff' || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { settings } = req.body; // Expecting { key1: val1, key2: val2 }
    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings object' });
    }

    const keys = Object.keys(settings);
    if (keys.length === 0) return res.json({ message: 'No changes provided' });

    let completed = 0;
    let errors = [];

    keys.forEach(key => {
        const value = String(settings[key]);
        const sql = 'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?';
        db.query(sql, [key, value, value], (err) => {
            completed++;
            if (err) errors.push({ key, error: err.message });

            if (completed === keys.length) {
                if (errors.length > 0) {
                    return res.status(500).json({ message: 'Settings update partially failed', errors });
                }
                res.json({ message: 'All settings updated successfully' });
            }
        });
    });
});

app.post('/api/settings/stamp', upload.single('stamp'), logActivity, (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Determine the setting key based on type
    const { type } = req.body;
    let settingKey = 'court_stamp_path';
    if (type === 'oadr') settingKey = 'oadr_stamp';
    else if (type === 'probate') settingKey = 'probate_stamp';

    const stampPath = `/uploads/${req.file.filename}`;
    db.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [settingKey, stampPath, stampPath],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Stamp uploaded successfully', path: stampPath, key: settingKey });
        }
    );
});

app.delete('/api/settings/stamp/:type', logActivity, (req, res) => {
    const { type } = req.params;
    let settingKey = 'court_stamp_path';
    if (type === 'oadr') settingKey = 'oadr_stamp';
    else if (type === 'probate') settingKey = 'probate_stamp';

    db.query('DELETE FROM system_settings WHERE setting_key = ?', [settingKey], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Stamp deleted successfully', key: settingKey });
    });
});

// Staff signature upload
app.post('/api/staff/:id/signature', authenticateToken, upload.single('signature'), logActivity, (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const signaturePath = `/uploads/${req.file.filename}`;
    db.query(
        'UPDATE staff_users SET signature_path = ? WHERE id = ?',
        [signaturePath, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Signature uploaded successfully', path: signaturePath });
        }
    );
});

// Roles Management Endpoints
app.get('/api/roles', authenticateToken, (req, res) => {
    db.query('SELECT * FROM roles ORDER BY name ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/roles/:id', authenticateToken, authorizeAdmin, (req, res) => {
    db.query('SELECT * FROM roles WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Role not found' });
        res.json(results[0]);
    });
});

app.post('/api/roles', authenticateToken, authorizeAdmin, logActivity, (req, res) => {
    const { name, display_name, description } = req.body;

    if (!name || !display_name) {
        return res.status(400).json({ error: 'Name and display name are required' });
    }

    const sql = 'INSERT INTO roles (name, display_name, description) VALUES (?, ?, ?)';
    db.query(sql, [name.toLowerCase(), display_name, description], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Role name already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: 'Role created successfully',
            id: result.insertId
        });
    });
});

app.put('/api/roles/:id', authenticateToken, authorizeAdmin, logActivity, (req, res) => {
    const { display_name, description } = req.body;
    const { id } = req.params;

    if (!display_name) {
        return res.status(400).json({ error: 'Display name is required' });
    }

    const sql = 'UPDATE roles SET display_name = ?, description = ? WHERE id = ?';
    db.query(sql, [display_name, description, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json({ message: 'Role updated successfully' });
    });
});

app.delete('/api/roles/:id', authenticateToken, authorizeAdmin, logActivity, (req, res) => {
    const { id } = req.params;

    // Check if role is in use
    db.query('SELECT COUNT(*) as count FROM staff_users WHERE role_id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete role that is assigned to staff members',
                count: results[0].count
            });
        }

        db.query('DELETE FROM roles WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Role not found' });
            }
            res.json({ message: 'Role deleted successfully' });
        });
    });
});

// Get all staff users
app.get('/api/staff', authenticateToken, authorizeAdmin, (req, res) => {
    console.log('GET /api/staff hit by user:', req.user);
    const sql = `
        SELECT s.id, s.name, s.email, s.role, s.role_id, s.division, s.status, s.signature_path, s.created_at, s.force_password_change,
               r.name as role_name, r.display_name as role_display_name
        FROM staff_users s
        LEFT JOIN roles r ON s.role_id = r.id
        ORDER BY s.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('DB Error in /api/staff:', err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log('GET /api/staff returning', results.length, 'users');
        res.json(results);
    });
});

// Get staff details including signature
app.get('/api/staff/:id', authenticateToken, (req, res) => {
    const sql = `
        SELECT s.id, s.name, s.email, s.role, s.role_id, s.division, s.status, s.signature_path, s.created_at,
               r.name as role_name, r.display_name as role_display_name
        FROM staff_users s
        LEFT JOIN roles r ON s.role_id = r.id
        WHERE s.id = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Staff not found' });
        res.json(results[0]);
    });
});

// Create new staff user
app.post('/api/staff', authenticateToken, authorizeAdmin, logActivity, async (req, res) => {
    const { name, email, role_id, division, status } = req.body;

    // Validate required fields
    if (!name || !email || !role_id) {
        return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    try {
        // Generate random 6-digit password
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const staffStatus = status || 'active';

        // Get role name for backward compatibility
        db.query('SELECT name FROM roles WHERE id = ?', [role_id], (roleErr, roleResults) => {
            if (roleErr || roleResults.length === 0) {
                return res.status(400).json({ error: 'Invalid role selected' });
            }

            const roleName = roleResults[0].name;

            db.query(
                'INSERT INTO staff_users (name, email, password, role, role_id, division, status, force_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                [name, email, hashedPassword, roleName, role_id, division, staffStatus],
                async (err, result) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(400).json({ error: 'Email already exists' });
                        }
                        return res.status(500).json({ error: err.message });
                    }

                    // Send credentials email
                    await sendStaffCredentialsEmail(email, name, tempPassword);

                    res.status(201).json({
                        message: 'Staff user created and credentials sent',
                        id: result.insertId
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset staff password (admin only)
app.post('/api/staff/:id/reset-password', authenticateToken, authorizeAdmin, logActivity, async (req, res) => {
    const { id } = req.params;

    try {
        // Generate random 6-digit password
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Fetch staff name and email first
        db.query('SELECT name, email FROM staff_users WHERE id = ?', [id], (fetchErr, results) => {
            if (fetchErr || results.length === 0) {
                return res.status(404).json({ error: 'Staff member not found' });
            }

            const { name, email } = results[0];

            // Update database
            db.query(
                'UPDATE staff_users SET password = ?, force_password_change = 1 WHERE id = ?',
                [hashedPassword, id],
                async (updateErr) => {
                    if (updateErr) return res.status(500).json({ error: updateErr.message });

                    // Send credentials email
                    await sendStaffCredentialsEmail(email, name, tempPassword);

                    res.json({ message: 'Password reset successful and credentials sent' });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update staff user
app.put('/api/staff/:id', authenticateToken, authorizeAdmin, logActivity, async (req, res) => {
    const { name, email, password, role_id, division, status } = req.body;
    const { id } = req.params;

    try {
        // If role_id is provided, get the role name
        let roleName = null;
        if (role_id) {
            const roleResult = await new Promise((resolve, reject) => {
                db.query('SELECT name FROM roles WHERE id = ?', [role_id], (err, results) => {
                    if (err) reject(err);
                    else if (results.length === 0) reject(new Error('Invalid role selected'));
                    else resolve(results[0]);
                });
            });
            roleName = roleResult.name;
        }

        let updateQuery = '';
        let params = [];

        if (role_id) {
            updateQuery = 'UPDATE staff_users SET name = ?, email = ?, role = ?, role_id = ?, division = ?, status = ? WHERE id = ?';
            params = [name, email, roleName, role_id, division, status, id];
        } else {
            updateQuery = 'UPDATE staff_users SET name = ?, email = ?, division = ?, status = ? WHERE id = ?';
            params = [name, email, division, status, id];
        }

        db.query(updateQuery, params, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Staff user not found' });
            }

            res.json({ message: 'Staff user updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete staff user
app.delete('/api/staff/:id', authenticateToken, authorizeAdmin, logActivity, (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM staff_users WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Staff user not found' });
        }

        res.json({ message: 'Staff user deleted successfully' });
    });
});

// Public User Management (Admin Only)
app.get('/api/admin/users', authenticateToken, authorizeAdmin, (req, res) => {
    db.query('SELECT id, first_name, middle_name, surname, email, phone, address, gender, age, nin, status, created_at FROM public_users ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Admin Fetch Users Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.get('/api/admin/users/:id', authenticateToken, authorizeAdmin, (req, res) => {
    db.query('SELECT id, first_name, middle_name, surname, email, phone, address, gender, age, nin, status, created_at FROM public_users WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
    });
});

app.put('/api/admin/users/:id', authenticateToken, authorizeAdmin, logActivity, (req, res) => {
    const { first_name, middle_name, surname, email, phone, address, status } = req.body;
    const { id } = req.params;

    db.query(
        'UPDATE public_users SET first_name = ?, middle_name = ?, surname = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?',
        [first_name, middle_name, surname, email, phone, address, status, id],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
            res.json({ message: 'User updated successfully' });
        }
    );
});

app.delete('/api/admin/users/:id', authenticateToken, authorizeAdmin, logActivity, (req, res) => {
    db.query('DELETE FROM public_users WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    });
});

// Public Template Endpoint (Active Only)
app.get('/api/public/templates', (req, res) => {
    db.query("SELECT * FROM affidavit_templates WHERE status = 'active' ORDER BY title ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Admin Layout Management (Protected)
app.get('/api/affidavits/templates', authenticateToken, (req, res) => {
    // If admin, return all. If other staff, return active only.
    let sql = "SELECT * FROM affidavit_templates WHERE status = 'active' ORDER BY title ASC";
    if (req.user && req.user.role === 'admin') {
        sql = 'SELECT * FROM affidavit_templates ORDER BY title ASC';
    }
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/affidavits/templates', authenticateToken, logActivity, (req, res) => {
    const { title, content, amount, status } = req.body;
    const sql = 'INSERT INTO affidavit_templates (title, content, amount, status) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, content, amount, status || 'draft'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Template created', id: result.insertId });
    });
});

app.put('/api/affidavits/templates/:id', authenticateToken, logActivity, (req, res) => {
    const { title, content, amount, status } = req.body;
    const { id } = req.params;
    const sql = 'UPDATE affidavit_templates SET title = ?, content = ?, amount = ?, status = ? WHERE id = ?';
    db.query(sql, [title, content, amount, status, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Template updated' });
    });
});

app.delete('/api/affidavits/templates/:id', authenticateToken, logActivity, (req, res) => {
    db.query('DELETE FROM affidavit_templates WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Template deleted' });
    });
});

// Probate Document Configuration Endpoints
app.get('/api/admin/probate-documents', authenticateToken, (req, res) => {
    db.query('SELECT * FROM probate_config ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/admin/probate-documents', authenticateToken, logActivity, (req, res) => {
    const { document_name, document_fee, publish_status, is_required, type, description } = req.body;
    const sql = `INSERT INTO probate_config 
        (document_name, document_fee, publish_status, is_required, type, description) 
        VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [document_name, document_fee, publish_status, is_required, type || 'upload', description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Config created', id: result.insertId });
    });
});

app.put('/api/admin/probate-documents/:id', authenticateToken, logActivity, (req, res) => {
    const { document_name, document_fee, publish_status, is_required, type, description } = req.body;
    const { id } = req.params;
    const sql = `UPDATE probate_config 
        SET document_name = ?, document_fee = ?, publish_status = ?, is_required = ?, type = ?, description = ? 
        WHERE id = ?`;
    db.query(sql, [document_name, document_fee, publish_status, is_required, type, description, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Config updated' });
    });
});

app.delete('/api/admin/probate-documents/:id', authenticateToken, logActivity, (req, res) => {
    db.query('DELETE FROM probate_config WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Config deleted' });
    });
});

app.put('/api/affidavits/:id/meeting', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { meetingId } = req.body;
    db.query('UPDATE affidavits SET meeting_id = ? WHERE id = ?', [meetingId, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Meeting ID updated' });
    });
});

app.post('/api/affidavits', upload.single('file'), logActivity, (req, res) => {
    const { userId, type, content, amount } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    // pdf_path is for the user's initial upload/draft
    const sql = 'INSERT INTO affidavits (user_id, type, content, amount, status, pdf_path) VALUES (?, ?, ?, ?, "submitted", ?)';
    db.query(sql, [userId, type, content, amount, filePath], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const appId = result.insertId;

        // Send submission email and notifications
        const fetchUserSql = 'SELECT id, email, first_name, surname FROM public_users WHERE id = ?';
        db.query(fetchUserSql, [userId], async (fetchErr, userResults) => {
            if (!fetchErr && userResults.length > 0) {
                const user = userResults[0];

                // Email
                await sendAffidavitNotification(
                    user.email,
                    `${user.first_name} ${user.surname}`,
                    appId,
                    'submitted'
                );

                // In-App Notification for User
                createPublicNotification(
                    userId,
                    'Affidavit Submitted',
                    `Your ${type} affidavit has been submitted for review. Application ID: CRMS-${appId}`,
                    'info'
                );

                // In-App Notification for Staff (CFO role)
                notifyStaffByRole(
                    'cfo',
                    'New Affidavit Filed',
                    `A new ${type} affidavit has been filed by ${user.first_name} ${user.surname}. ID: CRMS-${appId}`,
                    'info'
                );
            }
        });

        res.status(201).json({ message: 'Affidavit filed', id: appId });
    });
});

// Update affidavit content (only if not completed)
// Deponent: Simple Resubmit (Reset Status to Submitted) - Simplified path to avoid any potential routing conflicts
app.put('/api/resubmit-affidavit/:id', authenticateToken, logActivity, (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const numericId = parseInt(id);

    console.log(`[Resubmit Attempt] ID: ${id} by User ${requesterId}`);

    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid Affidavit ID' });

    db.query('SELECT user_id, status FROM affidavits WHERE id = ?', [numericId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Affidavit not found' });

        const current = results[0];

        // Security check: Use loose equality for string/number tolerance
        if (current.user_id != requesterId && req.user?.type !== 'staff') {
            return res.status(403).json({ error: 'Access denied. Ownership verification failed.' });
        }

        const sql = "UPDATE affidavits SET status = 'submitted', remarks = NULL WHERE id = ?";
        db.query(sql, [numericId], (updateErr, result) => {
            if (updateErr) return res.status(500).json({ error: 'Resubmit failed: ' + updateErr.message });

            // Notify User and Staff
            const fetchInfoSql = `
                SELECT a.type, a.filed_by_staff_id,
                       COALESCE(app.first_name, u.first_name, 'Deponent') as first_name, 
                       COALESCE(app.surname, u.surname, '') as surname, 
                       u.id as user_id
                FROM affidavits a
                LEFT JOIN applicants app ON a.applicant_id = app.id
                LEFT JOIN public_users u ON a.user_id = u.id
                WHERE a.id = ?
            `;
            db.query(fetchInfoSql, [numericId], (infoErr, infoResults) => {
                if (!infoErr && infoResults.length > 0) {
                    const info = infoResults[0];

                    // Notify public user if exists
                    if (info.user_id) {
                        createPublicNotification(
                            info.user_id,
                            'Affidavit Resubmitted',
                            `Your ${info.type} affidavit has been resubmitted for review. Previous remarks have been cleared.`,
                            'info'
                        );
                    }

                    // Notify CFO role
                    notifyStaffByRole(
                        'cfo',
                        'Affidavit Updated',
                        `Deponent ${info.first_name} ${info.surname} has resubmitted their ${info.type} affidavit. ID: CRMS-${numericId}`,
                        'info'
                    );

                    // Notify Jurat staff member who filed it (if applicable)
                    if (info.filed_by_staff_id) {
                        createStaffNotification(
                            info.filed_by_staff_id,
                            'Affidavit Resubmitted',
                            `The ${info.type} affidavit you filed for ${info.first_name} ${info.surname} has been resubmitted. ID: CRMS-${numericId}`,
                            'info'
                        );
                    }
                }
            });

            res.json({ message: 'Affidavit resubmitted successfully.', status: 'submitted' });
        });
    });
});

app.put('/api/affidavits/:id', authenticateToken, upload.single('file'), logActivity, (req, res) => {
    const { id } = req.params;
    const { type, content } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;
    const requesterId = req.user?.id;
    const numericId = parseInt(id);

    console.log(`[Deponent Resubmission Debug] ID: ${id} -> ${numericId} by User ${requesterId}`);

    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid Affidavit ID format' });

    db.query('SELECT user_id, status, pdf_path FROM affidavits WHERE id = ?', [numericId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Affidavit not found' });

        const current = results[0];

        // Security check: Use loose equality for string/number compatibility
        if (current.user_id != requesterId && req.user?.type !== 'staff') {
            console.warn(`[Security Alert] User ${requesterId} tried to edit Affidavit ${numericId} owned by ${current.user_id}`);
            return res.status(403).json({ error: 'Access denied. You do not own this affidavit.' });
        }

        if (current.status === 'completed') {
            return res.status(403).json({ error: 'Cannot edit a completed affidavit.' });
        }

        const updatedPath = filePath || current.pdf_path;
        console.log(`[Deponent Resubmission Debug] Resubmitting ID ${numericId}. Status Reset.`);

        const sql = `
            UPDATE affidavits 
            SET type = COALESCE(?, type), 
                content = COALESCE(?, content), 
                pdf_path = ?, 
                status = 'submitted', 
                remarks = NULL 
            WHERE id = ?
        `;
        const params = [type || null, content || null, updatedPath, numericId];

        db.query(sql, params, (updateErr, result) => {
            if (updateErr) {
                console.error(`[Deponent Resubmission Debug] UPDATE FAILED for ${numericId}:`, updateErr);
                return res.status(500).json({ error: 'Update failed: ' + updateErr.message });
            }

            console.log(`[Deponent Resubmission Success] ID ${numericId} is now submitted. Rows: ${result.affectedRows}`);
            res.json({
                message: 'Your affidavit has been resubmitted successfully.',
                status: 'submitted',
                id: numericId,
                affected: result.affectedRows
            });
        });
    });
});

// Delete affidavit (only if not completed)

app.delete('/api/affidavits/:id', logActivity, (req, res) => {
    const { id } = req.params;

    // First check if affidavit exists and is not completed
    const checkSql = 'SELECT status FROM affidavits WHERE id = ?';
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Affidavit not found' });

        if (results[0].status === 'completed') {
            return res.status(403).json({ error: 'Cannot delete completed affidavit' });
        }

        // Delete the affidavit
        const deleteSql = 'DELETE FROM affidavits WHERE id = ?';
        db.query(deleteSql, [id], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });
            res.json({ message: 'Affidavit deleted successfully' });
        });
    });
});


// Staff: Get applications pending review (Registry View)
app.get('/api/staff/affidavits/pending-review', authenticateToken, (req, res) => {
    const sql = `
        SELECT a.*, 
               COALESCE(app.first_name, u.first_name, 'Unknown') as first_name, 
               COALESCE(app.surname, u.surname, 'Deponent') as surname, 
               COALESCE(app.email, u.email) as email,
               s.name as filed_by_name,
               IF(a.filed_by_staff_id IS NOT NULL, 'Jurat', 'Self') as source
        FROM affidavits a 
        LEFT JOIN applicants app ON a.applicant_id = app.id
        LEFT JOIN public_users u ON a.user_id = u.id 
        LEFT JOIN staff_users s ON a.filed_by_staff_id = s.id
        WHERE a.status = 'submitted' 
        ORDER BY a.created_at ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Update user heartbeat
app.post('/api/user/heartbeat', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const userType = req.user.type; // 'public' or 'staff'

    // Choose table based on user type
    const table = userType === 'staff' ? 'staff_users' : 'public_users';

    console.log(`[Heartbeat] Received for User ID: ${userId} (${userType})`);

    const sql = `UPDATE ${table} SET last_seen = NOW(), is_online = 1 WHERE id = ?`;
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('[Heartbeat Error]', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn(`[Heartbeat Warning] No user found in ${table} with ID: ${userId}`);
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Heartbeat received' });
    });
});

// Update user meeting ID (for Virtual Oath Hosting)
app.put('/api/user/meeting', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { meetingId } = req.body;
    console.log(`[Meeting] Updating Meeting ID for User ${userId}: ${meetingId}`);

    if (!meetingId) return res.status(400).json({ error: "meetingId is required" });

    const sql = 'UPDATE public_users SET meeting_id = ? WHERE id = ?';
    db.query(sql, [meetingId, userId], (err) => {
        if (err) {
            console.error('[Meeting Update Error]', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Meeting ID updated' });
    });
});

// Configure Multer for file uploads
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save to specific existing folder
        cb(null, path.join(__dirname, 'uploads/affidavits/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'affidavit-' + req.params.id + '-' + uniqueSuffix + '.pdf');
    }
});
const pdfUpload = multer({ storage: pdfStorage });

// Upload generated PDF for an affidavit
app.post('/api/affidavits/:id/upload-pdf', authenticateToken, pdfUpload.single('pdf'), (req, res) => {
    const { id } = req.params;
    console.log(`[PDF Upload] Received upload request for Affidavit ${id}`);

    if (!req.file) {
        console.error('[PDF Upload] No file received');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Store relative path accessible via static middleware
    const filePath = `/uploads/affidavits/${req.file.filename}`;
    console.log(`[PDF Upload] File saved at: ${filePath}`);

    // This endpoint is used by staff to upload a manually certified affidavit
    db.query('UPDATE affidavits SET affidavit_path = ? WHERE id = ?', [filePath, id], (err) => {
        if (err) {
            console.error('[PDF Upload] DB Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Affidavit PDF uploaded successfully', pdfPath: filePath });
    });
});

// Staff: Get applications pending CFO verification
app.get('/api/staff/affidavits/pending-verification', authenticateToken, (req, res) => {
    const { oathOnly } = req.query;
    console.log(`[CFO API] Fetching pending. oathOnly: ${oathOnly}`);

    let sql = `
        SELECT a.*, 
               COALESCE(app.first_name, u.first_name, 'Unknown') as first_name, 
               COALESCE(app.surname, u.surname, 'Deponent') as surname, 
               COALESCE(app.email, u.email) as email,
               u.last_seen,
               u.meeting_id as deponent_meeting_id,
               s.name as filed_by_name,
               IF(a.filed_by_staff_id IS NOT NULL, 'Jurat', 'Self') as source
        FROM affidavits a 
        LEFT JOIN applicants app ON a.applicant_id = app.id
        LEFT JOIN public_users u ON a.user_id = u.id 
        LEFT JOIN staff_users s ON a.filed_by_staff_id = s.id
        WHERE a.status = 'submitted'
    `;

    if (oathOnly === 'true') {
        sql += " AND a.virtual_oath_taken IN ('requested', 'completed', 'verified')";
        console.log('[CFO API] Filtering for Virtual Oath sessions only');
    }

    sql += ' ORDER BY a.virtual_oath_taken DESC, a.created_at ASC';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('[CFO API Error]:', err);
            return res.status(500).json({ error: err.message });
        }

        console.log(`[CFO API] Found ${results.length} records`);
        if (results.length > 0) {
            console.log('[CFO API] Sample last_seen values:', results.map(r => ({
                id: r.id,
                email: r.email,
                last_seen: r.last_seen
            })));
        }

        // Disable caching to ensure fresh data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.json(results);
    });
});

// Staff: Get ALL affidavits across all statuses
app.get('/api/staff/affidavits/all', authenticateToken, (req, res) => {
    const sql = `
        SELECT a.*, 
               COALESCE(app.first_name, u.first_name, 'Unknown') as first_name, 
               COALESCE(app.surname, u.surname, 'Deponent') as surname, 
               COALESCE(app.email, u.email) as email,
               s.name as filed_by_name,
               s2.name as approved_by_name,
               s2.signature_path as approved_by_signature,
               IF(a.filed_by_staff_id IS NOT NULL, 'Jurat', 'Self') as source
        FROM affidavits a 
        LEFT JOIN applicants app ON a.applicant_id = app.id
        LEFT JOIN public_users u ON a.user_id = u.id 
        LEFT JOIN staff_users s ON a.filed_by_staff_id = s.id
        LEFT JOIN staff_users s2 ON a.approved_by = s2.id
        ORDER BY a.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Staff: Get ONLY deponents who have filed at least 1 affidavit, with count
app.get('/api/staff/users/deponents', authenticateToken, (req, res) => {
    const sql = `
        SELECT u.id, 
               u.first_name COLLATE utf8mb4_unicode_ci as first_name, 
               u.middle_name COLLATE utf8mb4_unicode_ci as middle_name,
               u.surname COLLATE utf8mb4_unicode_ci as surname, 
               u.email COLLATE utf8mb4_unicode_ci as email, 
               u.phone COLLATE utf8mb4_unicode_ci as phone, 
               u.nin COLLATE utf8mb4_unicode_ci as nin, 
               u.gender COLLATE utf8mb4_unicode_ci as gender,
               u.age,
               u.address COLLATE utf8mb4_unicode_ci as address,
               u.profile_pic COLLATE utf8mb4_unicode_ci as picture_path,
               u.signature_path COLLATE utf8mb4_unicode_ci as signature_path,
               CAST(u.status AS CHAR) COLLATE utf8mb4_unicode_ci as status, 
               u.created_at, 
               'Self' COLLATE utf8mb4_unicode_ci as source,
               (SELECT COUNT(*) FROM affidavits a WHERE a.user_id = u.id) as affidavit_count 
        FROM public_users u 
        UNION ALL
        SELECT app.id, 
               app.first_name COLLATE utf8mb4_unicode_ci as first_name, 
               app.middle_name COLLATE utf8mb4_unicode_ci as middle_name,
               app.surname COLLATE utf8mb4_unicode_ci as surname, 
               app.email COLLATE utf8mb4_unicode_ci as email, 
               app.phone COLLATE utf8mb4_unicode_ci as phone, 
               app.nin COLLATE utf8mb4_unicode_ci as nin, 
               app.gender COLLATE utf8mb4_unicode_ci as gender,
               app.age,
               app.address COLLATE utf8mb4_unicode_ci as address,
               app.picture_path COLLATE utf8mb4_unicode_ci as picture_path,
               app.signature_path COLLATE utf8mb4_unicode_ci as signature_path,
               CAST(app.status AS CHAR) COLLATE utf8mb4_unicode_ci as status, 
               app.created_at,
               'Jurat' COLLATE utf8mb4_unicode_ci as source,
               (SELECT COUNT(*) FROM affidavits a WHERE a.applicant_id = app.id) as affidavit_count
        FROM applicants app
        ORDER BY created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Staff Fetch Deponents Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Staff: Update Application Status (Approve/Reject)
app.put('/api/affidavits/:id/approve', authenticateToken, logActivity, async (req, res) => {
    const { nextStatus, remarks } = req.body;
    const { id } = req.params;

    // Only CFO can approve/reject affidavits
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Staff access required' });
    }

    if (req.user.role !== 'cfo') {
        return res.status(403).json({
            error: 'Only Chief Filing Officers (CFO) can approve or reject affidavits',
            required_role: 'cfo',
            your_role: req.user.role
        });
    }


    const userId = req.user.id;

    try {
        let pdfPath = null;
        if (nextStatus === 'completed') {
            console.log(`[PDF Generation] Starting for Affidavit ${id} by CFO ${userId}`);

            const fetchDataSql = `
                SELECT 
                    a.id as affidavit_id,
                    a.type as affidavit_type,
                    a.content as affidavit_content,
                    a.language as affidavit_language,
                    a.pdf_path as affidavit_draft_path,
                    COALESCE(app.first_name, u.first_name) as deponent_first_name,
                    COALESCE(app.surname, u.surname) as deponent_surname,
                    COALESCE(app.email, u.email) as deponent_email,
                    COALESCE(app.picture_path, u.profile_pic) as deponent_profile_pic,
                    COALESCE(app.signature_path, u.signature_path) as deponent_signature,
                    cfo.name as cfo_name,
                    cfo.division as cfo_division,
                    cfo.signature_path as cfo_signature,
                    jurat.name as jurat_name,
                    jurat.division as jurat_division
                FROM affidavits a
                LEFT JOIN applicants app ON a.applicant_id = app.id
                LEFT JOIN public_users u ON a.user_id = u.id
                LEFT JOIN staff_users jurat ON a.filed_by_staff_id = jurat.id
                INNER JOIN staff_users cfo ON cfo.id = ?
                WHERE a.id = ?
            `;

            const affidavitData = await new Promise((resolve, reject) => {
                db.query(fetchDataSql, [userId, id], (err, results) => {
                    if (err) reject(err);
                    else if (results.length === 0) reject(new Error('Affidavit or CFO profile not found'));
                    else resolve(results[0]);
                });
            });

            // 1. Generate PDF first
            const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:5000';
            pdfPath = await generateAffidavitPDF({
                affidavit: {
                    id: affidavitData.affidavit_id,
                    type: affidavitData.affidavit_type,
                    content: affidavitData.affidavit_content,
                    language: affidavitData.affidavit_language
                },
                user: {
                    first_name: affidavitData.deponent_first_name,
                    surname: affidavitData.deponent_surname,
                    email: affidavitData.deponent_email,
                    profile_pic: affidavitData.deponent_profile_pic,
                    signature_path: affidavitData.deponent_signature
                },
                cfoStaff: {
                    name: affidavitData.cfo_name,
                    signature_path: affidavitData.cfo_signature,
                    division: affidavitData.cfo_division || affidavitData.jurat_division
                },
                juratName: affidavitData.jurat_name,
                serverBaseUrl
            });

            // 2. Only if PDF generation succeeded, update status and path
            const approveSql = "UPDATE affidavits SET status = ?, virtual_oath_taken = 'completed', approved_by = ?, affidavit_path = ?, remarks = ? WHERE id = ?";
            await new Promise((resolve, reject) => {
                db.query(approveSql, [nextStatus, userId, pdfPath, remarks || null, id], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            console.log(`[PDF Generation] Success for Affidavit ${id}: ${pdfPath}`);
        } else {
            // Rejection flow
            const rejectSql = 'UPDATE affidavits SET status = ?, approved_by = ?, remarks = ? WHERE id = ?';
            await new Promise((resolve, reject) => {
                db.query(rejectSql, [nextStatus, userId, remarks || null, id], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }

        // If status is completed or rejected, send email and in-app notifications
        if (nextStatus === 'completed' || nextStatus === 'rejected') {
            const fetchUserSql = `
                SELECT a.id, a.type, a.user_id, a.filed_by_staff_id,
                       COALESCE(app.email, u.email) as email,
                       COALESCE(app.first_name, u.first_name) as first_name,
                       COALESCE(app.surname, u.surname) as surname,
                       staff.email as staff_email,
                       staff.name as staff_name
                FROM affidavits a 
                LEFT JOIN applicants app ON a.applicant_id = app.id
                LEFT JOIN public_users u ON a.user_id = u.id 
                LEFT JOIN staff_users staff ON a.filed_by_staff_id = staff.id
                WHERE a.id = ?
            `;
            db.query(fetchUserSql, [id], async (fetchErr, results) => {
                if (!fetchErr && results.length > 0) {
                    const info = results[0];

                    // Determine target email (Deponent or Filing Staff)
                    const targetEmail = info.email || info.staff_email;
                    const displayName = info.email ? `${info.first_name} ${info.surname}` : info.staff_name;

                    if (targetEmail) {
                        await sendAffidavitNotification(
                            targetEmail,
                            displayName,
                            id, // Use actual affidavit ID
                            nextStatus,
                            nextStatus === 'completed' ? pdfPath : null
                        );
                    }

                    // In-App Notification for Public User
                    const title = nextStatus === 'completed' ? 'Affidavit Approved!' : 'Affidavit Rejected';
                    const msg = nextStatus === 'completed'
                        ? `Congratulations! Your ${info.type} affidavit has been approved and is ready for download. ID: CRMS-${id}`
                        : `Your ${info.type} affidavit has been rejected for the following reason: ${remarks || 'No reason provided'}. Please edit and resubmit.`;

                    if (info.user_id) {
                        createPublicNotification(info.user_id, title, msg, nextStatus === 'completed' ? 'success' : 'error');
                    }

                    // In-App Notification for Staff who filed (if Jurat filing)
                    if (info.filed_by_staff_id) {
                        const staffTitle = nextStatus === 'completed' ? 'Affidavit Approved' : 'Affidavit Rejected';
                        const staffMsg = nextStatus === 'completed'
                            ? `The ${info.type} affidavit you filed for ${info.first_name} ${info.surname} has been approved. ID: CRMS-${id}`
                            : `The ${info.type} affidavit you filed for ${info.first_name} ${info.surname} has been rejected. Reason: ${remarks || 'No reason provided'}. ID: CRMS-${id}`;

                        createStaffNotification(
                            info.filed_by_staff_id,
                            staffTitle,
                            staffMsg,
                            nextStatus === 'completed' ? 'success' : 'error'
                        );
                    }
                }
            });
        }

        res.json({ message: `Affidavit updated to ${nextStatus}` });
    } catch (error) {
        console.error('[Approval Error]:', error);
        res.status(500).json({ error: error.message });
    }
});


// User/Staff: Update virtual oath status
app.put('/api/affidavits/:id/virtual-oath', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { taken, status, meetingId } = req.body;

    // Determine the string value to store
    let oathStatus = 'pending'; // Default status
    if (status !== undefined) {
        // If 'status' is explicitly provided, use it directly (e.g., 'requested', 'completed', 'pending')
        oathStatus = status;
    } else if (taken === true || taken === 1) {
        // If 'taken' is true or 1, set to 'requested'
        oathStatus = 'requested';
    } else if (taken === false || taken === 0) {
        // If 'taken' is false or 0, set to 'pending'
        oathStatus = 'pending';
    } else if (taken === 'completed' || taken === 2) {
        // Handle cases where 'taken' might be the string 'completed' or number 2 (for backward compatibility)
        oathStatus = 'completed';
    }

    console.log(`[VirtualOath] Updating status for Affidavit ${id} to ${oathStatus}`);

    let updateSql = 'UPDATE affidavits SET virtual_oath_taken = ?';
    let params = [oathStatus];

    if (meetingId) {
        updateSql += ', meeting_id = ?';
        params.push(meetingId);
    }

    updateSql += ' WHERE id = ?';
    params.push(id);

    db.query(updateSql, params, (err, result) => {
        if (err) {
            console.error('[VirtualOath] DB Error:', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn(`[VirtualOath] Affidavit ${id} not found`);
            return res.status(404).json({ error: 'Affidavit not found' });
        }

        // Notify Staff if it's a new request
        if (oathStatus === 'requested') {
            const fetchDeponentSql = `
                SELECT COALESCE(app.first_name, u.first_name) as first_name, COALESCE(app.surname, u.surname) as surname, a.type
                FROM affidavits a
                LEFT JOIN applicants app ON a.applicant_id = app.id
                LEFT JOIN public_users u ON a.user_id = u.id
                WHERE a.id = ?
            `;
            db.query(fetchDeponentSql, [id], (fetchErr, results) => {
                if (!fetchErr && results.length > 0) {
                    const info = results[0];
                    notifyStaffByRole(
                        'cfo',
                        'Virtual Oath Requested',
                        `${info.first_name} ${info.surname} is waiting for a Virtual Oath session for ${info.type}. ID: CRMS-${id}`,
                        'warning'
                    );
                }
            });
        }

        res.json({ message: 'Virtual oath status updated', status: oathStatus });
    });
});

// Virtual Oath Audit Endpoints
app.post('/api/oath/sessions/start', authenticateToken, (req, res) => {
    const { affidavitId, meetingId } = req.body;
    const userId = req.user.type === 'public' ? req.user.id : null;
    const staffId = req.user.type === 'staff' ? req.user.id : null;

    console.log(`[OathAudit] Session Start: ${meetingId} for Affidavit ${affidavitId}`);

    const sql = `INSERT INTO oath_sessions (affidavit_id, user_id, staff_id, meeting_id, status) VALUES (?, ?, ?, ?, 'started')`;
    db.query(sql, [affidavitId, userId, staffId, meetingId], (err, result) => {
        if (err) {
            console.error('[OathAudit] Start Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ sessionId: result.insertId });
    });
});

app.post('/api/oath/sessions/join', authenticateToken, (req, res) => {
    const { meetingId } = req.body;
    const staffId = req.user.type === 'staff' ? req.user.id : null;

    if (!staffId) return res.status(401).json({ error: "Only staff can join as second party" });

    console.log(`[OathAudit] Staff ${staffId} joining session: ${meetingId}`);

    const sql = `UPDATE oath_sessions SET staff_id = ? WHERE meeting_id = ? AND staff_id IS NULL`;
    db.query(sql, [staffId, meetingId], (err) => {
        if (err) {
            console.error('[OathAudit] Join Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Joined session audited" });
    });
});

app.post('/api/oath/sessions/end', authenticateToken, (req, res) => {
    const { meetingId } = req.body;
    console.log(`[OathAudit] Session End: ${meetingId}`);

    const sql = `
        UPDATE oath_sessions 
        SET end_time = CURRENT_TIMESTAMP, 
            status = 'completed', 
            duration_seconds = TIMESTAMPDIFF(SECOND, start_time, CURRENT_TIMESTAMP) 
        WHERE meeting_id = ? AND status = 'started'
    `;
    db.query(sql, [meetingId], (err) => {
        if (err) {
            console.error('[OathAudit] End Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Session ended audited" });
    });
});

// Download Affidavit PDF (for users and staff)
app.get('/api/affidavits/:id/download', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;

    // Fetch affidavit to check authorization and get PDF path
    const sql = `
        SELECT a.*, 
               COALESCE(app.email, u.email) as user_email,
               a.pdf_path
        FROM affidavits a
        LEFT JOIN applicants app ON a.applicant_id = app.id
        LEFT JOIN public_users u ON a.user_id = u.id
        WHERE a.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('[Download] DB Error:', err);
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Affidavit not found' });
        }

        const affidavit = results[0];

        // Authorization check: staff can download any, users can only download their own
        if (userType !== 'staff' && affidavit.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Prioritize certified affidavit, then fall back to user upload
        const downloadFilePath = affidavit.affidavit_path || affidavit.pdf_path;

        // Check if any file exists
        if (!downloadFilePath) {
            return res.status(404).json({ error: 'No PDF available for this affidavit' });
        }

        // Send the PDF file
        const filePath = path.join(__dirname, downloadFilePath);
        const fileName = affidavit.affidavit_path ? `Affidavit_${id}_Certified.pdf` : `Affidavit_${id}_Draft.pdf`;

        res.download(filePath, fileName, (downloadErr) => {
            if (downloadErr) {
                console.error('[Download] File Error:', downloadErr);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download PDF' });
                }
            }
        });
    });
});


app.put('/api/affidavits/:id/status', logActivity, (req, res) => {
    const { status, captured_image, payment_id, remarks } = req.body;
    const { id } = req.params;

    let updates = [];
    let params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (captured_image) { updates.push('captured_image = ?'); params.push(captured_image); }
    if (payment_id) { updates.push('payment_id = ?'); params.push(payment_id); }
    if (remarks) { updates.push('remarks = ?'); params.push(remarks); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(id);
    const sql = `UPDATE affidavits SET ${updates.join(', ')} WHERE id = ?`;

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Affidavit updated successfully' });
    });
});

app.get('/api/affidavits/user/:userId', logActivity, (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT * FROM affidavits WHERE user_id = ? ORDER BY created_at DESC';
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/affidavits/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT a.*, 
               COALESCE(app.first_name, u.first_name) as first_name, 
               COALESCE(app.surname, u.surname) as surname,
               u.meeting_id as deponent_meeting_id
        FROM affidavits a
        LEFT JOIN applicants app ON a.applicant_id = app.id
        LEFT JOIN public_users u ON a.user_id = u.id
        WHERE a.id = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Affidavit not found' });
        res.json(results[0]);
    });
});

app.get('/api/public/users/:id', authenticateToken, (req, res) => {
    db.query('SELECT id, first_name, surname, email, meeting_id, last_seen FROM public_users WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
    });
});

// Probate Endpoints
app.post('/api/probate', logActivity, (req, res) => {
    const { userId, deceasedName } = req.body;
    const sql = 'INSERT INTO probate_applications (user_id, deceased_name, status) VALUES (?, ?, "pending_registrar")';
    db.query(sql, [userId, deceasedName], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const appId = result.insertId;

        // Notify User and Staff
        createPublicNotification(
            userId,
            'Probate Application Filed',
            `Your probate application for ${deceasedName} has been submitted. Status: Pending Registrar Review. ID: PRB-${appId}`,
            'info'
        );

        notifyStaffByRole(
            'registrar',
            'New Probate Application',
            `A new probate application for ${deceasedName} has been filed. ID: PRB-${appId}`,
            'info'
        );

        res.status(201).json({ message: 'Probate application created', id: appId });
    });
});

// PR: Get probate applications pending review
app.get('/api/staff/probate/pending-review', authenticateToken, (req, res) => {
    const sql = `
        SELECT p.*, 
               COALESCE(u.first_name, ap.first_name) as applicant_first_name, 
               COALESCE(u.surname, ap.surname) as applicant_surname, 
               COALESCE(u.email, ap.email) as applicant_email,
               s.name as filed_by_name
        FROM probate_applications p
        LEFT JOIN public_users u ON p.user_id = u.id
        LEFT JOIN applicants ap ON p.applicant_id = ap.id
        LEFT JOIN staff_users s ON p.filed_by_staff_id = s.id
        WHERE p.status IN ('pending_registrar', 'rejected')
        ORDER BY p.created_at ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// PR: Get ALL probate applications (with status filtering if needed)
app.get('/api/staff/probate/all', authenticateToken, (req, res) => {
    const sql = `
        SELECT p.*, 
               COALESCE(u.first_name, ap.first_name) as applicant_first_name, 
               COALESCE(u.surname, ap.surname) as applicant_surname, 
               COALESCE(u.email, ap.email) as applicant_email,
               s.name as filed_by_name
        FROM probate_applications p
        LEFT JOIN public_users u ON p.user_id = u.id
        LEFT JOIN applicants ap ON p.applicant_id = ap.id
        LEFT JOIN staff_users s ON p.filed_by_staff_id = s.id
        ORDER BY p.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// CR: Get probate applications pending CR review
app.get('/api/staff/probate/cr-pending', authenticateToken, (req, res) => {
    const sql = `
        SELECT p.*, 
               COALESCE(u.first_name, ap.first_name) as applicant_first_name, 
               COALESCE(u.surname, ap.surname) as applicant_surname, 
               COALESCE(u.email, ap.email) as applicant_email,
               s.name as filed_by_name
        FROM probate_applications p
        LEFT JOIN public_users u ON p.user_id = u.id
        LEFT JOIN applicants ap ON p.applicant_id = ap.id
        LEFT JOIN staff_users s ON p.filed_by_staff_id = s.id
        WHERE p.status IN ('cr_pending', 'under_processing')
        ORDER BY p.created_at ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// PR: Get approved/completed probate applications for Letters of Administration 
// PR: Get approved/completed probate applications for Letters of Administration 
app.get('/api/staff/probate/letters', authenticateToken, (req, res) => {
    const sql = `
        SELECT p.*, 
               COALESCE(u.first_name, ap.first_name, 'Unknown') as applicant_first_name, 
               COALESCE(u.surname, ap.surname, '') as applicant_surname, 
               COALESCE(u.email, ap.email) as applicant_email,
               s.name as filed_by_name
        FROM probate_applications p
        LEFT JOIN public_users u ON p.user_id = u.id
        LEFT JOIN applicants ap ON p.applicant_id = ap.id
        LEFT JOIN staff_users s ON p.filed_by_staff_id = s.id
        WHERE p.approval = 'approved' AND p.status IN ('under_processing', 'completed')
        ORDER BY p.approval_date DESC, p.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// PR: Get full probate application details
app.get('/api/staff/probate/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const getDetails = (table, appId) => {
            return new Promise((resolve, reject) => {
                db.query(`SELECT * FROM ${table} WHERE probate_application_id = ?`, [appId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
        };

        const app = await new Promise((resolve, reject) => {
            const sql = `
                SELECT p.*, 
                       COALESCE(u.first_name, ap.first_name) as applicant_first_name, 
                       COALESCE(u.surname, ap.surname) as applicant_surname, 
                       COALESCE(u.email, ap.email) as applicant_email,
                       COALESCE(u.phone, ap.phone) as applicant_phone,
                       COALESCE(u.address, ap.address) as applicant_address,
                       COALESCE(u.profile_pic, ap.picture_path) as applicant_profile_pic,
                       COALESCE(u.nin, ap.nin) as applicant_nin,
                       COALESCE(u.gender, ap.gender) as applicant_gender,
                       COALESCE(u.age, ap.age) as applicant_age,
                       s.name as filed_by_name
                FROM probate_applications p 
                LEFT JOIN public_users u ON p.user_id = u.id 
                LEFT JOIN applicants ap ON p.applicant_id = ap.id
                LEFT JOIN staff_users s ON p.filed_by_staff_id = s.id
                WHERE p.id = ?
            `;
            db.query(sql, [id], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });

        if (!app) return res.status(404).json({ error: 'Application not found' });

        const beneficiaries = await getDetails('probate_beneficiaries', id);
        const assets = await getDetails('probate_estate', id);
        const sureties = await getDetails('probate_sureties', id);
        const documents = await getDetails('probate_documents', id);
        const payments = await getDetails('payments', id);

        res.json({
            ...app,
            beneficiaries,
            assets,
            sureties,
            documents,
            payments
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PR: Update probate status to cr_pending
app.put('/api/staff/probate/:id/review', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body;

    const sql = 'UPDATE probate_applications SET status = "cr_pending", approval = NULL, registrar_remarks = ? WHERE id = ?';
    db.query(sql, [remarks, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Notify CR staff
        notifyStaffByRole(
            'cr',
            'Probate Application Pending CR Review',
            `A probate application (ID: PRB-${id}) has been reviewed by the Registrar and is now pending your approval.`,
            'info'
        );

        // Notify User
        db.query('SELECT user_id, deceased_name FROM probate_applications WHERE id = ?', [id], (err, rows) => {
            if (!err && rows.length > 0) {
                createPublicNotification(
                    rows[0].user_id,
                    'Probate Application Update',
                    `Your probate application for ${rows[0].deceased_name} has passed the initial Registrar review and is now pending final approval by the Chief Registrar.`,
                    'info'
                );
            }
        });

        res.json({ message: 'Application moved to CR pending review' });
    });
});



// CR: Approve Probate Application (Final Approval)
// CR: Approve Probate Application (Final Approval)
app.put('/api/staff/probate/:id/approve', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body;

    // Fixed: status -> 'under_processing', approval -> 'approved' + date
    const sql = 'UPDATE probate_applications SET status = "under_processing", approval = "approved", approval_date = NOW(), cr_remarks = ? WHERE id = ?';
    db.query(sql, [remarks, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fetch user ID to notify
        db.query('SELECT user_id FROM probate_applications WHERE id = ?', [id], (err, rows) => {
            if (rows.length > 0) {
                const userId = rows[0].user_id;
                createPublicNotification(
                    userId,
                    'Probate Application Approved',
                    `Your probate application (ID: PRB-${id}) has been approved by the Chief Registrar and is now under processing. You can view your Letter of Administration shortly.`,
                    'success'
                );
            }
        });

        res.json({ message: 'Application approved successfully' });
    });
});

// CR: Reject Probate Application
app.put('/api/staff/probate/:id/reject', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks) return res.status(400).json({ error: 'Rejection remarks are required' });

    const sql = 'UPDATE probate_applications SET status = "rejected", approval = "rejected", cr_remarks = ? WHERE id = ?';
    db.query(sql, [remarks, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Notify User
        db.query('SELECT user_id, deceased_name FROM probate_applications WHERE id = ?', [id], (err, rows) => {
            if (!err && rows.length > 0) {
                createPublicNotification(
                    rows[0].user_id,
                    'Probate Application Rejected',
                    `Your probate application for ${rows[0].deceased_name} has been rejected. Reason: ${remarks}. Please update your details and resubmit.`,
                    'error'
                );
            }
        });

        res.json({ message: 'Application rejected successfully' });
    });
});

// Generate/View Probate Letter of Administration
app.get('/api/staff/probate/:id/letter-pdf', authenticateToken, (req, res) => {
    const { id } = req.params;

    // Check if approved
    const sql = `
        SELECT p.*, u.first_name, u.surname 
        FROM probate_applications p
        JOIN public_users u ON p.user_id = u.id
        WHERE p.id = ? AND p.approval = 'approved'
    `;

    db.query(sql, [id], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Application not found or not approved.' });

        const application = results[0];
        const user = { first_name: application.first_name, surname: application.surname };

        try {
            const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
            const pdfPath = await generateProbateLetterPDF({
                application,
                user,
                serverBaseUrl
            });

            res.json({ path: pdfPath });
        } catch (genErr) {
            console.error("Failed to generate probate letter:", genErr);
            res.status(500).json({ error: 'Failed to generate letter' });
        }
    });
});

// PR: Review Surety (Accept/Reject)
app.put('/api/staff/probate/surety/:id/review', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status, remark } = req.body; // status maps to acceptance column

    // First fetch the associated probate application user_id
    const userSql = `
        SELECT pa.user_id, ps.name as surety_name 
        FROM probate_sureties ps
        JOIN probate_applications pa ON ps.probate_application_id = pa.id
        WHERE ps.id = ?
    `;

    db.query(userSql, [id], (err, userResults) => {
        if (err) return res.status(500).json({ error: err.message });
        if (userResults.length === 0) return res.status(404).json({ error: 'Surety record not found' });

        const { user_id, surety_name } = userResults[0];

        const updateSql = 'UPDATE probate_sureties SET acceptance = ?, remark = ? WHERE id = ?';
        db.query(updateSql, [status, remark, id], (updateErr, result) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });

            // Notify User
            if (user_id) {
                const notifTitle = `Surety Review Update: ${surety_name}`;
                const notifMessage = `The surety ${surety_name} has been marked as ${status.toUpperCase()}. ${remark ? `Remark: ${remark}` : ''}`;
                createPublicNotification(user_id, notifTitle, notifMessage, 'info');
            }

            res.json({ message: 'Surety updated successfully' });
        });
    });
});


// Applicants Management Endpoints (for Jurat staff)
// Get all applicants
app.get('/api/applicants', authenticateToken, (req, res) => {
    // Only staff (especially jurats) can access this
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    let sql = `
        SELECT id, first_name, middle_name, surname, gender, age, email, phone, address, nin, status, created_at, picture_path, signature_path
        FROM applicants 
    `;

    const params = [];
    if (req.user.role === 'jurat') {
        sql += ' WHERE filed_by_staff_id = ?';
        params.push(req.user.id);
    } else if (req.user.role === 'pd') {
        sql += ' WHERE (filed_by_staff_id = ? OR id IN (SELECT applicant_id FROM probate_applications WHERE applicant_id IS NOT NULL))';
        params.push(req.user.id);
    }

    sql += ' ORDER BY created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching applicants:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get single applicant by ID
app.get('/api/applicants/:id', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    let sql = 'SELECT id, first_name, middle_name, surname, gender, age, email, phone, address, nin, status, created_at, picture_path, signature_path, filed_by_staff_id FROM applicants WHERE id = ?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Applicant not found' });

        const applicant = results[0];

        // Jurat restriction: can only see their own created applicants
        if (req.user.role === 'jurat' && applicant.filed_by_staff_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You can only view applicants you registered.' });
        }

        res.json(applicant);
    });
});

// Create new applicant
app.post('/api/applicants', authenticateToken, upload.fields([
    { name: 'picture', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]), logActivity, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const { firstName, middleName, surname, gender, age, email, phone, address, nin } = req.body;

    // Safely handle file uploads
    const picturePath = (req.files && req.files['picture']) ? `/uploads/${req.files['picture'][0].filename}` : null;
    const signaturePath = (req.files && req.files['signature']) ? `/uploads/${req.files['signature'][0].filename}` : null;

    console.log('Creating applicant:', { firstName, surname, gender, age, email, filed_by: req.user.id });

    if (!firstName || !surname) {
        return res.status(400).json({ error: 'First name and surname are required' });
    }

    const filed_by_staff_id = req.user.type === 'staff' ? req.user.id : null;

    const sql = `
        INSERT INTO applicants (first_name, middle_name, surname, gender, age, email, phone, address, nin, status, picture_path, signature_path, filed_by_staff_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `;

    db.query(sql, [firstName, middleName, surname, gender, age, email, phone, address, nin, picturePath, signaturePath, filed_by_staff_id], (err, result) => {
        if (err) {
            console.error('Error creating applicant:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message, details: err.sqlMessage || 'Database error' });
        }
        res.status(201).json({
            message: 'Applicant created successfully',
            id: result.insertId
        });
    });
});

// Update applicant
app.put('/api/applicants/:id', authenticateToken, upload.fields([
    { name: 'picture', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]), logActivity, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const { id } = req.params;

    // Check ownership for Jurats
    if (req.user.role === 'jurat') {
        db.query('SELECT filed_by_staff_id FROM applicants WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: 'Applicant not found' });
            if (results[0].filed_by_staff_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied. You can only update applicants you registered.' });
            }
            proceedWithUpdate();
        });
    } else {
        proceedWithUpdate();
    }

    function proceedWithUpdate() {
        const { first_name, middle_name, surname, gender, age, email, phone, address, nin, status } = req.body;

        let picturePath = req.body.picture_path;
        let signaturePath = req.body.signature_path;

        if (req.files['picture']) picturePath = `/uploads/${req.files['picture'][0].filename}`;
        if (req.files['signature']) signaturePath = `/uploads/${req.files['signature'][0].filename}`;

        const sql = `
        UPDATE applicants 
        SET first_name = ?, middle_name = ?, surname = ?, gender = ?, age = ?, 
            email = ?, phone = ?, address = ?, nin = ?, status = ?,
            picture_path = ?, signature_path = ?
        WHERE id = ?
    `;

        db.query(sql, [first_name, middle_name, surname, gender, age, email, phone, address, nin, status, picturePath, signaturePath, id], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Applicant not found' });
            }
            res.json({ message: 'Applicant updated successfully' });
        });
    }
});

// Delete applicant
app.delete('/api/applicants/:id', authenticateToken, logActivity, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const { id } = req.params;

    // Jurat ownership check
    if (req.user.role === 'jurat') {
        db.query('SELECT filed_by_staff_id FROM applicants WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: 'Applicant not found' });

            if (results[0].filed_by_staff_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied. You can only delete applicants you registered.' });
            }
            proceedToCheckDependencies();
        });
    } else {
        proceedToCheckDependencies();
    }

    function proceedToCheckDependencies() {
        // Check if applicant has any affidavits or probate applications
        const checkSql = `
            SELECT 
                (SELECT COUNT(*) FROM affidavits WHERE applicant_id = ?) as affidavit_count,
                (SELECT COUNT(*) FROM probate_applications WHERE applicant_id = ?) as probate_count
        `;

        db.query(checkSql, [id, id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            const { affidavit_count, probate_count } = results[0];
            if (affidavit_count > 0 || probate_count > 0) {
                return res.status(400).json({
                    error: 'Cannot delete applicant with existing applications. Please delete applications first.'
                });
            }

            db.query('DELETE FROM applicants WHERE id = ?', [id], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Applicant not found' });
                }
                res.json({ message: 'Applicant deleted successfully' });
            });
        });
    }
});

// File affidavit on behalf of applicant
app.post('/api/applicants/:id/affidavit', authenticateToken, upload.single('file'), logActivity, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const { id: applicantId } = req.params;
    const { type, content, amount } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    // First verify applicant exists
    db.query('SELECT id, email, first_name, surname FROM applicants WHERE id = ?', [applicantId], (err, applicants) => {
        if (err) return res.status(500).json({ error: err.message });
        if (applicants.length === 0) return res.status(404).json({ error: 'Applicant not found' });

        const applicant = applicants[0];

        // Create affidavit tied to applicant (using pdf_path for initial upload)
        const sql = `
            INSERT INTO affidavits (applicant_id, filed_by_staff_id, type, content, amount, status, language, pdf_path) 
            VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?)
        `;

        db.query(sql, [applicantId, req.user.id, type, content, amount, req.body.language || null, filePath], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const affidavitId = result.insertId;

            // Send notification email to applicant
            const fetchApplicantSql = 'SELECT email, first_name, surname FROM applicants WHERE id = ?';
            db.query(fetchApplicantSql, [applicantId], async (fetchErr, applicantResults) => {
                if (!fetchErr && applicantResults.length > 0) {
                    const applicant = applicantResults[0];
                    await sendAffidavitNotification(
                        applicant.email,
                        `${applicant.first_name} ${applicant.surname}`,
                        affidavitId,
                        'submitted'
                    );

                    // Notify CFO role about new affidavit
                    notifyStaffByRole(
                        'cfo',
                        'New Affidavit Filed (Jurat)',
                        `A new ${type} affidavit has been filed by Jurat staff for ${applicant.first_name} ${applicant.surname}. ID: CRMS-${affidavitId}`,
                        'info'
                    );

                    // Notify the Jurat staff member who filed it
                    createStaffNotification(
                        req.user.id,
                        'Affidavit Filed Successfully',
                        `You have successfully filed a ${type} affidavit for ${applicant.first_name} ${applicant.surname}. ID: CRMS-${affidavitId}`,
                        'success'
                    );
                }
            });

            res.status(201).json({
                message: 'Affidavit filed successfully on behalf of applicant',
                id: affidavitId
            });
        });
    });
});

// File probate application on behalf of applicant
app.post('/api/applicants/:id/probate', authenticateToken, logActivity, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const { id: applicantId } = req.params;
    let { deceasedName, dateOfDeath, homeAddress, deathLocation, occupation, employerName, employerAddress, relationshipToNok } = req.body;

    // Convert empty date to null to avoid SQL date errors
    if (dateOfDeath === '') dateOfDeath = null;

    // Validation
    const requiredFields = {
        'Deceased Name': deceasedName,
        'Date of Death': dateOfDeath,
        'Home Address': homeAddress,
        'Place of Death': deathLocation,
        'Occupation': occupation,
        'Relationship to NOK': relationshipToNok
    };

    const missing = Object.keys(requiredFields).filter(key => !requiredFields[key]);
    if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Verify applicant exists
    db.query('SELECT id FROM applicants WHERE id = ?', [applicantId], (err, applicants) => {
        if (err) return res.status(500).json({ error: err.message });
        if (applicants.length === 0) return res.status(404).json({ error: 'Applicant not found' });

        // Create probate application tied to applicant
        const sql = `
            INSERT INTO probate_applications 
            (applicant_id, filed_by_staff_id, deceased_name, date_of_death, home_address, death_location_address, occupation, employer_name, employer_address, relationship_to_nok, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_registrar')
        `;

        db.query(sql, [applicantId, req.user.id, deceasedName, dateOfDeath, homeAddress, deathLocation, occupation, employerName, employerAddress, relationshipToNok], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const appId = result.insertId;

            // Notify Staff
            notifyAllStaff(
                'New Probate Application (Jurat)',
                `A new probate application for ${deceasedName} has been filed by staff on behalf of an applicant. ID: PRB-${appId}`,
                'info'
            );

            res.status(201).json({
                message: 'Probate application created successfully on behalf of applicant',
                id: appId
            });
        });
    });
});

// Probate Document Storage
const probateStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads/probate_docs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'probate-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadProbate = multer({ storage: probateStorage });

// Surety Picture Storage
const suretyStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads/sureties');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'surety-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const suretyUpload = multer({ storage: suretyStorage });

app.get('/api/public/probate-config', authenticateToken, (req, res) => {
    db.query('SELECT * FROM probate_config WHERE publish_status = "active"', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/public/probate-document-payment/:docId', authenticateToken, (req, res) => {
    const { docId } = req.params;
    const { transaction_id, amount, payment_gateway } = req.body;

    db.query('SELECT * FROM probate_documents WHERE id = ?', [docId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Document not found' });

        const doc = results[0];

        db.query('UPDATE probate_documents SET pay_status = "paid" WHERE id = ?', [docId], (upErr) => {
            if (upErr) return res.status(500).json({ error: upErr.message });

            const paymentSql = `
                INSERT INTO payments 
                (user_id, amount, transaction_id, payment_gateway, payment_status, item_paid, probate_application_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const userId = req.user.id;
            const itemPaid = doc.document_name;

            db.query(paymentSql, [userId, amount, transaction_id, payment_gateway, 'completed', itemPaid, doc.probate_application_id], (payErr) => {
                if (payErr) {
                    console.error("Failed to record payment:", payErr);
                    return res.status(500).json({ error: `Failed to record payment details: ${payErr.message}` });
                }
                res.json({ message: 'Payment recorded and document status updated' });
            });
        });
    });
});

app.post('/api/public/probate/:id/documents', authenticateToken, (req, res, next) => {
    console.log(`[ENDPOINT HIT] Document Upload for Probate ${req.params.id}`);
    next();
}, uploadProbate.single('file'), (req, res) => {
    const { id } = req.params;
    const { documentName } = req.body;
    const filePath = req.file ? `/uploads/probate_docs/${req.file.filename}` : null;

    if (!filePath || !documentName) {
        return res.status(400).json({ error: 'File and Document Name are required' });
    }

    // Check if document already exists to replace it
    db.query('SELECT id, document_path FROM probate_documents WHERE probate_application_id = ? AND document_name = ?', [id, documentName], (checkErr, existing) => {
        if (checkErr) return res.status(500).json({ error: checkErr.message });

        // Lookup Config to get fee and other details
        db.query('SELECT * FROM probate_config WHERE document_name = ?', [documentName], (err, configs) => {
            if (err) return res.status(500).json({ error: err.message });

            const config = configs[0] || {};
            const fee = config.document_fee || 0;
            const paymentStatus = Number(fee) > 0 ? 'unpaid' : 'waived';

            if (existing.length > 0) {
                // DELETE old file if it exists
                if (existing[0].document_path) {
                    const oldFilePath = path.join(__dirname, existing[0].document_path);
                    if (fs.existsSync(oldFilePath)) {
                        try {
                            fs.unlinkSync(oldFilePath);
                        } catch (unlinkErr) {
                            console.error("Failed to delete old file:", unlinkErr);
                        }
                    }
                }

                // UPDATE existing
                const sql = `
                    UPDATE probate_documents 
                    SET document_path = ?, document_pay = ?, pay_status = ?, created_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;
                db.query(sql, [filePath, fee, paymentStatus, existing[0].id], (upErr) => {
                    if (upErr) return res.status(500).json({ error: upErr.message });
                    res.status(200).json({ message: 'Document updated', documentId: existing[0].id });
                });
            } else {
                // INSERT new
                const sql = `
                    INSERT INTO probate_documents 
                    (probate_application_id, document_name, document_path, document_pay, pay_status) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                db.query(sql, [id, documentName, filePath, fee, paymentStatus], (insertErr, result) => {
                    if (insertErr) return res.status(500).json({ error: insertErr.message });
                    res.status(201).json({ message: 'Document uploaded', documentId: result.insertId });
                });
            }
        });
    });
});

app.delete('/api/public/probate/documents/:docId', authenticateToken, (req, res) => {
    const { docId } = req.params;

    db.query('SELECT document_path FROM probate_documents WHERE id = ?', [docId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Document not found' });

        const docPath = results[0].document_path;
        if (docPath) {
            const fullPath = path.join(__dirname, docPath);
            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                } catch (unlinkErr) {
                    console.error("Failed to delete file from disk:", unlinkErr);
                }
            }
        }

        db.query('DELETE FROM probate_documents WHERE id = ?', [docId], (delErr) => {
            if (delErr) return res.status(500).json({ error: delErr.message });
            res.json({ message: 'Document deleted successfully' });
        });
    });
});


app.post('/api/public/probate', authenticateToken, logActivity, (req, res) => {
    console.log("[ENDPOINT HIT] POST /api/public/probate", req.body);
    const {
        deceasedName,
        dateOfDeath,
        homeAddress,
        deathLocation,
        occupation,
        employerName,
        employerAddress,
        applicantId,
        relationshipToNok
    } = req.body;
    const userId = req.user.id;

    const sql = `
        INSERT INTO probate_applications 
        (user_id, applicant_id, deceased_name, date_of_death, home_address, death_location_address, occupation, employer_name, employer_address, relationship_to_nok, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_registrar')
    `;

    const params = [
        userId,
        applicantId || null,
        deceasedName,
        dateOfDeath,
        homeAddress,
        deathLocation,
        occupation,
        employerName || null,
        employerAddress || null,
        relationshipToNok || null
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("[DB ERROR] POST /api/public/probate:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("[DB SUCCESS] Probate Application Created. ID:", result.insertId);
        const appId = result.insertId;

        // Notify User
        createPublicNotification(
            userId,
            'Probate Application Filed',
            `Your probate application for ${deceasedName} has been submitted. Status: Pending Registrar Review. ID: PRB-${appId}`,
            'info'
        );

        // Notify Staff (Both registrar and pr roles for compatibility)
        notifyStaffByRole(
            ['registrar', 'pr'],
            'New Probate Application',
            `A new probate application for ${deceasedName} has been filed by a public user. ID: PRB-${appId}`,
            'info'
        );

        res.status(201).json({
            message: 'Probate application filed successfully',
            id: appId
        });
    });
});

// PD/Staff: File probate on behalf of applicant
app.post('/api/applicants/:id/probate', authenticateToken, logActivity, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    const { id: applicantId } = req.params;
    const {
        deceasedName,
        dateOfDeath,
        homeAddress,
        deathLocation,
        occupation,
        employerName,
        employerAddress,
        relationshipToNok
    } = req.body;

    const sql = `
        INSERT INTO probate_applications 
        (user_id, applicant_id, deceased_name, date_of_death, home_address, death_location_address, occupation, employer_name, employer_address, relationship_to_nok, status, filed_by_staff_id) 
        VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_registrar', ?)
    `;

    const params = [
        applicantId,
        deceasedName,
        dateOfDeath,
        homeAddress,
        deathLocation,
        occupation,
        employerName || null,
        employerAddress || null,
        relationshipToNok || null,
        req.user.id
    ];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Probate application filed by staff', id: result.insertId });
    });
});

app.post('/api/applicants/:id/probate/:appId/documents', authenticateToken, upload.single('file'), (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });
    const { appId } = req.params;
    const { documentName } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;
    console.log(`[DEBUG] Uploading for appId: ${appId}, docName: ${documentName}, filePath: ${filePath}`);

    if (!filePath) return res.status(400).json({ error: 'No file uploaded' });

    const sql = 'INSERT INTO probate_documents (probate_application_id, document_name, document_path, pay_status) VALUES (?, ?, ?, ?)';
    db.query(sql, [appId, documentName, filePath, 'waived'], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Document uploaded' });
    });
});

// Explicitly placed here to avoid shadowing
app.get('/api/user/probate-applications', authenticateToken, (req, res) => {
    const userId = req.user.id;
    console.log(`[ENDPOINT HIT] Fetching probate apps for user: ${userId}`);
    const sql = `
        SELECT p.*, 
               COALESCE(u.first_name, ap.first_name) as applicant_first_name, 
               COALESCE(u.surname, ap.surname) as applicant_surname, 
               COALESCE(u.email, ap.email) as applicant_email
        FROM probate_applications p
        LEFT JOIN public_users u ON p.user_id = u.id
        LEFT JOIN applicants ap ON p.applicant_id = ap.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("DB Error fetching probate apps:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.get('/api/user/probate-applications/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const sql = `
        SELECT pa.*, 
               COALESCE(u.first_name, ap.first_name) as applicant_first_name, 
               COALESCE(u.surname, ap.surname) as applicant_surname, 
               COALESCE(u.email, ap.email) as applicant_email, 
               COALESCE(u.phone, ap.phone) as applicant_phone, 
               COALESCE(u.address, ap.address) as applicant_address, 
               COALESCE(u.profile_pic, ap.picture_path) as applicant_profile_pic,
               COALESCE(u.nin, ap.nin) as applicant_nin, 
               COALESCE(u.gender, ap.gender) as applicant_gender, 
               COALESCE(u.age, ap.age) as applicant_age
        FROM probate_applications pa
        LEFT JOIN public_users u ON pa.user_id = u.id
        LEFT JOIN applicants ap ON pa.applicant_id = ap.id
        WHERE pa.id = ? AND pa.user_id = ?
    `;

    db.query(sql, [id, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Application not found' });

        const application = results[0];

        // Fetch related data
        const queries = {
            beneficiaries: 'SELECT * FROM probate_beneficiaries WHERE probate_application_id = ?',
            sureties: 'SELECT * FROM probate_sureties WHERE probate_application_id = ?',
            properties: 'SELECT * FROM probate_estate WHERE probate_application_id = ?',
            documents: 'SELECT * FROM probate_documents WHERE probate_application_id = ?',
            payments: 'SELECT * FROM payments WHERE probate_application_id = ?'
        };

        const responseData = { ...application };
        let completedQueries = 0;
        const totalQueries = Object.keys(queries).length;

        Object.entries(queries).forEach(([key, query]) => {
            db.query(query, [id], (qErr, qResults) => {
                if (!qErr) {
                    responseData[key] = qResults;
                }
                completedQueries++;
                if (completedQueries === totalQueries) {
                    res.json(responseData);
                }
            });
        });
    });
});

// Update Probate Application (Deceased Details & Relationship)
app.put('/api/user/probate-applications/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { deceased_name, date_of_death, home_address, death_location_address, occupation, relationship_to_nok } = req.body;

    const sql = `
        UPDATE probate_applications 
        SET deceased_name = ?, date_of_death = ?, home_address = ?, death_location_address = ?, occupation = ?, relationship_to_nok = ?
        WHERE id = ? AND (user_id = ? OR filed_by_staff_id = ?)
    `;

    db.query(sql, [deceased_name, date_of_death, home_address, death_location_address, occupation, relationship_to_nok, id, userId, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Application not found' });
        res.json({ message: 'Application updated successfully' });
    });
});

// Beneficiaries CRUD
app.post('/api/user/probate-applications/:id/beneficiaries', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, relationship, age, gender, address, phone } = req.body;
    console.log(`[BENEFICIARY ADD] Probate ID: ${id}, Body:`, req.body);
    const sql = 'INSERT INTO probate_beneficiaries (probate_application_id, name, relationship, age, gender, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [id, name, relationship, age, gender, address, phone], (err, result) => {
        if (err) {
            console.error('[BENEFICIARY ADD ERROR]', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('[BENEFICIARY ADD SUCCESS] ID:', result.insertId);
        res.status(201).json({ message: 'Beneficiary added', id: result.insertId });
    });
});

app.put('/api/user/probate-applications/:id/beneficiaries/:id2', authenticateToken, (req, res) => {
    const { id2 } = req.params;
    const { name, relationship, age, gender, address, phone } = req.body;
    console.log(`[BENEFICIARY UPDATE] ID: ${id2}, Body:`, req.body);
    const sql = 'UPDATE probate_beneficiaries SET name = ?, relationship = ?, age = ?, gender = ?, address = ?, phone = ? WHERE id = ?';
    db.query(sql, [name, relationship, age, gender, address, phone, id2], (err, result) => {
        if (err) {
            console.error('[BENEFICIARY UPDATE ERROR]', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('[BENEFICIARY UPDATE SUCCESS]');
        res.json({ message: 'Beneficiary updated' });
    });
});

app.delete('/api/user/probate-applications/:id/beneficiaries/:id2', authenticateToken, (req, res) => {
    const { id2 } = req.params;
    db.query('DELETE FROM probate_beneficiaries WHERE id = ?', [id2], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Beneficiary deleted' });
    });
});

// Sureties CRUD
app.post('/api/user/probate-applications/:id/sureties', authenticateToken, suretyUpload.single('picture'), (req, res) => {
    const { id } = req.params;
    const { name, address, networth, remark, acceptance } = req.body;
    let picture_path = null;
    if (req.file) {
        picture_path = `/uploads/sureties/${req.file.filename}`;
    }
    const sql = 'INSERT INTO probate_sureties (probate_application_id, name, address, networth, remark, acceptance, picture_path) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [id, name, address, networth, remark, acceptance, picture_path], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Surety added', id: result.insertId });
    });
});

app.put('/api/user/probate-applications/:id/sureties/:id2', authenticateToken, suretyUpload.single('picture'), (req, res) => {
    const { id2 } = req.params;
    const { name, address, networth, remark, acceptance } = req.body;

    let sql = 'UPDATE probate_sureties SET name = ?, address = ?, networth = ?, remark = ?, acceptance = ?';
    let params = [name, address, networth, remark, acceptance];

    if (req.file) {
        sql += ', picture_path = ?';
        params.push(`/uploads/sureties/${req.file.filename}`);
    }

    sql += ' WHERE id = ?';
    params.push(id2);

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Surety updated' });
    });
});

app.delete('/api/user/probate-applications/:id/sureties/:id2', authenticateToken, (req, res) => {
    const { id2 } = req.params;
    db.query('DELETE FROM probate_sureties WHERE id = ?', [id2], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Surety deleted' });
    });
});

// Estate / Properties CRUD (probate_estate)
app.post('/api/user/probate-applications/:id/properties', authenticateToken, (req, res) => {
    const { id } = req.params;
    const {
        estate_type, property_name, property_address, property_value,
        bank_name, bank_account, bank_account_name, bank_balance,
        broker_name, broker_account, broker_account_name, share_value,
        remark
    } = req.body;

    const sql = `INSERT INTO probate_estate (
        probate_application_id, estate_type, property_name, property_address, property_value,
        bank_name, bank_account, bank_account_name, bank_balance,
        broker_name, broker_account, broker_account_name, share_value,
        remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
        id, estate_type, property_name, property_address, property_value,
        bank_name, bank_account, bank_account_name, bank_balance,
        broker_name, broker_account, broker_account_name, share_value,
        remark
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Estate item added', id: result.insertId });
    });
});

app.put('/api/user/probate-applications/:id/properties/:id2', authenticateToken, (req, res) => {
    const { id2 } = req.params;
    const {
        estate_type, property_name, property_address, property_value,
        bank_name, bank_account, bank_account_name, bank_balance,
        broker_name, broker_account, broker_account_name, share_value,
        remark
    } = req.body;

    const sql = `UPDATE probate_estate SET 
        estate_type = ?, property_name = ?, property_address = ?, property_value = ?,
        bank_name = ?, bank_account = ?, bank_account_name = ?, bank_balance = ?,
        broker_name = ?, broker_account = ?, broker_account_name = ?, share_value = ?,
        remark = ?
        WHERE id = ?`;

    db.query(sql, [
        estate_type, property_name, property_address, property_value,
        bank_name, bank_account, bank_account_name, bank_balance,
        broker_name, broker_account, broker_account_name, share_value,
        remark, id2
    ], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Estate item updated' });
    });
});

app.delete('/api/user/probate-applications/:id/properties/:id2', authenticateToken, (req, res) => {
    const { id2 } = req.params;
    db.query('DELETE FROM probate_estate WHERE id = ?', [id2], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Estate item deleted' });
    });
});

app.get('/api/applicants/:id/affidavits', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const { id } = req.params;
    const sql = 'SELECT * FROM affidavits WHERE applicant_id = ? ORDER BY created_at DESC';

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get all probate applications filed for a specific applicant
app.get('/api/applicants/:id/probate', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const { id } = req.params;
    const sql = 'SELECT * FROM probate_applications WHERE applicant_id = ? ORDER BY created_at DESC';

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Banner Endpoints
app.get('/api/banners', (req, res) => {
    db.query('SELECT * FROM banners ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/banners', logActivity, (req, res) => {
    const { image_url, title, description } = req.body;
    const sql = 'INSERT INTO banners (image_url, title, description) VALUES (?, ?, ?)';
    db.query(sql, [image_url, title, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Banner added', id: result.insertId });
    });
});

app.delete('/api/banners/:id', logActivity, (req, res) => {
    const sql = 'DELETE FROM banners WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Banner deleted' });
    });
});

// VideoSDK Token Endpoint
app.get('/api/videosdk/token', (req, res) => {
    const API_KEY = process.env.VIDEOSDK_API_KEY;
    const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

    if (!API_KEY || !SECRET_KEY) {
        return res.status(500).json({ error: 'VideoSDK keys are not configured' });
    }

    const options = { expiresIn: "10m", algorithm: "HS256" };
    const payload = {
        apikey: API_KEY,
        permissions: ["allow_join", "allow_mod", "ask_join"], // Trigger permission.
    };
    try {
        const token = jwt.sign(payload, SECRET_KEY, options);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// Jurat Staff Endpoints
app.get('/api/staff/jurat/affidavits', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    // Only show affidavits where the associated payment was filed by this staff member
    const sql = `
        SELECT a.*, 
               COALESCE(ap.first_name, u.first_name) as first_name, 
               COALESCE(ap.surname, u.surname) as surname,
               COALESCE(ap.email, u.email) as email,
               COALESCE(ap.phone, u.phone) as phone,
               IF(a.filed_by_staff_id IS NOT NULL, 'Jurat', 'Self') as source,
               s.name as filed_by_name,
               s2.name as approved_by_name,
               s2.signature_path as approved_by_signature
        FROM affidavits a
        LEFT JOIN applicants ap ON a.applicant_id = ap.id
        LEFT JOIN public_users u ON a.user_id = u.id
        LEFT JOIN staff_users s ON a.filed_by_staff_id = s.id
        LEFT JOIN staff_users s2 ON a.approved_by = s2.id
        WHERE a.filed_by_staff_id = ?
        ORDER BY a.created_at DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/staff/jurat/probate', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    // Only show probate applications where the associated payment was filed by this staff member
    const sql = `
        SELECT p.*, 
               COALESCE(ap.first_name, u.first_name) as first_name, 
               COALESCE(ap.surname, u.surname) as surname,
               COALESCE(ap.email, u.email) as email,
               COALESCE(ap.phone, u.phone) as phone
        FROM probate_applications p
        LEFT JOIN applicants ap ON p.applicant_id = ap.id
        LEFT JOIN public_users u ON p.user_id = u.id
        WHERE p.filed_by_staff_id = ?
        ORDER BY p.created_at DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.put('/api/staff/affidavits/:id', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });
    const { content, type, amount, status, remarks, language } = req.body;
    db.query('UPDATE affidavits SET content = ?, type = ?, amount = ?, status = ?, remarks = ?, language = ? WHERE id = ?',
        [content, type, amount, status, remarks || null, language || null, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Affidavit updated successfully' });
        });
});

app.put('/api/staff/probate/:id', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });
    const { deceased_name, status, remarks } = req.body;
    db.query('UPDATE probate_applications SET deceased_name = ?, status = ?, remarks = ? WHERE id = ?',
        [deceased_name, status, remarks || null, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Notify User
            if (status !== 'pending_registrar') {
                const fetchUserSql = `
                    SELECT p.id, p.user_id, p.applicant_id,
                           COALESCE(u.email, app.email) as email,
                           COALESCE(u.first_name, app.first_name) as first_name,
                           COALESCE(u.surname, app.surname) as surname,
                           COALESCE(u.id, NULL) as public_user_id
                    FROM probate_applications p
                    LEFT JOIN public_users u ON p.user_id = u.id
                    LEFT JOIN applicants app ON p.applicant_id = app.id
                    WHERE p.id = ?
                `;
                db.query(fetchUserSql, [req.params.id], async (fetchErr, results) => {
                    if (!fetchErr && results.length > 0) {
                        const user = results[0];
                        const title = status === 'approved' ? 'Probate Application Approved' : 'Probate Application Updated';
                        const msg = `Your probate application for ${deceased_name} has been updated to: ${status}. ${remarks ? `Remarks: ${remarks}` : ''}`;



                        // Email
                        if (user.email) {
                            // Can add sendProbateNotification here later
                        }

                        // In-App Notification (only for public users)
                        if (user.public_user_id) {
                            createPublicNotification(
                                user.public_user_id,
                                title,
                                msg,
                                status === 'approved' ? 'success' : 'info'
                            );
                        }
                    }
                });
            }

            res.json({ message: 'Probate application updated successfully' });
        });
});

app.get('/api/staff/jurat/payments', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    let sql = `
        SELECT p.*, 
               COALESCE(NULLIF(app.first_name, ''), u.first_name) as first_name,
               COALESCE(NULLIF(app.surname, ''), u.surname) as surname,
               COALESCE(NULLIF(app.email, ''), u.email) as email,
               COALESCE(NULLIF(app.phone, ''), u.phone) as phone,
               COALESCE(NULLIF(app.address, ''), u.address) as address,
               COALESCE(NULLIF(app.gender, ''), u.gender) as gender,
               COALESCE(NULLIF(app.age, ''), u.age) as age,
               COALESCE(NULLIF(app.nin, ''), u.nin) as nin,
               COALESCE(p.payment_date, p.created_at) as payment_date,
               a.type as affidavit_title, 
               pr.deceased_name
        FROM payments p
        LEFT JOIN applicants app ON p.applicant_id = app.id
        LEFT JOIN public_users u ON p.user_id = u.id
        LEFT JOIN affidavits a ON p.affidavit_id = a.id
        LEFT JOIN probate_applications pr ON p.probate_application_id = pr.id
    `;

    const params = [];
    if (req.user.role === 'jurat') {
        sql += ' WHERE p.filed_by_staff_id = ?';
        params.push(req.user.id);
    } else if (req.user.role === 'clerk') {
        sql += ' WHERE p.affidavit_id IS NOT NULL';
    }

    sql += ' ORDER BY p.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// Payment Endpoints
app.get('/api/payments/user/:userId', authenticateToken, (req, res) => {
    const userId = req.params.userId;
    // Allow if requesting user is the same as userId OR if requesting user is staff
    if (req.user.type !== 'staff' && req.user.id != userId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const sql = `
        SELECT p.*, a.type as affidavit_title, pr.deceased_name
        FROM payments p
        LEFT JOIN affidavits a ON p.affidavit_id = a.id
        LEFT JOIN probate_applications pr ON p.probate_application_id = pr.id
        WHERE p.user_id = ? 
        ORDER BY p.created_at DESC
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/staff/payments/all', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    let sql = `
        SELECT p.*, a.type as affidavit_title, pr.deceased_name,
               COALESCE(u.first_name, ap.first_name) as first_name,
               COALESCE(u.surname, ap.surname) as surname
        FROM payments p
        LEFT JOIN affidavits a ON p.affidavit_id = a.id
        LEFT JOIN probate_applications pr ON p.probate_application_id = pr.id
        LEFT JOIN public_users u ON p.user_id = u.id
        LEFT JOIN applicants ap ON p.applicant_id = ap.id
    `;

    const params = [];
    if (req.user.role === 'pd') {
        sql += ' WHERE p.probate_application_id IS NOT NULL';
    }

    sql += ' ORDER BY p.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/payments', authenticateToken, logActivity, (req, res) => {
    console.log("[ENDPOINT HIT] POST /api/payments", req.body);
    const { user_id, applicant_id, affidavit_id, probate_application_id, item_paid, amount, transaction_id, status, payment_status } = req.body;

    const filed_by_staff_id = req.user.type === 'staff' ? req.user.id : null;

    const sql = `
        INSERT INTO payments (user_id, applicant_id, affidavit_id, probate_application_id, item_paid, amount, transaction_id, payment_status, filed_by_staff_id, payment_gateway)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        user_id || (req.user.type === 'public' ? req.user.id : null),
        applicant_id || null,
        affidavit_id || null,
        probate_application_id || null,
        item_paid,
        amount,
        transaction_id || `TRX-${Date.now()}`,
        payment_status || status || 'completed',
        filed_by_staff_id,
        req.body.payment_gateway || 'paystack'
    ];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Payment recorded', id: result.insertId });
    });
});

// Jurat Stats
app.get('/api/staff/jurat/stats', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    const staffId = req.user.id;
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM applicants WHERE filed_by_staff_id = ?) as total_applicants,
            (SELECT SUM(amount) FROM payments WHERE payment_status = 'completed' AND filed_by_staff_id = ?) as total_fees,
            (SELECT COUNT(*) FROM affidavits a JOIN payments p ON a.id = p.affidavit_id WHERE p.filed_by_staff_id = ?) as total_affidavits,
            (SELECT COUNT(*) FROM probate_applications pr JOIN payments p ON pr.id = p.probate_application_id WHERE p.filed_by_staff_id = ?) as total_probate,
            (SELECT COUNT(*) FROM affidavits a JOIN payments p ON a.id = p.affidavit_id WHERE a.status = 'completed' AND p.filed_by_staff_id = ?) as completed_affidavits,
            (SELECT COUNT(*) FROM probate_applications pr JOIN payments p ON pr.id = p.probate_application_id WHERE pr.status = 'completed' AND p.filed_by_staff_id = ?) as completed_probate
    `;

    db.query(sql, [staffId, staffId, staffId, staffId, staffId, staffId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

app.get('/api/ping', (req, res) => res.json({ message: 'pong', time: new Date() }));

// CFO Financial Stats
app.get('/api/staff/admin/logs', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff' || req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    const sql = `
        SELECT l.*, 
               CASE 
                   WHEN l.user_type = 'public' THEN (SELECT CONCAT(first_name, ' ', surname) FROM public_users WHERE id = l.user_id)
                   WHEN l.user_type = 'staff' THEN (SELECT name FROM staff_users WHERE id = l.user_id)
                   ELSE 'Anonymous'
               END as user_name
        FROM activity_logs l
        ORDER BY l.\`timestamp\` DESC
        LIMIT 100
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/staff/admin/settings', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff' || req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    // Dummy settings for now, or fetch from a settings table if implemented
    res.json({
        maintenance_mode: false,
        allow_new_registrations: true,
        notification_email: 'admin@crms.com',
        backup_frequency: 'daily'
    });
});
app.get('/api/staff/cfo/stats', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff' || (req.user.role !== 'cfo' && req.user.role !== 'clerk')) return res.status(403).json({ error: 'Access denied' });

    const sql = `
            SELECT 
                (SELECT COUNT(*) FROM public_users) as total_users,
                (SELECT COUNT(*) FROM affidavits) as total_affidavits,
                (SELECT COUNT(*) FROM affidavits WHERE status = 'completed') as completed_affidavits,
                (SELECT COUNT(*) FROM affidavits WHERE status = 'rejected') as rejected_affidavits,
                (SELECT COUNT(*) FROM affidavits WHERE status = 'pending') as pending_affidavits,
                (SELECT COUNT(*) FROM affidavits WHERE virtual_oath_taken IN ('requested', 'completed')) as total_oaths
        `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

// Registry Stats (PR/CR)
app.get('/api/staff/registry/stats', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') return res.status(403).json({ error: 'Access denied' });

    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM affidavits WHERE status = 'pending') as pending_affidavits,
            (SELECT COUNT(*) FROM probate_applications WHERE status = 'pending_registrar') as pending_probate_registrar,
            (SELECT COUNT(*) FROM probate_applications WHERE status = 'cr_pending') as pending_probate_cr,
            (SELECT COUNT(*) FROM affidavits WHERE status = 'completed') as approved_affidavits,
            (SELECT COUNT(*) FROM probate_applications WHERE status = 'completed') as approved_probate,
            (SELECT COUNT(*) FROM affidavits WHERE virtual_oath_taken = 'requested') as oath_requests,
            (SELECT COUNT(*) FROM probate_applications) as total_probate,
            (SELECT COUNT(*) FROM probate_applications WHERE status IN ('approved', 'completed')) as letters_of_admin
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});


// Public User Stats
app.get('/api/public/stats', authenticateToken, (req, res) => {
    console.log('[PUBLIC STATS] Request received from user:', req.user);

    if (req.user.type !== 'public') {
        console.warn('[PUBLIC STATS] Access denied - user type:', req.user.type);
        return res.status(403).json({ error: 'Access denied' });
    }

    const userId = req.user.id;
    console.log('[PUBLIC STATS] Fetching stats for user ID:', userId);

    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM affidavits WHERE user_id = ?) as total_affidavits,
            (SELECT COUNT(*) FROM affidavits WHERE user_id = ? AND status = 'completed') as completed_affidavits,
            (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = ? AND item_paid LIKE '%Affidavit%' AND payment_status = 'completed') as affidavit_spent,
            
            (SELECT COUNT(*) FROM probate_applications WHERE user_id = ?) as total_probate,
            (SELECT COUNT(*) FROM probate_applications WHERE user_id = ? AND (status IN ('approved', 'completed', 'under_processing') OR approval = 'approved')) as approved_probate,
            (SELECT COUNT(*) FROM probate_applications WHERE user_id = ? AND (status LIKE 'pending%' OR status = 'cr_pending')) as pending_probate,
            (SELECT COUNT(*) FROM probate_applications WHERE user_id = ? AND status = 'rejected') as rejected_probate,
            (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = ? AND (item_paid LIKE '%Probate%' OR item_paid LIKE '%Letter of Admin%') AND payment_status = 'completed') as probate_spent,
            
            (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = ? AND payment_status = 'completed') as total_spent
    `;
    db.query(sql, [userId, userId, userId, userId, userId, userId, userId, userId, userId], (err, results) => {
        if (err) {
            console.error("[PUBLIC STATS] Database error:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log('[PUBLIC STATS] Query results:', results[0]);
        res.json(results[0] || {});
    });
});




const createInitialAdmin = async () => {
    const name = 'Super Admin';
    const email = 'admin@crms.com';
    const password = 'adminpassword';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('SELECT * FROM staff_users WHERE email = ?', [email], (err, results) => {
        if (results && results.length === 0) {
            db.query('INSERT INTO staff_users (name, email, password, role) VALUES (?, ?, ?, "admin")', [name, email, hashedPassword]);
        }
    });
};

const createInitialPublicUser = async () => {
    const name = 'John Public';
    const email = 'user@crms.com';
    const password = 'userpassword';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('SELECT * FROM public_users WHERE email = ?', [email], (err, results) => {
        if (results && results.length === 0) {
            db.query('INSERT INTO public_users (first_name, surname, email, password) VALUES (?, ?, ?, ?)', ['John', 'Public', email, hashedPassword]);
        }
    });
};

const createInitialBanners = () => {
    db.query('SELECT * FROM banners', (err, results) => {
        if (results && results.length === 0) {
            const banners = [
                ['https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200', 'Digital Justice for All', 'Access court services from the comfort of your home.'],
                ['https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1200', 'Secure Probate Management', 'Manage beneficiaries and letter of administration securely.'],
                ['https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200', 'Affidavits Simplified', 'Use our official templates to file your affidavits in minutes.']
            ];
            banners.forEach(b => {
                db.query('INSERT INTO banners (image_url, title, description) VALUES (?, ?, ?)', b);
            });
        }
    });
};

// ============================================
// SUPPORT TICKETS ENDPOINTS
// ============================================

// Generate unique ticket number
const generateTicketNumber = () => {
    const prefix = 'TKT';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
};

// Auto-assign ticket to staff based on category
const autoAssignTicket = (category, callback) => {
    // Default mapping of categories to staff roles
    const roleMapping = {
        'affidavit': 'jurat',
        'probate': 'pr',
        'payment': 'cfo',
        'technical': 'admin',
        'other': 'admin'
    };

    const targetRole = roleMapping[category] || 'admin';

    // Find active staff member of that role with fewest open/in_progress tickets
    // status check matches support_tickets.status enum values
    const sql = `
        SELECT s.id, COUNT(t.id) as ticket_count
        FROM staff_users s
        LEFT JOIN support_tickets t ON s.id = t.assigned_to AND t.status IN ('open', 'in_progress')
        WHERE s.role = ? AND s.status = 'active'
        GROUP BY s.id
        ORDER BY ticket_count ASC
        LIMIT 1
    `;

    db.query(sql, [targetRole], (err, results) => {
        if (err || results.length === 0) {
            // If no staff found for that specific role, default to finding any active admin
            if (targetRole !== 'admin') {
                db.query(sql, ['admin'], (adminErr, adminResults) => {
                    if (adminErr || adminResults.length === 0) {
                        return callback(null);
                    }
                    callback(adminResults[0].id);
                });
            } else {
                callback(null);
            }
        } else {
            callback(results[0].id);
        }
    });
};

// Create new support ticket
app.post('/api/support/tickets', authenticateToken, (req, res) => {
    const { subject, category, priority, description } = req.body;
    const ticketNumber = generateTicketNumber();

    if (!subject || !category || !description) {
        return res.status(400).json({ error: 'Subject, category, and description are required' });
    }

    const userId = req.user.type === 'public' ? req.user.id : null;
    const staffId = req.user.type === 'staff' ? req.user.id : null;

    // Automatic pre-assignment based on category
    autoAssignTicket(category, (assignedToId) => {
        const sql = `
            INSERT INTO support_tickets (ticket_number, user_id, staff_id, subject, category, priority, description, status, assigned_to)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
        `;

        db.query(sql, [ticketNumber, userId, staffId, subject, category, priority || 'medium', description, assignedToId], (err, result) => {
            if (err) {
                console.error('Error creating ticket:', err);
                return res.status(500).json({ error: 'Failed to create ticket' });
            }

            // Notify admin staff about new ticket
            notifyStaffByRole('admin', 'New Support Ticket', `Ticket ${ticketNumber}: ${subject}`, 'info');

            // Send confirmation to ticket creator
            if (userId) {
                createPublicNotification(userId, 'Support Ticket Created', `Your ticket ${ticketNumber} has been created. We'll respond shortly.`, 'success');
            } else if (staffId) {
                createStaffNotification(staffId, 'Support Ticket Created', `Your ticket ${ticketNumber} has been created.`, 'success');
            }

            // Notify assigned staff member
            if (assignedToId) {
                createStaffNotification(assignedToId, 'New Ticket Assigned', `Ticket ${ticketNumber}: ${subject} has been automatically assigned to you.`, 'info');
            }

            res.status(201).json({
                message: 'Ticket created successfully',
                ticketId: result.insertId,
                ticketNumber,
                assignedTo: assignedToId
            });
        });
    });
});

// Get all tickets for current user/staff
app.get('/api/support/tickets', authenticateToken, (req, res) => {
    const { status, category } = req.query;

    let sql = `
        SELECT 
            st.*,
            u.first_name as user_first_name,
            u.surname as user_surname,
            u.email as user_email,
            s.name as staff_name,
            s.email as staff_email,
            a.name as assigned_name
        FROM support_tickets st
        LEFT JOIN public_users u ON st.user_id = u.id
        LEFT JOIN staff_users s ON st.staff_id = s.id
        LEFT JOIN staff_users a ON st.assigned_to = a.id
        WHERE 1=1
    `;

    const params = [];

    // Filter by user type
    if (req.user.type === 'public') {
        sql += ' AND st.user_id = ?';
        params.push(req.user.id);
    } else if (req.user.type === 'staff') {
        // Staff can see tickets they created or are assigned to, or all if admin
        if (req.user.role !== 'admin') {
            sql += ' AND (st.staff_id = ? OR st.assigned_to = ?)';
            params.push(req.user.id, req.user.id);
        }
    }

    if (status) {
        sql += ' AND st.status = ?';
        params.push(status);
    }

    if (category) {
        sql += ' AND st.category = ?';
        params.push(category);
    }

    sql += ' ORDER BY st.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching tickets:', err);
            return res.status(500).json({ error: 'Failed to fetch tickets' });
        }
        res.json(results);
    });
});

// Get single ticket details with messages
app.get('/api/support/tickets/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    const ticketSql = `
        SELECT 
            st.*,
            u.first_name as user_first_name,
            u.surname as user_surname,
            u.email as user_email,
            s.name as staff_name,
            s.email as staff_email,
            a.name as assigned_name
        FROM support_tickets st
        LEFT JOIN public_users u ON st.user_id = u.id
        LEFT JOIN staff_users s ON st.staff_id = s.id
        LEFT JOIN staff_users a ON st.assigned_to = a.id
        WHERE st.id = ?
    `;

    db.query(ticketSql, [id], (err, ticketResults) => {
        if (err) {
            console.error('Error fetching ticket:', err);
            return res.status(500).json({ error: 'Failed to fetch ticket' });
        }

        if (ticketResults.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = ticketResults[0];

        // Check access permission
        if (req.user.type === 'public' && ticket.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (req.user.type === 'staff' && req.user.role !== 'admin' &&
            ticket.staff_id !== req.user.id && ticket.assigned_to !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch messages
        const messagesSql = `
            SELECT 
                stm.*,
                CASE 
                    WHEN stm.sender_type = 'user' THEN CONCAT(u.first_name, ' ', u.surname)
                    WHEN stm.sender_type = 'staff' THEN s.name
                END as sender_name
            FROM support_ticket_messages stm
            LEFT JOIN public_users u ON stm.sender_type = 'user' AND stm.sender_id = u.id
            LEFT JOIN staff_users s ON stm.sender_type = 'staff' AND stm.sender_id = s.id
            WHERE stm.ticket_id = ?
            ORDER BY stm.created_at ASC
        `;

        db.query(messagesSql, [id], (msgErr, messages) => {
            if (msgErr) {
                console.error('Error fetching messages:', msgErr);
                return res.status(500).json({ error: 'Failed to fetch messages' });
            }

            res.json({
                ...ticket,
                messages
            });
        });
    });
});

// Add message to ticket
app.post('/api/support/tickets/:id/messages', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const senderType = req.user.type === 'public' ? 'user' : 'staff';
    const senderId = req.user.id;

    // First, get ticket details
    db.query('SELECT * FROM support_tickets WHERE id = ?', [id], (err, ticketResults) => {
        if (err || ticketResults.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = ticketResults[0];

        const sql = `
            INSERT INTO support_ticket_messages (ticket_id, sender_type, sender_id, message)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [id, senderType, senderId, message], (insertErr, result) => {
            if (insertErr) {
                console.error('Error adding message:', insertErr);
                return res.status(500).json({ error: 'Failed to add message' });
            }

            // Update ticket timestamp
            db.query('UPDATE support_tickets SET updated_at = NOW() WHERE id = ?', [id]);

            // Send notification to the other party
            if (senderType === 'user' && ticket.assigned_to) {
                createStaffNotification(
                    ticket.assigned_to,
                    `New Message on Ticket ${ticket.ticket_number}`,
                    `User replied: ${message.substring(0, 100)}...`,
                    'info'
                );
            } else if (senderType === 'staff' && ticket.user_id) {
                createPublicNotification(
                    ticket.user_id,
                    `New Message on Ticket ${ticket.ticket_number}`,
                    `Support replied: ${message.substring(0, 100)}...`,
                    'info'
                );
            }

            res.status(201).json({
                message: 'Message added successfully',
                messageId: result.insertId
            });
        });
    });
});

// Update ticket status (staff only)
app.put('/api/support/tickets/:id/status', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const { id } = req.params;
    const { status, resolution, assignedTo } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    let sql = 'UPDATE support_tickets SET status = ?, updated_at = NOW()';
    const params = [status];

    if (resolution) {
        sql += ', resolution = ?';
        params.push(resolution);
    }

    if (assignedTo !== undefined) {
        sql += ', assigned_to = ?';
        params.push(assignedTo);
    }

    if (status === 'resolved') {
        sql += ', resolved_at = NOW()';
    }

    if (status === 'closed') {
        sql += ', closed_at = NOW()';
    }

    sql += ' WHERE id = ?';
    params.push(id);

    // Get ticket details first
    db.query('SELECT * FROM support_tickets WHERE id = ?', [id], (err, ticketResults) => {
        if (err || ticketResults.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = ticketResults[0];

        db.query(sql, params, (updateErr, result) => {
            if (updateErr) {
                console.error('Error updating ticket:', updateErr);
                return res.status(500).json({ error: 'Failed to update ticket' });
            }

            // Notify ticket creator
            const statusMessages = {
                'in_progress': 'Your support ticket is now being worked on.',
                'resolved': `Your support ticket has been resolved. ${resolution || ''}`,
                'closed': 'Your support ticket has been closed.'
            };

            if (ticket.user_id && statusMessages[status]) {
                createPublicNotification(
                    ticket.user_id,
                    `Ticket ${ticket.ticket_number} ${status.replace('_', ' ').toUpperCase()}`,
                    statusMessages[status],
                    status === 'resolved' ? 'success' : 'info'
                );
            } else if (ticket.staff_id && statusMessages[status]) {
                createStaffNotification(
                    ticket.staff_id,
                    `Ticket ${ticket.ticket_number} ${status.replace('_', ' ').toUpperCase()}`,
                    statusMessages[status],
                    status === 'resolved' ? 'success' : 'info'
                );
            }

            // Notify assigned staff member if assignment changed
            if (assignedTo !== undefined && assignedTo !== ticket.assigned_to) {
                if (assignedTo) {
                    // New assignment
                    createStaffNotification(
                        assignedTo,
                        `Ticket Assigned: ${ticket.ticket_number}`,
                        `You have been assigned to support ticket: ${ticket.subject}`,
                        'info'
                    );
                }
                // If previously assigned, notify them of unassignment
                if (ticket.assigned_to && assignedTo !== ticket.assigned_to) {
                    createStaffNotification(
                        ticket.assigned_to,
                        `Ticket Unassigned: ${ticket.ticket_number}`,
                        `You have been unassigned from ticket: ${ticket.subject}`,
                        'info'
                    );
                }
            }

            res.json({ message: 'Ticket updated successfully' });
        });
    });
});

// Get ticket statistics (staff only)
app.get('/api/support/stats', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const sql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
            SUM(CASE WHEN category = 'affidavit' THEN 1 ELSE 0 END) as affidavit,
            SUM(CASE WHEN category = 'probate' THEN 1 ELSE 0 END) as probate,
            SUM(CASE WHEN category = 'payment' THEN 1 ELSE 0 END) as payment,
            SUM(CASE WHEN category = 'technical' THEN 1 ELSE 0 END) as technical,
            SUM(CASE WHEN category = 'other' THEN 1 ELSE 0 END) as other
        FROM support_tickets
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching stats:', err);
            return res.status(500).json({ error: 'Failed to fetch statistics' });
        }
        res.json(results[0]);
    });
});

// Get all staff members for assignment (admin only)
app.get('/api/support/staff-list', authenticateToken, (req, res) => {
    if (req.user.type !== 'staff' || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const sql = 'SELECT id, name, email, role FROM staff_users WHERE status = "active" ORDER BY name ASC';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching staff list:', err);
            return res.status(500).json({ error: 'Failed to fetch staff list' });
        }
        res.json(results);
    });
});

createInitialAdmin();
createInitialPublicUser();
createInitialBanners();

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Final fallback for debugging 404s
app.use((req, res) => {
    console.log(`[404 NOT FOUND] ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Route not found on server',
        requestedUrl: req.originalUrl,
        method: req.method
    });
});
