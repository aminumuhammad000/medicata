use axum::{
    extract::{State, Path},
    Json,
};
use uuid::Uuid;
use crate::{
    error::AppError,
    models::medication::{MedicationReminder, CreateReminderRequest, UpdateReminderStatusRequest},
    state::AppState,
    auth_utils::Claims,
};

// Create a new medication reminder
pub async fn create_reminder(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<CreateReminderRequest>,
) -> Result<Json<MedicationReminder>, AppError> {
    let reminder = sqlx::query_as::<_, MedicationReminder>(
        "INSERT INTO medication_reminders (
            patient_id, prescription_id, medication_name, dosage, 
            frequency, times, start_date, end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *"
    )
    .bind(claims.sub)
    .bind(payload.prescription_id)
    .bind(payload.medication_name)
    .bind(payload.dosage)
    .bind(payload.frequency)
    .bind(payload.times)
    .bind(payload.start_date)
    .bind(payload.end_date)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(reminder))
}

// Get all reminders for the logged-in patient
pub async fn get_my_reminders(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<MedicationReminder>>, AppError> {
    let reminders = sqlx::query_as::<_, MedicationReminder>(
        "SELECT * FROM medication_reminders WHERE patient_id = $1 ORDER BY created_at DESC"
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(reminders))
}

// Toggle reminder status (active/inactive)
pub async fn update_reminder_status(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateReminderStatusRequest>,
) -> Result<Json<MedicationReminder>, AppError> {
    let reminder = sqlx::query_as::<_, MedicationReminder>(
        "UPDATE medication_reminders SET is_active = $1, updated_at = NOW() 
         WHERE id = $2 AND patient_id = $3 
         RETURNING *"
    )
    .bind(payload.is_active)
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(reminder))
}

// Delete a reminder
pub async fn delete_reminder(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM medication_reminders WHERE id = $1 AND patient_id = $2")
        .bind(id)
        .bind(claims.sub)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}
