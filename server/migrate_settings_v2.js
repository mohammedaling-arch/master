const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    console.log('Ensuring unique constraint on setting_key...');
    try {
        await connection.execute('ALTER TABLE system_settings ADD UNIQUE (setting_key)');
    } catch (err) {
        // Ignore if already exists
    }

    const settings = [
        ['captcha_enabled', '0'],
        ['captcha_site_key', ''],
        ['captcha_secret_key', ''],
        ['paystack_enabled', '0'],
        ['paystack_public_key', ''],
        ['paystack_secret_key', ''],
        ['remita_enabled', '0'],
        ['remita_merchant_id', ''],
        ['remita_service_type_id', ''],
        ['remita_api_key', ''],
        ['maintenance_mode', '0'],
        ['allow_new_registrations', '1'],
        ['notification_email', 'admin@crms.com'],
        ['backup_frequency', 'daily']
    ];

    for (const [key, value] of settings) {
        await connection.execute(
            'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_key = setting_key',
            [key, value]
        );
    }

    console.log('Settings migration completed.');
    await connection.end();
}

migrate().catch(console.error);
