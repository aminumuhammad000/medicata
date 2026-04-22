use axum::{
    extract::{State, Query},
    Json,
};
use serde::Deserialize;
use crate::{
    error::AppError,
    models::{
        user::{User, UserRole},
        profile::{CreatePatientProfileRequest, CreateDoctorProfileRequest, CreatePharmacyProfileRequest},
        doctor::DoctorSearchQuery,
    },
    state::AppState,
    auth_utils::Claims,
};

pub async fn get_me(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<Claims>,
) -> Result<Json<User>, AppError> {
    tracing::debug!("Fetching profile for user ID: {}", claims.user_id);
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(claims.user_id)
        .fetch_optional(&state.db)
        .await?;

    match user {
        Some(u) => Ok(Json(u)),
        None => {
            tracing::error!("Profile not found in database for user ID: {}", claims.user_id);
            Err(AppError::NotFound("User not found".to_string()))
        }
    }
}

pub async fn create_patient_profile(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<Claims>,
    Json(payload): Json<CreatePatientProfileRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Patient {
        return Err(AppError::Forbidden("Only patients can create a patient profile".to_string()));
    }

    sqlx::query(
        "UPDATE users SET 
            date_of_birth = $2,
            gender = $3,
            allergies = $4,
            existing_conditions = $5,
            bio = $6,
            height_cm = $7,
            weight_kg = $8,
            body_type = $9,
            address = $10,
            city = $11,
            state = $12,
            updated_at = NOW()
         WHERE id = $1"
    )
    .bind(claims.sub)
    .bind(payload.dob)
    .bind(payload.gender)
    .bind(payload.allergies)
    .bind(payload.existing_conditions)
    .bind(payload.short_bio)
    .bind(payload.height_cm.unwrap_or(None))
    .bind(payload.weight_kg.unwrap_or(None))
    .bind(payload.body_type)
    .bind(payload.address)
    .bind(payload.city)
    .bind(payload.state)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "status": "success" })))
}

pub async fn create_doctor_profile(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<Claims>,
    Json(payload): Json<CreateDoctorProfileRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can create a doctor profile".to_string()));
    }

    // Join specialties and languages into strings if they are arrays in the payload
    let specialties_str = payload.specialties.join(", ");
    let languages_str = payload.languages_spoken.join(", ");
    let working_hours_str = payload.working_hours.map(|v| v.to_string());

    sqlx::query(
        "UPDATE users SET 
            medical_license_number = $2,
            specialty = $3,
            years_of_experience = $4,
            clinic_hospital_affiliation = $5,
            bio = $6,
            languages_spoken = $7,
            working_hours = $8,
            updated_at = NOW()
         WHERE id = $1"
    )
    .bind(claims.sub)
    .bind(payload.license_number)
    .bind(specialties_str)
    .bind(payload.years_of_experience)
    .bind(payload.hospital_affiliation)
    .bind(payload.short_bio)
    .bind(languages_str)
    .bind(working_hours_str)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "status": "success" })))
}

pub async fn create_pharmacy_profile(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<Claims>,
    Json(payload): Json<CreatePharmacyProfileRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Pharmacy {
        return Err(AppError::Forbidden("Only pharmacies can create a pharmacy profile".to_string()));
    }

    let opening_hours_str = payload.opening_hours.map(|v| v.to_string());

    sqlx::query(
        "UPDATE users SET 
            pharmacy_license = $2,
            pharmacy_address = $3,
            city = $4,
            state = $5,
            opening_hours = $6,
            updated_at = NOW()
         WHERE id = $1"
    )
    .bind(claims.sub)
    .bind(payload.license_number)
    .bind(payload.address)
    .bind(payload.city)
    .bind(payload.state)
    .bind(opening_hours_str)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "status": "success" })))
}

#[allow(dead_code)]
pub async fn search_doctors(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<DoctorSearchQuery>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let specialty = params.specialty.unwrap_or_default();
    let _min_rating = params.min_rating.unwrap_or(0.0);

    // Using the flattened users table
    let doctors = sqlx::query(
        "SELECT id, full_name, specialty, clinic_hospital_affiliation 
         FROM users 
         WHERE role = 'doctor' 
         AND ($1 = '' OR specialty ILIKE $2)"
    )
    .bind(&specialty)
    .bind(format!("%{}%", specialty))
    .fetch_all(&state.db)
    .await?;

    let result = doctors.into_iter().map(|d| {
        use sqlx::Row;
        serde_json::json!({
            "id": d.get::<uuid::Uuid, _>("id"),
            "full_name": d.get::<String, _>("full_name"),
            "specialty": d.get::<Option<String>, _>("specialty"),
            "hospital_affiliation": d.get::<Option<String>, _>("clinic_hospital_affiliation"),
            "rating": 5.0, // Placeholder as schema doesn't have rating column yet
            "review_count": 0,
        })
    }).collect();

    Ok(Json(result))
}

#[derive(Debug, Deserialize)]
pub struct PharmacySearchQuery {
    pub location: Option<String>,
}

pub async fn search_pharmacies(
    State(state): State<AppState>,
    Query(params): Query<PharmacySearchQuery>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let location = params.location.unwrap_or_default();

    let pharmacies = sqlx::query(
        "SELECT id, full_name, pharmacy_address, phone_number, is_verified 
         FROM users 
         WHERE role = 'pharmacy' 
         AND ($1 = '' OR pharmacy_address ILIKE $2 OR city ILIKE $2 OR state ILIKE $2)"
    )
    .bind(&location)
    .bind(format!("%{}%", location))
    .fetch_all(&state.db)
    .await?;

    let result = pharmacies.into_iter().map(|p| {
        use sqlx::Row;
        serde_json::json!({
            "id": p.get::<uuid::Uuid, _>("id"),
            "full_name": p.get::<String, _>("full_name"),
            "address": p.get::<Option<String>, _>("pharmacy_address"),
            "phone": p.get::<Option<String>, _>("phone_number"),
            "is_verified": p.get::<Option<bool>, _>("is_verified").unwrap_or(false),
        })
    }).collect();

    Ok(Json(result))
}

pub async fn get_doctor_profile(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let doctor = sqlx::query(
        "SELECT id, full_name, role, specialty, clinic_hospital_affiliation, bio, languages_spoken, years_of_experience, profile_photo_url
         FROM users 
         WHERE id = $1 AND role = 'doctor'"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?;

    if let Some(d) = doctor {
        use sqlx::Row;
        Ok(Json(serde_json::json!({
            "id": d.get::<uuid::Uuid, _>("id"),
            "full_name": d.get::<String, _>("full_name"),
            "role": d.get::<String, _>("role"),
            "specialty": d.get::<Option<String>, _>("specialty"),
            "hospital_affiliation": d.get::<Option<String>, _>("clinic_hospital_affiliation"),
            "bio": d.get::<Option<String>, _>("bio"),
            "languages_spoken": d.get::<Option<String>, _>("languages_spoken"),
            "years_of_experience": d.get::<Option<i32>, _>("years_of_experience"),
            "profile_photo_url": d.get::<Option<String>, _>("profile_photo_url"),
            "rating": 5.0, // Placeholder
            "review_count": 0,
        })))
    } else {
        Err(AppError::NotFound("Doctor not found".to_string()))
    }
}

pub async fn get_pharmacy_profile(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let pharmacy = sqlx::query(
        "SELECT id, full_name, role, pharmacy_address, pharmacy_license, pharmacy_contact_info, opening_hours, city, state, profile_photo, phone_number, is_verified 
         FROM users 
         WHERE id = $1 AND role = 'pharmacy'"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?;

    if let Some(p) = pharmacy {
        use sqlx::Row;
        Ok(Json(serde_json::json!({
            "id": p.get::<uuid::Uuid, _>("id"),
            "full_name": p.get::<String, _>("full_name"),
            "role": p.get::<String, _>("role"),
            "address": p.get::<Option<String>, _>("pharmacy_address"),
            "license": p.get::<Option<String>, _>("pharmacy_license"),
            "contact_info": p.get::<Option<String>, _>("pharmacy_contact_info"),
            "opening_hours": p.get::<Option<String>, _>("opening_hours"),
            "city": p.get::<Option<String>, _>("city"),
            "state": p.get::<Option<String>, _>("state"),
            "profile_photo_url": p.get::<Option<String>, _>("profile_photo"),
            "phone": p.get::<String, _>("phone_number"),
            "is_verified": p.get::<bool, _>("is_verified"),
        })))
    } else {
        Err(AppError::NotFound("Pharmacy not found".to_string()))
    }
}
