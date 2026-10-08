-- =========================================================
-- ACXIOMCRM DATABASE SCHEMA
-- Relational, normalized schema with foreign keys, constraints, and indexes
-- =========================================================

CREATE DATABASE IF NOT EXISTS acxiomcrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE acxiomcrm;

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(25) NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    failed_login_attempts INT DEFAULT 0,
    lock_until DATETIME NULL,
    last_login_at DATETIME NULL,
    department VARCHAR(100) DEFAULT 'Sales',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role_id),
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL UNIQUE,
    company_name VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    user_id INT NULL,
    created_by INT NULL,
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_customers_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_customers_assigned FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_customers_code (customer_code),
    INDEX idx_customers_email (email),
    INDEX idx_customers_phone (phone),
    INDEX idx_customers_assigned (assigned_to),
    INDEX idx_customers_status (status)
) ENGINE=InnoDB;

-- 4. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
    lead_id INT AUTO_INCREMENT PRIMARY KEY,
    lead_code VARCHAR(50) NOT NULL UNIQUE,
    lead_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    company_name VARCHAR(150),
    source VARCHAR(100) DEFAULT 'Website',
    status ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST') DEFAULT 'NEW',
    priority ENUM('HOT', 'WARM', 'COLD') DEFAULT 'WARM',
    expected_value DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT,
    converted_customer_id INT NULL,
    converted_opportunity_id INT NULL,
    created_by INT NULL,
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leads_conv_customer FOREIGN KEY (converted_customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
    CONSTRAINT fk_leads_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_leads_assigned FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_leads_code (lead_code),
    INDEX idx_leads_status (status),
    INDEX idx_leads_priority (priority),
    INDEX idx_leads_assigned (assigned_to)
) ENGINE=InnoDB;

-- 5. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS opportunities (
    opportunity_id INT AUTO_INCREMENT PRIMARY KEY,
    opportunity_code VARCHAR(50) NOT NULL UNIQUE,
    opportunity_name VARCHAR(150) NOT NULL,
    customer_id INT NOT NULL,
    lead_id INT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    stage ENUM('QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST') DEFAULT 'QUALIFICATION',
    probability INT NOT NULL DEFAULT 20,
    expected_close_date DATE NOT NULL,
    status ENUM('OPEN', 'WON', 'LOST') DEFAULT 'OPEN',
    notes TEXT,
    created_by INT NULL,
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_opp_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_lead FOREIGN KEY (lead_id) REFERENCES leads(lead_id) ON DELETE SET NULL,
    CONSTRAINT fk_opp_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_opp_assigned FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_opp_code (opportunity_code),
    INDEX idx_opp_customer (customer_id),
    INDEX idx_opp_stage (stage),
    INDEX idx_opp_status (status),
    INDEX idx_opp_assigned (assigned_to)
) ENGINE=InnoDB;

-- 6. FOLLOW-UPS TABLE
CREATE TABLE IF NOT EXISTS followups (
    followup_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NULL,
    lead_id INT NULL,
    opportunity_id INT NULL,
    followup_date DATETIME NOT NULL,
    followup_type ENUM('CALL', 'MEETING', 'EMAIL', 'DEMO') DEFAULT 'CALL',
    remarks TEXT,
    status ENUM('PLANNED', 'COMPLETED', 'MISSED', 'CANCELLED') DEFAULT 'PLANNED',
    created_by INT NULL,
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fu_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_fu_lead FOREIGN KEY (lead_id) REFERENCES leads(lead_id) ON DELETE CASCADE,
    CONSTRAINT fk_fu_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE SET NULL,
    CONSTRAINT fk_fu_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_fu_assigned FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_fu_date (followup_date),
    INDEX idx_fu_status (status),
    INDEX idx_fu_assigned (assigned_to)
) ENGINE=InnoDB;

-- 7. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type ENUM('CALL', 'MEETING', 'EMAIL', 'TASK') NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    activity_date DATETIME NOT NULL,
    customer_id INT NULL,
    lead_id INT NULL,
    opportunity_id INT NULL,
    status ENUM('PLANNED', 'COMPLETED', 'CANCELLED') DEFAULT 'COMPLETED',
    created_by INT NULL,
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_act_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_act_lead FOREIGN KEY (lead_id) REFERENCES leads(lead_id) ON DELETE CASCADE,
    CONSTRAINT fk_act_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE SET NULL,
    CONSTRAINT fk_act_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_act_assigned FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_act_type (activity_type),
    INDEX idx_act_date (activity_date),
    INDEX idx_act_assigned (assigned_to)
) ENGINE=InnoDB;

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100) NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(50) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_name),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- 9. CUSTOMER REQUESTS TABLE (Customer Portal Interaction)
CREATE TABLE IF NOT EXISTS customer_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    user_id INT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    assigned_to INT NULL,
    response TEXT NULL,
    responded_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_cr_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_cr_assigned FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_cr_status (status),
    INDEX idx_cr_customer (customer_id)
) ENGINE=InnoDB;

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('INFO', 'WARNING', 'SUCCESS', 'ALERT') DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- 11. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_group VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
