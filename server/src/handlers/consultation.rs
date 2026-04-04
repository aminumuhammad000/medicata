use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::{
        consultation::{Consultation, BookConsultationRequest, UpdateConsultationStatusRequest, AddConsultationNotesRequest},
        user::UserRole,
    },
    state::AppState,
    auth_utils::Claims,
    handlers::notification::create_notification,
};

pub async fn book_consultation(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<BookConsultationRequest>,
) -> Result<Json<Consultation>, AppError> {
    if claims.role != UserRole::Patient {
        return Err(AppError::Forbidden("Only patients can book consultations".to_string()));
    }

    let consultation = sqlx::query_as::<_, Consultation>(
        "INSERT INTO consultations (patient_id, doctor_id, scheduled_at, mode, reason, symptoms) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *"
    )
    .bind(claims.sub)
    .bind(payload.doctor_id)
    .bind(payload.scheduled_at)
    .bind(payload.mode)
    .bind(payload.reason)
    .bind(payload.symptoms)
    .fetch_one(&state.db)
    .await?;

    // Notify doctor of new booking
    let _ = create_notification(
        &state,
        consultation.doctor_id,
        "New Appointment Request",
        &format!("You have a new consultation request for {}", consultation.scheduled_at),
        "appointment"
    ).await;

    Ok(Json(consultation))
}

pub async fn get_my_consultations(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Consultation>>, AppError> {
    let query = match claims.role {
        UserRole::Patient => "SELECT * FROM consultations WHERE patient_id = $1 ORDER BY scheduled_at DESC",
        UserRole::Doctor => "SELECT * FROM consultations WHERE doctor_id = $1 ORDER BY scheduled_at DESC",
        _ => return Err(AppError::Forbidden("Unauthorized role for consultations".to_string())),
    };

    let consultations = sqlx::query_as::<_, Consultation>(query)
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await?;

    Ok(Json(consultations))
}

pub async fn update_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateConsultationStatusRequest>,
) -> Result<Json<Consultation>, AppError> {
    // Only the doctor or the patient (for cancellation) can update status.
    // For simplicity, we'll allow both if they are part of the consultation.
    
    let consultation = sqlx::query_as::<_, Consultation>(
        "UPDATE consultations SET status = $1, cancellation_reason = $2 
         WHERE id = $3 AND (doctor_id = $4 OR patient_id = $4) 
         RETURNING *"
    )
    .bind(payload.status)
    .bind(payload.cancellation_reason)
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    // Notify patient of status update
    let _ = create_notification(
        &state,
        consultation.patient_id,
        "Appointment Update",
        &format!("Your appointment status has been updated to {:?}", consultation.status),
        "appointment"
    ).await;

    Ok(Json(consultation))
}

pub async fn add_notes(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<AddConsultationNotesRequest>,
) -> Result<Json<Consultation>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can add consultation notes".to_string()));
    }

    let consultation = sqlx::query_as::<_, Consultation>(
        "UPDATE consultations SET doctor_notes = $1 
         WHERE id = $2 AND doctor_id = $3 
         RETURNING *"
    )
    .bind(payload.notes)
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(consultation))
}
