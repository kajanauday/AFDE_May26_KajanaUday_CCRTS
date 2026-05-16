-- ============================================================
-- CCRTS Sample / Seed Data
-- Run this after schema.sql
-- Note: password_hash below is bcrypt for "admin123"
-- ============================================================

-- Seed users (password: admin123 for all)
INSERT OR IGNORE INTO users (name, email, password_hash, phone, role_id) VALUES
    ('System Admin',       'admin@ccrts.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTRJpqFEQXjNpTJO3bLJzMVN4K', '+1-000-000-0001', 1),
    ('Alice Support',      'alice@ccrts.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTRJpqFEQXjNpTJO3bLJzMVN4K', '+1-000-000-0002', 2),
    ('Bob Support',        'bob@ccrts.com',       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTRJpqFEQXjNpTJO3bLJzMVN4K', '+1-000-000-0003', 2),
    ('Carol Supervisor',   'carol@ccrts.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTRJpqFEQXjNpTJO3bLJzMVN4K', '+1-000-000-0004', 3),
    ('David Customer',     'david@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTRJpqFEQXjNpTJO3bLJzMVN4K', '+1-000-000-0005', 4),
    ('Eve Quality',        'eve@ccrts.com',       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTRJpqFEQXjNpTJO3bLJzMVN4K', '+1-000-000-0006', 5);

-- Sample complaints
INSERT OR IGNORE INTO complaints (complaint_number, customer_id, category_id, title, description, priority, status, assigned_agent_id, sla_deadline) VALUES
    ('CCRTS-20260515-0001', 5, 1, 'Incorrect billing charge on my account',
     'I was charged twice for my monthly subscription in April. The duplicate charge of $49.99 needs to be refunded immediately.',
     'high', 'in_progress', 2, datetime('now', '+24 hours')),

    ('CCRTS-20260515-0002', 5, 2, 'Service outage since yesterday morning',
     'The service has been completely unavailable since yesterday at 9 AM. My entire team is affected and we cannot perform our work.',
     'critical', 'escalated', 3, datetime('now', '+4 hours')),

    ('CCRTS-20260515-0003', 5, 4, 'Cannot login after password reset',
     'After requesting a password reset, I received the email and set a new password. However, logging in with the new password fails with an authentication error.',
     'medium', 'open', NULL, datetime('now', '+48 hours')),

    ('CCRTS-20260515-0004', 5, 5, 'Delivery delayed by 10 days',
     'Order #ORD-2026-5523 was supposed to arrive on May 5th but has not been delivered. No update from logistics team.',
     'low', 'resolved', 2, datetime('now', '+72 hours')),

    ('CCRTS-20260515-0005', 5, 6, 'Account locked after failed login attempts',
     'My account got locked after 3 failed attempts. The unlock email is not arriving in my inbox or spam folder.',
     'high', 'assigned', 3, datetime('now', '+24 hours'));

-- Sample history
INSERT OR IGNORE INTO complaint_history (complaint_id, updated_by_id, old_status, new_status, comment) VALUES
    (1, 1, 'open',        'assigned',    'Assigned to Alice for investigation.'),
    (1, 2, 'assigned',    'in_progress', 'Billing records being reviewed.'),
    (2, 1, 'open',        'assigned',    'Assigned to Bob - critical priority.'),
    (2, 4, 'assigned',    'escalated',   'Escalated: service down > 12 hours, SLA breach imminent.'),
    (4, 2, 'in_progress', 'resolved',    'Logistics confirmed delivery. Marked resolved.');

-- Sample feedback
INSERT OR IGNORE INTO feedback (complaint_id, customer_id, rating, comments) VALUES
    (4, 5, 4, 'Issue was resolved, but took longer than expected. Agent was polite.');
