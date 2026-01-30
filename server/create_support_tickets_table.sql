-- Support Tickets Table
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff_users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES staff_users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_status (status),
    INDEX idx_category (category)
);

-- Support Ticket Messages Table
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    sender_type ENUM('user', 'staff') NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    attachment_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id)
);
