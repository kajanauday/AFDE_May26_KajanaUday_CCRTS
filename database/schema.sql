-- ============================================================
-- Customer Complaint & Resolution Tracking System (CCRTS)
-- Database Schema Script (SQLite compatible)
-- ============================================================

PRAGMA foreign_keys = ON;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default roles
INSERT OR IGNORE INTO roles (name) VALUES
    ('admin'),
    ('support_agent'),
    ('supervisor'),
    ('customer'),
    ('quality_team');

-- Users
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(30),
    role_id       INTEGER NOT NULL REFERENCES roles(id),
    is_active     BOOLEAN DEFAULT 1,
    created_at    DATETIME DEFAULT (datetime('now'))
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, description) VALUES
    ('Billing Issues',             'Issues related to invoices, charges, and payments'),
    ('Service Disruption',         'Outages or service unavailability'),
    ('Product Defects',            'Defective or damaged products'),
    ('Technical Problems',         'Software or hardware technical issues'),
    ('Delivery Delays',            'Late or missing deliveries'),
    ('Account Issues',             'Account access, credentials, or profile problems'),
    ('Customer Service Complaints','Complaints about support staff behaviour'),
    ('Other',                      'Miscellaneous complaints not listed above');

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_number  VARCHAR(30) UNIQUE NOT NULL,
    customer_id       INTEGER NOT NULL REFERENCES users(id),
    category_id       INTEGER REFERENCES categories(id),
    title             VARCHAR(255) NOT NULL,
    description       TEXT NOT NULL,
    priority          VARCHAR(20) DEFAULT 'medium',   -- low | medium | high | critical
    status            VARCHAR(40) DEFAULT 'open',     -- open | assigned | in_progress |
                                                      -- pending_customer_response | escalated |
                                                      -- resolved | closed
    assigned_agent_id INTEGER REFERENCES users(id),
    created_at        DATETIME DEFAULT (datetime('now')),
    updated_at        DATETIME DEFAULT (datetime('now')),
    resolved_at       DATETIME,
    sla_deadline      DATETIME   -- auto-calculated: critical=4h, high=24h, medium=48h, low=72h
);

-- Complaint History / Audit Trail
CREATE TABLE IF NOT EXISTS complaint_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id  INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    updated_by_id INTEGER NOT NULL REFERENCES users(id),
    old_status    VARCHAR(40),
    new_status    VARCHAR(40),
    comment       TEXT,
    updated_at    DATETIME DEFAULT (datetime('now'))
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    filename     VARCHAR(255) NOT NULL,
    file_path    VARCHAR(500) NOT NULL,
    uploaded_at  DATETIME DEFAULT (datetime('now'))
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER UNIQUE NOT NULL REFERENCES complaints(id),
    customer_id  INTEGER NOT NULL REFERENCES users(id),
    rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments     TEXT,
    submitted_at DATETIME DEFAULT (datetime('now'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    title      VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_customer    ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_agent       ON complaints(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status      ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority    ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_history_complaint      ON complaint_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread   ON notifications(user_id, is_read);
