-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'pharmacy', 'admin');

-- Consultation Modes Enum
CREATE TYPE consultation_mode AS ENUM ('chat', 'video', 'audio', 'in_person');

-- Consultation Status Enum
CREATE TYPE consultation_status AS ENUM ('pending', 'accepted', 'completed', 'cancelled');

-- Order Status Enum (From UserJourney.md)
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'picked_up', 'completed');

-- Users Table (From UserJourney.md - All user types in one table)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    whatsapp_number TEXT,
    role user_role NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Patient fields (From UserJourney.md Step 5 & 6)
    date_of_birth DATE,
    gender TEXT,
    allergies TEXT,
    existing_conditions TEXT,
    bio TEXT,
    height_cm INT,
    weight_kg INT,
    body_type TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    
    -- Doctor fields (From UserJourney.md Step 5 & 6)
    medical_license_number TEXT UNIQUE,
    specialty TEXT,
    years_of_experience INT,
    clinic_hospital_affiliation TEXT,
    profile_photo TEXT,
    languages_spoken TEXT,
    working_hours TEXT,
    clinic_hospital_address TEXT,
    
    -- Pharmacy fields (From UserJourney.md Step 1)
    pharmacy_name TEXT,
    pharmacy_address TEXT,
    pharmacy_license TEXT,
    pharmacy_contact_info TEXT,
    opening_hours TEXT
);

-- Drugs Database (From UserJourney.md - Drug Selection)
CREATE TABLE IF NOT EXISTS drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    strength TEXT
);

-- Appointments / Consultations Table (From UserJourney.md Consultation Flow)
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    mode consultation_mode NOT NULL,
    status consultation_status DEFAULT 'pending',
    reason TEXT NOT NULL,
    symptoms TEXT, -- From UserJourney.md: Reason for Consultation / Symptoms
    doctor_notes TEXT,
    cancellation_reason TEXT,
    files_reports TEXT, -- From UserJourney.md: Upload Files / Reports
    additional_notes TEXT, -- From UserJourney.md: Additional Notes / Requirements
    is_follow_up BOOLEAN DEFAULT FALSE, -- From UserJourney.md: Optionally flag follow-up consultations
    patient_rating INT CHECK (patient_rating >= 1 AND patient_rating <= 5), -- From UserJourney.md: Provide feedback / rating for doctor
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions Table (From UserJourney.md Prescription Workflow)
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    qr_code_token UUID DEFAULT uuid_generate_v4(), -- From UserJourney.md: Unique prescription ID / QR Code for verification
    expiry_date DATE NOT NULL, -- From UserJourney.md: Prescription Expiry Date
    is_verified BOOLEAN DEFAULT FALSE, -- From UserJourney.md: Verification status
    is_shared BOOLEAN DEFAULT FALSE, -- From UserJourney.md: Sharing functionality
    shared_with TEXT, -- From UserJourney.md: Share with other users
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescription Items Table (From UserJourney.md Prescription Form)
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drugs(id),
    dosage TEXT NOT NULL, -- From UserJourney.md: Dosage
    frequency TEXT NOT NULL, -- From UserJourney.md: Frequency
    duration_days INT NOT NULL, -- From UserJourney.md: Duration / Number of Days
    quantity INT NOT NULL, -- From UserJourney.md: Quantity
    instructions TEXT -- From UserJourney.md: Instructions / Notes
);

-- Pharmacy Orders Table (From UserJourney.md Pharmacy Interaction Flow)
CREATE TABLE IF NOT EXISTS pharmacy_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    pharmacy_id UUID NOT NULL REFERENCES users(id),
    prescription_id UUID REFERENCES prescriptions(id), -- From UserJourney.md: Prescription ID
    status order_status DEFAULT 'pending', -- From UserJourney.md: Status (Pending/Processing/Ready/Delivered/Picked Up)
    delivery_address TEXT, -- From UserJourney.md: Address
    contact_info TEXT, -- From UserJourney.md: Contact Info
    is_delivery BOOLEAN DEFAULT TRUE, -- From UserJourney.md: Delivery/Pickup
    preferred_time TIMESTAMPTZ, -- From UserJourney.md: Preferred Time
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items Table (Items within a pharmacy order)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES pharmacy_orders(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drugs(id),
    quantity INT NOT NULL DEFAULT 1,
    price BIGINT NOT NULL DEFAULT 0, -- Price per unit in kobo (Naira * 100)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback / Ratings Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    target_id UUID NOT NULL REFERENCES users(id), -- Doctor or Pharmacy
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table (From UserJourney.md Patient Journey Step 6)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    n_type TEXT NOT NULL, -- 'appointment', 'prescription', 'order', 'system' (From UserJourney.md: Appointment Reminders, Prescription Refill Reminders, Order Updates)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
