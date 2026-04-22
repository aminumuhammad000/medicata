use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::{
    error::AppError,
    state::AppState,
};



#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct SearchDoctorsQuery {
    pub specialty: Option<String>,
    pub name: Option<String>,
    pub available_on: Option<chrono::NaiveDate>,
    pub min_rating: Option<f64>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub max_distance_km: Option<f64>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct DoctorSearchResult {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    pub specialty: Option<String>,
    pub years_of_experience: Option<i32>,
    pub clinic_hospital_affiliation: Option<String>,
    pub bio: Option<String>,
    pub languages_spoken: Option<String>,
    pub rating: Option<f64>,
    pub total_reviews: i64,
    pub consultation_fee: Option<i64>,
    pub is_available_today: bool,
    pub next_available_slot: Option<chrono::NaiveDateTime>,
    pub profile_photo: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub doctors: Vec<DoctorSearchResult>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

pub async fn search_doctors(
    State(state): State<AppState>,
    Query(params): Query<SearchDoctorsQuery>,
) -> Result<Json<SearchResponse>, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;

    // Simplified search with optional filters using simple SQL binding
    let rows = if let Some(specialty) = &params.specialty {
        sqlx::query(
            "SELECT 
                u.id, u.full_name, u.email, u.specialty, u.years_of_experience,
                u.clinic_hospital_affiliation, u.bio, u.languages_spoken, u.rating,
                u.consultation_fee, u.profile_photo,
                COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.target_id = u.id), 0) as total_reviews
             FROM users u 
             WHERE u.role = 'doctor' AND u.specialty ILIKE $1
             ORDER BY u.rating DESC NULLS LAST
             LIMIT $2 OFFSET $3"
        )
        .bind(format!("%{}%", specialty))
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db).await?
    } else if let Some(name) = &params.name {
        sqlx::query(
            "SELECT 
                u.id, u.full_name, u.email, u.specialty, u.years_of_experience,
                u.clinic_hospital_affiliation, u.bio, u.languages_spoken, u.rating,
                u.consultation_fee, u.profile_photo,
                COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.target_id = u.id), 0) as total_reviews
             FROM users u 
             WHERE u.role = 'doctor' AND u.full_name ILIKE $1
             ORDER BY u.rating DESC NULLS LAST
             LIMIT $2 OFFSET $3"
        )
        .bind(format!("%{}%", name))
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db).await?
    } else {
        sqlx::query(
            "SELECT 
                u.id, u.full_name, u.email, u.specialty, u.years_of_experience,
                u.clinic_hospital_affiliation, u.bio, u.languages_spoken, u.rating,
                u.consultation_fee, u.profile_photo,
                COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.target_id = u.id), 0) as total_reviews
             FROM users u 
             WHERE u.role = 'doctor'
             ORDER BY u.rating DESC NULLS LAST
             LIMIT $1 OFFSET $2"
        )
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db).await?
    };

    let total = rows.len() as i64;

    let doctors: Vec<DoctorSearchResult> = rows
        .into_iter()
        .map(|row| DoctorSearchResult {
            id: row.get("id"),
            full_name: row.get("full_name"),
            email: row.get("email"),
            specialty: row.get("specialty"),
            years_of_experience: row.get("years_of_experience"),
            clinic_hospital_affiliation: row.get("clinic_hospital_affiliation"),
            bio: row.get("bio"),
            languages_spoken: row.get("languages_spoken"),
            rating: row.get("rating"),
            total_reviews: row.get("total_reviews"),
            consultation_fee: row.get("consultation_fee"),
            is_available_today: true,
            next_available_slot: None,
            profile_photo: row.get("profile_photo"),
        })
        .collect();

    Ok(Json(SearchResponse {
        doctors,
        total,
        page,
        per_page,
    }))
}

#[derive(Debug, Serialize)]
pub struct SpecialtyResponse {
    pub specialties: Vec<String>,
}

pub async fn get_specialties(
    State(state): State<AppState>,
) -> Result<Json<SpecialtyResponse>, AppError> {
    let specialties: Vec<String> = sqlx::query_scalar(
        "SELECT DISTINCT specialty FROM users 
         WHERE role = 'doctor' AND specialty IS NOT NULL AND specialty != '' 
         ORDER BY specialty"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(SpecialtyResponse { specialties }))
}

#[derive(Debug, Serialize)]
#[allow(dead_code)]
pub struct DoctorProfileResponse {
    pub id: Uuid,
    pub full_name: String,
    pub specialty: Option<String>,
    pub years_of_experience: Option<i32>,
    pub clinic_hospital_affiliation: Option<String>,
    pub bio: Option<String>,
    pub languages_spoken: Option<String>,
    pub rating: Option<f64>,
    pub total_reviews: i64,
    pub consultation_fee: Option<i64>,
    pub profile_photo: Option<String>,
    pub reviews: Vec<ReviewSummary>,
    pub availability: Vec<AvailabilitySlot>,
}

#[derive(Debug, Serialize)]
#[allow(dead_code)]
pub struct ReviewSummary {
    pub id: Uuid,
    pub patient_name: String,
    pub rating: i32,
    pub comment: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
#[allow(dead_code)]
pub struct AvailabilitySlot {
    pub date: chrono::NaiveDate,
    pub start_time: chrono::NaiveTime,
    pub end_time: chrono::NaiveTime,
    pub is_booked: bool,
}

#[allow(dead_code)]
pub async fn get_doctor_profile(
    State(state): State<AppState>,
    Path(doctor_id): Path<Uuid>,
) -> Result<Json<DoctorProfileResponse>, AppError> {
    // Get doctor info
    let doctor_row = sqlx::query(
        "SELECT 
            u.id,
            u.full_name,
             u.specialty,
             u.years_of_experience,
             u.clinic_hospital_affiliation,
             u.bio,
             u.languages_spoken,
             u.rating,
             u.consultation_fee,
             u.profile_photo,
             COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.target_id = u.id), 0) as total_reviews
          FROM users u 
          WHERE u.id = $1 AND u.role = 'doctor'"
    )
    .bind(doctor_id)
    .fetch_optional(&state.db)
    .await?;

    let row = doctor_row.ok_or_else(|| AppError::not_found("Doctor not found"))?;

    // Get reviews
    let reviews = sqlx::query(
        "SELECT r.id, u.full_name as patient_name, r.rating, r.comment, r.created_at
         FROM reviews r
         JOIN users u ON r.reviewer_id = u.id
         WHERE r.target_id = $1
         ORDER BY r.created_at DESC
         LIMIT 10"
    )
    .bind(doctor_id)
    .fetch_all(&state.db)
    .await?;

    let reviews: Vec<ReviewSummary> = reviews
        .into_iter()
        .map(|r| ReviewSummary {
            id: r.get("id"),
            patient_name: r.get("patient_name"),
            rating: r.get("rating"),
            comment: r.get("comment"),
            created_at: r.get("created_at"),
        })
        .collect();

    Ok(Json(DoctorProfileResponse {
        id: row.get("id"),
        full_name: row.get("full_name"),
        specialty: row.get("specialty"),
        years_of_experience: row.get("years_of_experience"),
        clinic_hospital_affiliation: row.get("clinic_hospital_affiliation"),
        bio: row.get("bio"),
        languages_spoken: row.get("languages_spoken"),
        rating: row.get("rating"),
        total_reviews: row.get("total_reviews"),
        consultation_fee: row.get("consultation_fee"),
        profile_photo: row.get("profile_photo"),
        reviews,
        availability: vec![],
    }))
}

