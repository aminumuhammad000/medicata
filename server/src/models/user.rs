use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Patient,
    Doctor,
    Pharmacy,
    Admin,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub phone_number: String,
    pub whatsapp_number: Option<String>,
    pub role: UserRole,
    pub is_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    // Patient fields (from UserJourney.md Step 5 & 6)
    pub date_of_birth: Option<NaiveDate>,
    pub gender: Option<String>,
    pub allergies: Option<String>,
    pub existing_conditions: Option<String>,
    pub bio: Option<String>,
    #[sqlx(rename = "height_cm")]
    pub height: Option<f32>,
    #[sqlx(rename = "weight_kg")]
    pub weight: Option<f32>,
    pub body_type: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    
    // Doctor fields (from UserJourney.md Step 5 & 6)
    pub medical_license_number: Option<String>,
    pub specialty: Option<String>,
    pub years_of_experience: Option<i32>,
    pub clinic_hospital_affiliation: Option<String>,
    pub profile_photo: Option<String>,
    pub languages_spoken: Option<String>,
    pub working_hours: Option<String>,
    pub clinic_hospital_address: Option<String>,
    
    // Pharmacy fields (from UserJourney.md Step 1)
    pub pharmacy_name: Option<String>,
    pub pharmacy_address: Option<String>,
    pub pharmacy_license: Option<String>,
    pub pharmacy_contact_info: Option<String>,
    pub opening_hours: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub full_name: String,
    pub email: String,
    pub password: String,
    pub phone_number: String,
    pub whatsapp_number: Option<String>,
    pub role: UserRole,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

// Patient specific requests (from UserJourney.md)
#[derive(Debug, Deserialize)]
pub struct PatientHealthInfoRequest {
    pub date_of_birth: Option<NaiveDate>,
    pub gender: Option<String>,
    pub allergies: Option<String>,
    pub existing_conditions: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PatientProfileRequest {
    pub bio: Option<String>,
    pub height: Option<f32>,
    pub weight: Option<f32>,
    pub body_type: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
}

// Doctor specific requests (from UserJourney.md)
#[derive(Debug, Deserialize)]
pub struct DoctorProfessionalInfoRequest {
    pub medical_license_number: String,
    pub specialty: String,
    pub years_of_experience: Option<i32>,
    pub clinic_hospital_affiliation: Option<String>,
    pub profile_photo: Option<String>,
    pub clinic_hospital_address: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DoctorBioRequest {
    pub bio: Option<String>,
    pub languages_spoken: Option<String>,
    pub working_hours: Option<String>,
}

// Pharmacy specific requests (from UserJourney.md)
#[derive(Debug, Deserialize)]
pub struct PharmacyInfoRequest {
    pub pharmacy_name: String,
    pub pharmacy_address: String,
    pub pharmacy_license: String,
    pub pharmacy_contact_info: String,
    pub opening_hours: String,
}
