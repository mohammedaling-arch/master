const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSupportTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        console.log('Connected to database');

        // Create support_tickets table without foreign keys first
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_number VARCHAR(50) UNIQUE NOT NULL,
                user_id INT,
                staff_id INT,
                subject VARCHAR(255) NOT NULL,
                category ENUM('affidavit', 'probate', 'payment', 'technical', 'other') NOT NULL,
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
                description TEXT NOT NULL,
                resolution TEXT,
                assigned_to INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                closed_at TIMESTAMP NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_staff_id (staff_id),
                INDEX idx_status (status),
                INDEX idx_category (category)
            )
        `);
        console.log('✓ support_tickets table created');

        // Create support_ticket_messages table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS support_ticket_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                sender_type ENUM('user', 'staff') NOT NULL,
                sender_id INT NOT NULL,
                message TEXT NOT NULL,
                attachment_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ticket_id (ticket_id)
            )
        `);
        console.log('✓ support_ticket_messages table created');

        console.log('\n✅ All support ticket tables created successfully!');
        console.log('Note: Foreign key constraints omitted for compatibility');
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

createSupportTables();
