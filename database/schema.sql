-- Blood Suite Database Schema
-- Smart Blood Bank and Donor Management System for Lesotho

-- Users table - Authentication and base user information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('donor', 'hospital', 'admin', 'blood_bank')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donors table - Donor-specific information and profiles
CREATE TABLE IF NOT EXISTS donors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    weight DECIMAL(5,2),
    address TEXT,
    district VARCHAR(100),
    last_donation_date DATE,
    total_donations INTEGER DEFAULT 0,
    is_eligible BOOLEAN DEFAULT true,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table - Hospital information and locations
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Inventory table - Blood unit tracking and expiry management
CREATE TABLE IF NOT EXISTS blood_inventory (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
    blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    unit_number VARCHAR(100) UNIQUE NOT NULL,
    donation_id INTEGER,
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    volume_ml INTEGER DEFAULT 450,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used', 'expired', 'discarded')),
    storage_location VARCHAR(100),
    temperature_log JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Requests table - Blood request management
CREATE TABLE IF NOT EXISTS blood_requests (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
    blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    units_needed INTEGER NOT NULL,
    units_fulfilled INTEGER DEFAULT 0,
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
    patient_name VARCHAR(200),
    patient_condition TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'cancelled', 'expired')),
    requested_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP
);

-- Donations table - Donation history and records
CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER REFERENCES donors(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES hospitals(id),
    donation_date DATE NOT NULL,
    blood_type VARCHAR(5) NOT NULL,
    volume_ml INTEGER DEFAULT 450,
    hemoglobin_level DECIMAL(4,2),
    blood_pressure VARCHAR(20),
    pulse INTEGER,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'deferred')),
    notes TEXT,
    next_eligible_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table - Alert and notification system
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('urgent_request', 'donation_reminder', 'appointment', 'stock_alert', 'general')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    related_request_id INTEGER REFERENCES blood_requests(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donation Appointments table
CREATE TABLE IF NOT EXISTS donation_appointments (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER REFERENCES donors(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Stock Summary View (for analytics)
CREATE OR REPLACE VIEW blood_stock_summary AS
SELECT 
    h.id as hospital_id,
    h.name as hospital_name,
    bi.blood_type,
    COUNT(CASE WHEN bi.status = 'available' THEN 1 END) as available_units,
    COUNT(CASE WHEN bi.status = 'reserved' THEN 1 END) as reserved_units,
    COUNT(CASE WHEN bi.expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND bi.status = 'available' THEN 1 END) as expiring_soon
FROM hospitals h
LEFT JOIN blood_inventory bi ON h.id = bi.hospital_id
GROUP BY h.id, h.name, bi.blood_type;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type);
CREATE INDEX IF NOT EXISTS idx_donors_district ON donors(district);
CREATE INDEX IF NOT EXISTS idx_inventory_blood_type ON blood_inventory(blood_type);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON blood_inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON blood_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_urgency ON blood_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
