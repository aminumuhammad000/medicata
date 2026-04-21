use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::{
        consultation::{Consultation, BookConsultationRequest, UpdateConsultationStatusRequest, AddConsultationNotesRequest, AddPatientFeedbackRequest, DoctorAnalytics},
        user::UserRole,
    },
    state::AppState,
    auth_utils::Claims,
    handlers::notification::create_notification,
};
use chrono::{Utc, Datelike};

// From UserJourney.md Consultation Flow: Book Consultation
pub async fn book_consultation(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<BookConsultationRequest>,
) -> Result<Json<Consultation>, AppError> {
    if claims.role != UserRole::Patient {
        return Err(AppError::Forbidden("Only patients can book consultations".to_string()));
    }

    println!("[DEBUG] Booking consultation: patient_id={}, doctor_id={}, scheduled_at={}", claims.sub, payload.doctor_id, payload.scheduled_at);

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
    .await;

    match &consultation {
        Ok(c) => println!("[DEBUG] Booking successful: id={}", c.id),
        Err(e) => println!("[DEBUG] Booking FAILED: {:?}", e),
    }

    let consultation = consultation?;

    // Fetch doctor's email and patient name for email notification
    let doctor_email = sqlx::query_scalar::<_, String>("SELECT email FROM users WHERE id = $1")
        .bind(consultation.doctor_id)
        .fetch_optional(&state.db)
        .await;
    
    let patient_name = sqlx::query_scalar::<_, String>("SELECT full_name FROM users WHERE id = $1")
        .bind(claims.sub)
        .fetch_optional(&state.db)
        .await;

    let patient_name_str = match patient_name {
        Ok(Some(name)) => name,
        _ => "A patient".to_string(),
    };

    // Send email notification to doctor
    if let Ok(Some(email)) = doctor_email {
        let scheduled_str = consultation.scheduled_at.format("%Y-%m-%d %H:%M").to_string();
        let _ = state.email_service.send_appointment_notification_to_doctor(
            &email,
            &patient_name_str,
            &scheduled_str,
            &consultation.reason
        ).await;
    }

    // From UserJourney.md: Send notification to doctor (in-app)
    let _ = create_notification(
        &state,
        consultation.doctor_id,
        "New Appointment Request",
        &format!("You have a new consultation request from {} for {}", patient_name_str, consultation.scheduled_at),
        "appointment"
    ).await;

    Ok(Json(consultation))
}

pub async fn get_my_consultations(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Consultation>>, AppError> {
    println!("[DEBUG] Fetching consultations for user={}, role={:?}", claims.sub, claims.role);

    let query = match claims.role {
        UserRole::Patient => 
            "SELECT c.*, u.full_name as doctor_name 
             FROM consultations c
             JOIN users u ON c.doctor_id = u.id
             WHERE c.patient_id = $1 
             ORDER BY c.scheduled_at DESC",
        UserRole::Doctor => 
            "SELECT c.*, u.full_name as patient_name 
             FROM consultations c
             JOIN users u ON c.patient_id = u.id
             WHERE c.doctor_id = $1 
             ORDER BY c.scheduled_at DESC",
        _ => return Err(AppError::Forbidden("Unauthorized role for consultations".to_string())),
    };

    let consultations = sqlx::query_as::<_, Consultation>(query)
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await;

    match &consultations {
        Ok(list) => println!("[DEBUG] Fetched {} consultations", list.len()),
        Err(e) => println!("[DEBUG] Fetch FAILED: {:?}", e),
    }

    let consultations = consultations?;

    Ok(Json(consultations))
}

// From UserJourney.md Consultation Flow: Update Status (mark as completed, flag follow-up)
pub async fn update_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateConsultationStatusRequest>,
) -> Result<Json<Consultation>, AppError> {
    // Fetch patient and doctor info for email notification
    let patient_info: Option<(String, String, String)> = sqlx::query_as(
        "SELECT p.email as patient_email, p.full_name as patient_name, d.full_name as doctor_name
         FROM consultations c
         JOIN users d ON c.doctor_id = d.id
         JOIN users p ON c.patient_id = p.id
         WHERE c.id = $1 AND (c.doctor_id = $2 OR c.patient_id = $2)"
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await
    .ok()
    .flatten();

    let consultation = sqlx::query_as::<_, Consultation>(
        "UPDATE consultations SET status = $1, cancellation_reason = $2, is_follow_up = $3
         WHERE id = $4 AND (doctor_id = $5 OR patient_id = $5) 
         RETURNING *"
    )
    .bind(&payload.status)
    .bind(&payload.cancellation_reason)
    .bind(payload.is_follow_up)
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    // Send email notification to patient
    if let Some((patient_email, _patient_name, doctor_name)) = patient_info {
        let scheduled_str = consultation.scheduled_at.format("%Y-%m-%d %H:%M").to_string();
        let status_str = format!("{:?}", payload.status);
        let cancel_reason = payload.cancellation_reason.as_deref();
        
        let _ = state.email_service.send_appointment_status_notification_to_patient(
            &patient_email,
            &status_str,
            &doctor_name,
            &scheduled_str,
            cancel_reason
        ).await;
    }

    // From UserJourney.md: Send in-app notification to patient
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

pub async fn get_doctor_analytics(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<DoctorAnalytics>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can access analytics".to_string()));
    }

    let now = Utc::now();
    let today = now.date_naive();
    let first_of_month = today.with_day(1).unwrap();

    // Use a single query to get all counts for efficiency
    let first_of_month_dt = first_of_month.and_hms_opt(0, 0, 0).unwrap().and_local_timezone(Utc).unwrap();
    let record: (Option<i64>, Option<i64>, Option<i64>, Option<i64>, Option<i64>) = sqlx::query_as(
        r#"
        SELECT 
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE scheduled_at::date = $1) as today_count,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
            COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= $2) as month_completed_count
        FROM consultations
        WHERE doctor_id = $3
        "#
    )
    .bind(today)
    .bind(first_of_month_dt)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    let completed_count = record.3.unwrap_or(0);
    let total_earnings = completed_count * 5000;

    Ok(Json(DoctorAnalytics {
        today_appointments: record.1.unwrap_or(0),
        pending_appointments: record.2.unwrap_or(0),
        total_appointments: record.0.unwrap_or(0),
        total_earnings,
        completed_this_month: record.4.unwrap_or(0),
    }))
}
