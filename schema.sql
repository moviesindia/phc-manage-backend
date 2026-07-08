-- =====================================================
-- PHC Management System Database Schema
-- File: schema.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS phc_db;
USE phc_db;

-- =====================================================
-- Footfall Table
-- =====================================================
CREATE TABLE IF NOT EXISTS footfall (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    symptoms TEXT,
    visit_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Inventory Table
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(100) NOT NULL,
    stock_quantity INT NOT NULL,
    expiry_date DATE NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- Attendance Table
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_name VARCHAR(100) DEFAULT 'Dr. Smith',
    check_in_time DATETIME NOT NULL,
    check_out_time DATETIME,
    status ENUM('Present', 'Absent') DEFAULT 'Present',
    date DATE NOT NULL
);

-- =====================================================
-- Medicine Dispenses Table
-- =====================================================
CREATE TABLE IF NOT EXISTS medicine_dispenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    dispensed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id)
        REFERENCES inventory(id)
        ON DELETE CASCADE
);

-- =====================================================
-- Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Doctor', 'Staff') NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- =====================================================
-- Shift Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_settings (
    id INT PRIMARY KEY DEFAULT 1,
    shift_start VARCHAR(10) DEFAULT '09:00',
    shift_end VARCHAR(10) DEFAULT '17:00'
);

-- =====================================================
-- Default Shift Settings
-- =====================================================
INSERT IGNORE INTO shift_settings (id, shift_start, shift_end)
VALUES (1, '09:00', '17:00');

-- =====================================================
-- Dummy Inventory Data
-- =====================================================
INSERT INTO inventory (medicine_name, stock_quantity, expiry_date)
VALUES
('Paracetamol 500mg', 1200, '2027-12-31'),
('Amoxicillin 250mg', 45, '2026-08-15'),
('Ibuprofen 400mg', 300, '2026-09-01');

-- =====================================================
-- Dummy Medicine Dispense Data
-- =====================================================
INSERT INTO medicine_dispenses (medicine_id, quantity, dispensed_at)
VALUES
(1, 10, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 15, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 20, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 5, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 8, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- =====================================================
-- Dummy Attendance Data
-- =====================================================
INSERT INTO attendance
(doctor_name, check_in_time, check_out_time, status, date)
VALUES
('Dr. Smith',
 CONCAT(CURDATE() - INTERVAL 6 DAY, ' 09:05:00'),
 CONCAT(CURDATE() - INTERVAL 6 DAY, ' 17:00:00'),
 'Present',
 CURDATE() - INTERVAL 6 DAY),

('Dr. Smith',
 CONCAT(CURDATE() - INTERVAL 5 DAY, ' 08:55:00'),
 CONCAT(CURDATE() - INTERVAL 5 DAY, ' 17:10:00'),
 'Present',
 CURDATE() - INTERVAL 5 DAY),

('Dr. Smith',
 CONCAT(CURDATE() - INTERVAL 4 DAY, ' 09:10:00'),
 CONCAT(CURDATE() - INTERVAL 4 DAY, ' 17:05:00'),
 'Present',
 CURDATE() - INTERVAL 4 DAY),

('Dr. Smith',
 CONCAT(CURDATE() - INTERVAL 3 DAY, ' 11:30:00'),
 CONCAT(CURDATE() - INTERVAL 3 DAY, ' 18:00:00'),
 'Present',
 CURDATE() - INTERVAL 3 DAY),

('Dr. Smith',
 CONCAT(CURDATE() - INTERVAL 1 DAY, ' 09:02:00'),
 NULL,
 'Present',
 CURDATE() - INTERVAL 1 DAY);

-- =====================================================
-- Default Users
-- =====================================================
INSERT INTO users (username, password, role, name)
VALUES
('admin', 'admin123', 'Admin', 'System Admin'),
('doctor', 'doctor123', 'Doctor', 'Dr. Smith'),
('staff', 'staff123', 'Staff', 'Pharmacist Jane');