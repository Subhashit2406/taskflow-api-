-- ============================================================================
-- TaskFlow API - Seed Data
-- ============================================================================

-- Clean existing data (CASCADE)
TRUNCATE TABLE tasks, projects, users RESTART IDENTITY CASCADE;

-- Insert Seed Users
-- Passwords are hashed with bcrypt (cost=10): 'Password123!' -> $2a$10$f6B0rOa7M24oX74V3O8KTu5c9Fj0L4kFqmXgH1v7N...
INSERT INTO users (id, email, password_hash, name, role)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin@taskflow.dev', '$2a$10$w8u73j7Vsqz3n3qB2c4ePe5cZ3xV1gZtQkXN1kL4bYw6Z.qH2uFmy', 'Admin User', 'admin'),
    ('a0000000-0000-0000-0000-000000000002', 'developer@taskflow.dev', '$2a$10$w8u73j7Vsqz3n3qB2c4ePe5cZ3xV1gZtQkXN1kL4bYw6Z.qH2uFmy', 'Subhashit Pathak', 'user'),
    ('a0000000-0000-0000-0000-000000000003', 'sarah.manager@taskflow.dev', '$2a$10$w8u73j7Vsqz3n3qB2c4ePe5cZ3xV1gZtQkXN1kL4bYw6Z.qH2uFmy', 'Sarah Jenkins', 'manager');

-- Insert Seed Projects
INSERT INTO projects (id, name, description, status, user_id, created_at)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'TaskFlow API Platform',
        'Core RESTful API backend engine built with Express and PostgreSQL.',
        'ACTIVE',
        'a0000000-0000-0000-0000-000000000002',
        CURRENT_TIMESTAMP - INTERVAL '10 days'
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'Mobile App Companion',
        'React Native mobile application for on-the-go task execution and push notifications.',
        'ACTIVE',
        'a0000000-0000-0000-0000-000000000002',
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'Legacy Migration Phase 1',
        'Migration of legacy MySQL monolith tables to PostgreSQL schema with zero downtime.',
        'COMPLETED',
        'a0000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '30 days'
    );

-- Insert Seed Tasks
INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, created_at)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'Design PostgreSQL Relational Schema',
        'Define projects, tasks, and users schema with optimal foreign keys and composite indexes.',
        'DONE',
        'HIGH',
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '9 days'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000001',
        'Implement Centralized Error Handling Middleware',
        'Standardize JSON error envelope and capture PostgreSQL constraints.',
        'DONE',
        'HIGH',
        CURRENT_TIMESTAMP - INTERVAL '1 days',
        CURRENT_TIMESTAMP - INTERVAL '8 days'
    ),
    (
        'c0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000001',
        'Add In-Memory Caching & Query Optimization',
        'Add caching for high-hit GET endpoints with automatic invalidation on task mutations.',
        'IN_PROGRESS',
        'URGENT',
        CURRENT_TIMESTAMP + INTERVAL '3 days',
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        'c0000000-0000-0000-0000-000000000004',
        'b0000000-0000-0000-0000-000000000001',
        'Setup GitHub Actions CI/CD Pipeline',
        'Automate test runs with PostgreSQL container and Docker image builds.',
        'TODO',
        'MEDIUM',
        CURRENT_TIMESTAMP + INTERVAL '5 days',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        'c0000000-0000-0000-0000-000000000005',
        'b0000000-0000-0000-0000-000000000002',
        'Setup React Native Navigation and Offline Storage',
        'Configure WatermelonDB and React Navigation v6.',
        'IN_PROGRESS',
        'HIGH',
        CURRENT_TIMESTAMP + INTERVAL '7 days',
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        'c0000000-0000-0000-0000-000000000006',
        'b0000000-0000-0000-0000-000000000002',
        'Implement Push Notification Service with FCM',
        'Integrate Firebase Cloud Messaging for urgent task deadline reminders.',
        'TODO',
        'LOW',
        CURRENT_TIMESTAMP + INTERVAL '14 days',
        CURRENT_TIMESTAMP - INTERVAL '1 days'
    );
