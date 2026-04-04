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
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(claims.sub)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(user))
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
        "INSERT INTO patient_profiles (user_id, dob, gender, allergies, existing_conditions, short_bio, height_cm, weight_kg, body_type, address, city, state) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (user_id) DO UPDATE SET
            dob = EXCLUDED.dob,
            gender = EXCLUDED.gender,
            allergies = EXCLUDED.allergies,
            existing_conditions = EXCLUDED.existing_conditions,
            short_bio = EXCLUDED.short_bio,
            height_cm = EXCLUDED.height_cm,
            weight_kg = EXCLUDED.weight_kg,
            body_type = EXCLUDED.body_type,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            state = EXCLUDED.state"
    )
    .bind(claims.sub)
    .bind(payload.dob)
    .bind(payload.gender)
    .bind(payload.allergies)
    .bind(payload.existing_conditions)
    .bind(payload.short_bio)
    .bind(payload.height_cm)
    .bind(payload.weight_kg)
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

    sqlx::query(
        "INSERT INTO doctor_profiles (user_id, license_number, specialties, years_of_experience, hospital_affiliation, short_bio, languages_spoken, working_hours) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
            license_number = EXCLUDED.license_number,
            specialties = EXCLUDED.specialties,
            years_of_experience = EXCLUDED.years_of_experience,
            hospital_affiliation = EXCLUDED.hospital_affiliation,
            short_bio = EXCLUDED.short_bio,
            languages_spoken = EXCLUDED.languages_spoken,
            working_hours = EXCLUDED.working_hours"
    )
    .bind(claims.sub)
    .bind(payload.license_number)
    .bind(payload.specialties)
    .bind(payload.years_of_experience)
    .bind(payload.hospital_affiliation)
    .bind(payload.short_bio)
    .bind(payload.languages_spoken)
    .bind(payload.working_hours)
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

    sqlx::query(
        "INSERT INTO pharmacy_profiles (user_id, license_number, address, city, state, opening_hours) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
            license_number = EXCLUDED.license_number,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            opening_hours = EXCLUDED.opening_hours"
    )
    .bind(claims.sub)
    .bind(payload.license_number)
    .bind(payload.address)
    .bind(payload.city)
    .bind(payload.state)
    .bind(payload.opening_hours)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "status": "success" })))
}

pub async fn search_doctors(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<DoctorSearchQuery>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let specialty = params.specialty.unwrap_or_default();
    let min_rating = params.min_rating.unwrap_or(0.0);

    let doctors = sqlx::query(
        "SELECT u.id, u.full_name, dp.specialties, dp.hospital_affiliation, dp.rating, dp.review_count 
         FROM users u 
         JOIN doctor_profiles dp ON u.id = dp.user_id 
         WHERE u.role = 'doctor' 
         AND ($1 = '' OR $1 = ANY(dp.specialties)) 
         AND dp.rating >= $2"
    )
    .bind(specialty)
    .bind(min_rating as f64)
    .fetch_all(&state.db)
    .await?;

    let result = doctors.into_iter().map(|d| {
        use sqlx::Row;
        serde_json::json!({
            "id": d.get::<uuid::Uuid, _>("id"),
            "full_name": d.get::<String, _>("full_name"),
            "specialties": d.get::<Vec<String>, _>("specialties"),
            "hospital_affiliation": d.get::<Option<String>, _>("hospital_affiliation"),
            "rating": d.get::<f32, _>("rating"),
            "review_count": d.get::<i32, _>("review_count"),
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
        "SELECT u.id, u.full_name, pp.address, pp.phone, pp.is_verified 
         FROM users u 
         JOIN pharmacy_profiles pp ON u.id = pp.user_id 
         WHERE u.role = 'pharmacy' 
         AND ($1 = '' OR pp.address ILIKE $2)"
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
            "address": p.get::<String, _>("address"),
            "phone": p.get::<String, _>("phone"),
            "is_verified": p.get::<bool, _>("is_verified"),
        })
    }).collect();

    Ok(Json(result))
}
