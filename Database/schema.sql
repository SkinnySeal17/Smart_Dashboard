CREATE DATABASE IF NOT EXISTS smart_dashboard;

USE smart_dashboard;

-- =========================
-- Users
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- User Settings
-- =========================

CREATE TABLE IF NOT EXISTS user_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    theme VARCHAR(20) NOT NULL DEFAULT 'light',
    currency VARCHAR(10) NOT NULL DEFAULT 'AUD',
    default_status VARCHAR(20) NOT NULL DEFAULT 'active',
    date_format VARCHAR(30) NOT NULL DEFAULT 'DD/MM/YYYY',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- Categories
-- Requires MySQL 8.0.16+ for enforced CHECK constraints.
-- =========================

CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,
    color CHAR(7) NOT NULL DEFAULT '#8b8b8b',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_categories_user_name (user_id, name),
    UNIQUE KEY uq_categories_user_id (user_id, id),
    CONSTRAINT chk_categories_name
        CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 40),
    CONSTRAINT chk_categories_color
        CHECK (color REGEXP '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Services
-- =========================

CREATE TABLE IF NOT EXISTS services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(80) NOT NULL,
    cost DECIMAL(9, 2) NOT NULL,
    billing_cycle VARCHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    renewal_date DATE NOT NULL,
    status VARCHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'active',
    notes VARCHAR(500) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_services_user_category (user_id, category_id),
    KEY idx_services_user_status_renewal (user_id, status, renewal_date),
    KEY idx_services_user_name (user_id, name),
    CONSTRAINT chk_services_name
        CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80),
    CONSTRAINT chk_services_cost
        CHECK (cost > 0 AND cost <= 1000000),
    CONSTRAINT chk_services_billing_cycle
        CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'one_time')),
    CONSTRAINT chk_services_status
        CHECK (status IN ('active', 'inactive')),
    CONSTRAINT fk_services_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    -- A category must belong to the same owner as the service.
    -- RESTRICT also prevents deleting any category that is in use.
    CONSTRAINT fk_services_owner_category
        FOREIGN KEY (user_id, category_id) REFERENCES categories(user_id, id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
