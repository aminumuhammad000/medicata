-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'pharmacy', 'admin');

-- Consultation Modes Enum
CREATE TYPE consultation_mode AS ENUM ('chat', 'video', 'audio', 'in_person');

-- Consultation Status Enum
CREATE TYPE consultation_status AS ENUM ('pending', 'accepted', 'completed', 'cancelled');

-- Order Status Enum
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed');

-- Users Table
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Profiles Table
CREATE TABLE IF NOT EXISTS patient_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    dob DATE,
    gender TEXT,
    allergies TEXT,
    existing_conditions TEXT,
    short_bio TEXT,
    height_cm INT,
    weight_kg INT,
    body_type TEXT,
    address TEXT,
    city TEXT,
    state TEXT
);

-- Doctor Profiles Table
CREATE TABLE IF NOT EXISTS doctor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    license_number TEXT UNIQUE NOT NULL,
    specialties TEXT[] NOT NULL,
    years_of_experience INT,
    hospital_affiliation TEXT,
    short_bio TEXT,
    languages_spoken TEXT[],
    working_hours JSONB, -- Schedule configuration
    consultation_modes_offered consultation_mode[] DEFAULT '{chat, video, audio, in_person}',
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INT DEFAULT 0,
    is_license_verified BOOLEAN DEFAULT FALSE
);

-- Pharmacy Profiles Table
CREATE TABLE IF NOT EXISTS pharmacy_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    license_number TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    opening_hours JSONB,
    rating DECIMAL(3, 2) DEFAULT 0
);

-- Drugs Database (Simplified for MVP)
CREATE TABLE IF NOT EXISTS drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    strength TEXT
);

-- Appointments / Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    mode consultation_mode NOT NULL,
    status consultation_status DEFAULT 'pending',
    reason TEXT NOT NULL,
    doctor_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    qr_code_token UUID DEFAULT uuid_generate_v4(),
    expiry_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescription Items Table
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drugs(id),
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration_days INT NOT NULL,
    quantity INT NOT NULL,
    instructions TEXT
);

-- Pharmacy Orders Table
CREATE TABLE IF NOT EXISTS pharmacy_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    pharmacy_id UUID NOT NULL REFERENCES users(id),
    prescription_id UUID REFERENCES prescriptions(id),
    status order_status DEFAULT 'pending',
    delivery_address TEXT,
    is_delivery BOOLEAN DEFAULT TRUE,
    preferred_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    n_type TEXT NOT NULL, -- 'appointment', 'prescription', 'order', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
