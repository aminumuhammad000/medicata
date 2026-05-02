use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use uuid::Uuid;
use crate::{
    error::AppError,
    models::{
        consultation::{Consultation, BookConsultationRequest, UpdateConsultationStatusRequest, AddConsultationNotesRequest, AddPatientFeedbackRequest, DoctorAnalytics, RequestLabTestRequest, LabTestRequest, LabTestStatus, UpdateLabTestStatusRequest, UploadLabResultRequest},
        user::UserRole,
    },
    state::AppState,
    auth_utils::Claims,
    handlers::notification::create_notification,
};
use chrono::{Utc, Datelike};
use rand::Rng;
use sqlx::Row;

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
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(payload): Json<AddConsultationNotesRequest>,
) -> Result<Json<Consultation>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can add consultation notes".to_string()));
    }

    let mut tx = state.db.begin().await?;

    // 1. Update consultation notes and status
    let consultation = sqlx::query_as::<_, Consultation>(
        "UPDATE consultations 
         SET doctor_notes = $1, status = 'completed', updated_at = NOW() 
         WHERE id = $2 AND doctor_id = $3 
         RETURNING *"
    )
    .bind(payload.notes)
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&mut *tx)
    .await?;

    // 2. Get doctor's wallet or create if doesn't exist
    let wallet_row = sqlx::query(
        "INSERT INTO wallets (user_id, balance) 
         VALUES ($1, 0) 
         ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() 
         RETURNING id, balance"
    )
    .bind(claims.sub)
    .fetch_one(&mut *tx)
    .await?;

    let wallet_id: Uuid = wallet_row.get("id");
    let earning_amount: i64 = 5000; // Hardcoded for MVP as per dashboard stats

    // 3. Credit wallet balance
    sqlx::query(
        "UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2"
    )
    .bind(earning_amount)
    .bind(wallet_id)
    .execute(&mut *tx)
    .await?;

    // 4. Record transaction history
    sqlx::query(
        "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status, created_at) 
         VALUES ($1, 'credit', $2, $3, 'completed', NOW())"
    )
    .bind(wallet_id)
    .bind(earning_amount)
    .bind(format!("Consultation fee for Appointment #{}", &id.to_string()[..8]))
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

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
    claims: Claims,
) -> Result<Json<DoctorAnalytics>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can access analytics".to_string()));
    }

    let now = Utc::now();
    let today = now.date_naive();
    let first_of_month = today.with_day(1).unwrap();
    let first_of_month_dt = first_of_month.and_hms_opt(0, 0, 0).unwrap().and_local_timezone(Utc).unwrap();

    // Use a single query to get all counts for efficiency
    // NOTE: scheduled_at is TIMESTAMPTZ. Today comparison uses doctor's local date (based on server time UTC)
    let record: (Option<i64>, Option<i64>, Option<i64>, Option<i64>, Option<i64>) = sqlx::query_as(
        r#"
           SELECT 
               COUNT(*) as total_count,
               COUNT(*) FILTER (WHERE DATE(scheduled_at AT TIME ZONE 'UTC') = $1) as today_count,
               COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
               COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
               COUNT(*) FILTER (WHERE status = 'completed' AND scheduled_at >= $2) as month_completed_count
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

#[axum::debug_handler]
pub async fn request_lab_test(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<RequestLabTestRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can request lab tests".to_string()));
    }

    println!("[DEBUG] Lab test request: doctor_id={}, patient_id={}, tests={:?}", claims.sub, payload.patient_id, payload.tests);

    // Generate requisition code: LAB-YYYY-XXXX (e.g., LAB-2024-X8K2)
    let requisition_code = {
        let year = Utc::now().year();
        let mut rng = rand::thread_rng();
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let random_suffix: String = (0..4)
            .map(|_| {
                let idx = rng.gen_range(0..chars.len());
                chars.chars().nth(idx).unwrap()
            })
            .collect();
        format!("LAB-{}-{}", year, random_suffix)
    };

    // Convert tests to JSONB
    let tests_json = serde_json::to_value(&payload.tests)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize tests: {}", e)))?;

    // Insert lab test request
    let lab_test = sqlx::query_as::<_, LabTestRequest>(
        "INSERT INTO lab_test_requests (
            consultation_id, patient_id, doctor_id, requisition_code, 
            tests, instructions, status, requested_at, result_files, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), '[]'::jsonb, NOW(), NOW())
        RETURNING 
            id, consultation_id, patient_id, doctor_id, requisition_code,
            tests, instructions, status,
            requested_at, completed_at, result_files, result_summary,
            created_at, updated_at,
            NULL as patient_name, NULL as doctor_name"
    )
    .bind(payload.consultation_id)
    .bind(payload.patient_id)
    .bind(claims.sub)
    .bind(&requisition_code)
    .bind(tests_json)
    .bind(payload.instructions)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        println!("[DEBUG] Lab test insert failed: {:?}", e);
        AppError::Internal(anyhow::anyhow!("Failed to create lab test request: {}", e))
    })?;

    // Fetch doctor name for notification
    let doctor_name = sqlx::query_scalar::<_, String>("SELECT full_name FROM users WHERE id = $1")
        .bind(claims.sub)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(Some("Your doctor".to_string()))
        .unwrap_or("Your doctor".to_string());

    // Send notification to patient
    let _ = create_notification(
        &state,
        payload.patient_id,
        "New Lab Test Request",
        &format!("{} has requested {} lab test(s) for you. Requisition: {}", 
            doctor_name, 
            payload.tests.len(),
            requisition_code
        ),
        "lab_test"
    ).await;

    println!("[DEBUG] Lab test created: id={}, code={}", lab_test.id, requisition_code);

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Lab test request created successfully",
        "requisition_code": requisition_code,
        "lab_test_id": lab_test.id.to_string(),
    })))
}

// Get all lab tests for a consultation
pub async fn get_consultation_lab_tests(
    State(state): State<AppState>,
    Extension(_claims): Extension<Claims>,
    Path(consultation_id): Path<Uuid>,
) -> Result<Json<Vec<LabTestRequest>>, AppError> {
    let lab_tests = sqlx::query_as::<_, LabTestRequest>(
        "SELECT 
            l.*,
            u.full_name as patient_name,
            d.full_name as doctor_name
        FROM lab_test_requests l
        LEFT JOIN users u ON l.patient_id = u.id
        LEFT JOIN users d ON l.doctor_id = d.id
        WHERE l.consultation_id = $1
        ORDER BY l.requested_at DESC"
    )
    .bind(consultation_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch lab tests: {}", e)))?;

    Ok(Json(lab_tests))
}

// Get single lab test by ID
pub async fn get_lab_test(
    State(state): State<AppState>,
    Extension(_claims): Extension<Claims>,
    Path(lab_test_id): Path<Uuid>,
) -> Result<Json<LabTestRequest>, AppError> {
    let lab_test = sqlx::query_as::<_, LabTestRequest>(
        "SELECT 
            l.*,
            u.full_name as patient_name,
            d.full_name as doctor_name
        FROM lab_test_requests l
        LEFT JOIN users u ON l.patient_id = u.id
        LEFT JOIN users d ON l.doctor_id = d.id
        WHERE l.id = $1"
    )
    .bind(lab_test_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch lab test: {}", e)))?;

    match lab_test {
        Some(lt) => Ok(Json(lt)),
        None => Err(AppError::NotFound("Lab test not found".to_string())),
    }
}

// Update lab test status
pub async fn update_lab_test_status(
    State(state): State<AppState>,
    Extension(_claims): Extension<Claims>,
    Path(lab_test_id): Path<Uuid>,
    Json(payload): Json<UpdateLabTestStatusRequest>,
) -> Result<Json<LabTestRequest>, AppError> {
    // Set completed_at if status is completed
    let completed_at = match payload.status {
        LabTestStatus::Completed => Some(Utc::now()),
        _ => None,
    };

    let lab_test = sqlx::query_as::<_, LabTestRequest>(
        "UPDATE lab_test_requests 
        SET status = $1, completed_at = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING 
            id, consultation_id, patient_id, doctor_id, requisition_code,
            tests, instructions, status,
            requested_at, completed_at, result_files, result_summary,
            created_at, updated_at,
            NULL as patient_name, NULL as doctor_name"
    )
    .bind(payload.status)
    .bind(completed_at)
    .bind(lab_test_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to update lab test status: {}", e)))?;

    // Send notification to patient about status change
    let status_text = format!("{:?}", payload.status).to_lowercase();
    let _ = create_notification(
        &state,
        lab_test.patient_id,
        "Lab Test Status Updated",
        &format!("Your lab test (Requisition: {}) is now {}", 
            lab_test.requisition_code.as_deref().unwrap_or("N/A"),
            status_text.replace("inprogress", "in progress")
        ),
        "lab_test"
    ).await;

    Ok(Json(lab_test))
}

// Upload lab result
pub async fn upload_lab_result(
    State(state): State<AppState>,
    Extension(_claims): Extension<Claims>,
    Path(lab_test_id): Path<Uuid>,
    Json(payload): Json<UploadLabResultRequest>,
) -> Result<Json<LabTestRequest>, AppError> {
    // Process result_files if provided
    let result_files_json = if let Some(files) = payload.result_files {
        serde_json::to_value(files)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize result files: {}", e)))?
    } else {
        serde_json::Value::Null
    };
    
    let lab_test = sqlx::query_as::<_, LabTestRequest>(
        "UPDATE lab_test_requests 
        SET result_summary = COALESCE($1, result_summary), 
            result_files = CASE WHEN $3 IS NULL THEN result_files ELSE $3 END,
            status = 'completed',
            completed_at = COALESCE(completed_at, NOW()),
            updated_at = NOW()
        WHERE id = $2
        RETURNING 
            id, consultation_id, patient_id, doctor_id, requisition_code,
            tests, instructions, status,
            requested_at, completed_at, result_files, result_summary,
            created_at, updated_at,
            NULL as patient_name, NULL as doctor_name"
    )
    .bind(payload.result_summary)
    .bind(lab_test_id)
    .bind(result_files_json)
    .fetch_one(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to upload lab result: {}", e)))?;

    // Notify patient that results are ready
    let _ = create_notification(
        &state,
        lab_test.patient_id,
        "Lab Results Ready",
        &format!("Your lab test results (Requisition: {}) are now available. Please check with your doctor.", 
            lab_test.requisition_code.as_deref().unwrap_or("N/A")
        ),
        "lab_test"
    ).await;

    Ok(Json(lab_test))
}

// Add clinical comment to lab result
pub async fn add_lab_test_comment(
    State(state): State<AppState>,
    claims: Claims,
    Path(lab_test_id): Path<Uuid>,
    Json(payload): Json<UploadLabResultRequest>,
) -> Result<Json<LabTestRequest>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can add clinical comments".to_string()));
    }

    let lab_test = sqlx::query_as::<_, LabTestRequest>(
        "UPDATE lab_test_requests 
        SET result_summary = $1, 
            updated_at = NOW()
        WHERE id = $2
        RETURNING 
            id, consultation_id, patient_id, doctor_id, requisition_code,
            tests, instructions, status,
            requested_at, completed_at, result_files, result_summary,
            created_at, updated_at,
            NULL as patient_name, NULL as doctor_name"
    )
    .bind(payload.result_summary)
    .bind(lab_test_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to add lab test comment: {}", e)))?;

    // Notify patient that the doctor has commented on their results
    let _ = create_notification(
        &state,
        lab_test.patient_id,
        "New Doctor Comment on Lab Results",
        &format!("Your doctor has added a clinical comment to your lab results (Requisition: {}).", 
            lab_test.requisition_code.as_deref().unwrap_or("N/A")
        ),
        "lab_test"
    ).await;

    Ok(Json(lab_test))
}

// Get all prescriptions for a consultation
pub async fn get_consultation_prescriptions(
    State(state): State<AppState>,
    _claims: Claims,
    Path(consultation_id): Path<Uuid>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let prescriptions = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT 
            json_build_object(
                'id', p.id,
                'consultation_id', p.consultation_id,
                'patient_id', p.patient_id,
                'doctor_id', p.doctor_id,
                'qr_code_token', p.qr_code_token,
                'expiry_date', p.expiry_date,
                'is_verified', p.is_verified,
                'created_at', p.created_at,
                'items', COALESCE(
                    (SELECT json_agg(json_build_object(
                        'id', pi.id,
                        'drug_name', d.name,
                        'dosage', pi.dosage,
                        'frequency', pi.frequency,
                        'duration_days', pi.duration_days,
                        'quantity', pi.quantity,
                        'instructions', pi.instructions
                    ))
                    FROM prescription_items pi
                    JOIN drugs d ON pi.drug_id = d.id
                    WHERE pi.prescription_id = p.id),
                    '[]'::json
                )
            ) as prescription
        FROM prescriptions p
        WHERE p.consultation_id = $1
        ORDER BY p.created_at DESC"
    )
    .bind(consultation_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch prescriptions: {}", e)))?;

    let results: Vec<serde_json::Value> = prescriptions.into_iter().map(|(p,)| p).collect();
    Ok(Json(results))
}

// Get full medical history for a patient (used by doctors)
pub async fn get_patient_history(
    State(state): State<AppState>,
    claims: Claims,
    Path(patient_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can access patient history".to_string()));
    }

    // 1. Get consultations (all history)
    let consultations = sqlx::query_as::<_, Consultation>(
        "SELECT c.*, u.full_name as doctor_name 
         FROM consultations c
         JOIN users u ON c.doctor_id = u.id
         WHERE c.patient_id = $1
         ORDER BY c.scheduled_at DESC"
    )
    .bind(patient_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch history consultations: {}", e)))?;

    // 2. Get lab tests (all requests)
    let lab_tests = sqlx::query_as::<_, LabTestRequest>(
        "SELECT l.*, u.full_name as patient_name, d.full_name as doctor_name
         FROM lab_test_requests l
         LEFT JOIN users u ON l.patient_id = u.id
         LEFT JOIN users d ON l.doctor_id = d.id
         WHERE l.patient_id = $1
         ORDER BY l.created_at DESC"
    )
    .bind(patient_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch history lab tests: {}", e)))?;

    // 3. Get past prescriptions
    let prescriptions = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT 
            json_build_object(
                'id', p.id,
                'doctor_id', p.doctor_id,
                'doctor_name', d.full_name,
                'created_at', p.created_at,
                'items', (
                    SELECT json_agg(json_build_object(
                        'drug_name', drugs.name,
                        'dosage', pi.dosage,
                        'instructions', pi.instructions
                    ))
                    FROM prescription_items pi
                    JOIN drugs ON pi.drug_id = drugs.id
                    WHERE pi.prescription_id = p.id
                )
            )
         FROM prescriptions p
         JOIN users d ON p.doctor_id = d.id
         WHERE p.patient_id = $1
         ORDER BY p.created_at DESC"
    )
    .bind(patient_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch history prescriptions: {}", e)))?;

    let prescriptions_json: Vec<serde_json::Value> = prescriptions.into_iter().map(|(p,)| p).collect();

    Ok(Json(serde_json::json!({
        "consultations": consultations,
        "labs": lab_tests,
        "prescriptions": prescriptions_json
    })))
}

