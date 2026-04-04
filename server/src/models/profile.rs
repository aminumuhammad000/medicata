use serde::Deserialize;
// Removing unused imports

#[derive(Debug, Deserialize)]
pub struct CreatePatientProfileRequest {
    pub dob: Option<chrono::NaiveDate>,
    pub gender: Option<String>,
    pub allergies: Option<String>,
    pub existing_conditions: Option<String>,
    pub short_bio: Option<String>,
    pub height_cm: Option<Option<i32>>,
    pub weight_kg: Option<Option<i32>>,
    pub body_type: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDoctorProfileRequest {
    pub license_number: String,
    pub specialties: Vec<String>,
    pub years_of_experience: Option<i32>,
    pub hospital_affiliation: Option<String>,
    pub short_bio: Option<String>,
    pub languages_spoken: Vec<String>,
    pub working_hours: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePharmacyProfileRequest {
    pub license_number: String,
    pub address: String,
    pub city: String,
    pub state: String,
    pub opening_hours: Option<serde_json::Value>,
}
