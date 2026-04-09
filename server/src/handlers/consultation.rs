use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::{
        consultation::{Consultation, BookConsultationRequest, UpdateConsultationStatusRequest, AddConsultationNotesRequest, AddPatientFeedbackRequest},
        user::UserRole,
    },
    state::AppState,
    auth_utils::Claims,
    handlers::notification::create_notification,
};

// From UserJourney.md Consultation Flow: Book Consultation
pub async fn book_consultation(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<BookConsultationRequest>,
) -> Result<Json<Consultation>, AppError> {
    if claims.role != UserRole::Patient {
        return Err(AppError::Forbidden("Only patients can book consultations".to_string()));
    }

    let consultation = sqlx::query_as::<_, Consultation>(
        "INSERT INTO consultations (patient_id, doctor_id, scheduled_at, mode, reason, symptoms, files_reports, additional_notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *"
    )
    .bind(claims.sub)
    .bind(payload.doctor_id)
    .bind(payload.scheduled_at)
    .bind(payload.mode)
    .bind(payload.reason)
    .bind(payload.symptoms)
    .bind(payload.files_reports) // From UserJourney.md: Upload Files / Reports
    .bind(payload.additional_notes) // From UserJourney.md: Additional Notes / Requirements
    .fetch_one(&state.db)
    .await?;

    // From UserJourney.md: Send notification to doctor
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

// From UserJourney.md Consultation Flow: Update Status (mark as completed, flag follow-up)
pub async fn update_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateConsultationStatusRequest>,
) -> Result<Json<Consultation>, AppError> {
    // Only the doctor or the patient (for cancellation) can update status.
    
    let consultation = sqlx::query_as::<_, Consultation>(
        "UPDATE consultations SET status = $1, cancellation_reason = $2, is_follow_up = $3
         WHERE id = $4 AND (doctor_id = $5 OR patient_id = $5) 
         RETURNING *"
    )
    .bind(payload.status)
    .bind(payload.cancellation_reason)
    .bind(payload.is_follow_up) // From UserJourney.md: Optionally flag follow-up consultations
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    // From UserJourney.md: Send notification to patient
    let _ = create_notification(
        &state,
        consultation.patient_id,
        "Appointment Update",
        &format!("Your appointment status has been updated to {:?}", consultation.status),
        "appointment"
    ).await;

    Ok(Json(consultation))
}

// From UserJourney.md Consultation Flow: Doctor adds notes
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

// From UserJourney.md Consultation Flow: Patient provides feedback/rating
pub async fn add_patient_feedback(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<AddPatientFeedbackRequest>,
) -> Result<Json<Consultation>, AppError> {
    if claims.role != UserRole::Patient {
        return Err(AppError::Forbidden("Only patients can provide feedback".to_string()));
    }

    let consultation = sqlx::query_as::<_, Consultation>(
        "UPDATE consultations SET patient_rating = $1 
         WHERE id = $2 AND patient_id = $3 
         RETURNING *"
    )
    .bind(payload.rating) // From UserJourney.md: Provide feedback / rating for doctor
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(consultation))
}
