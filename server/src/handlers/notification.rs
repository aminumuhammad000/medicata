use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::notification::Notification,
    state::AppState,
    auth_utils::Claims,
};
use uuid::Uuid;

pub async fn get_my_notifications(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Notification>>, AppError> {
    let notifications = sqlx::query_as::<_, Notification>(
        "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50"
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(notifications))
}

pub async fn mark_as_read(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    sqlx::query("UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(claims.sub)
        .execute(&state.db)
        .await?;

    Ok(Json(()))
}

pub async fn trigger_refill_reminders(
    State(state): State<AppState>,
) -> Result<Json<String>, AppError> {
    let rows = sqlx::query(
        "SELECT p.patient_id, p.medication_name FROM prescriptions p 
         WHERE p.expires_at >= NOW() + INTERVAL '2 days' 
         AND p.expires_at <= NOW() + INTERVAL '3 days'"
    )
    .fetch_all(&state.db)
    .await?;

    let mut count = 0;
    for row in rows {
        use sqlx::Row;
        let patient_id: Uuid = row.get("patient_id");
        let medication_name: String = row.get("medication_name");
        
        let _ = create_notification(
            &state,
            patient_id,
            "Refill Reminder",
            &format!("Your prescription for {} is expiring in 3 days. Please consider a refill.", medication_name),
            "prescription"
        ).await;
        count += 1;
    }

    Ok(Json(format!("Triggered {} reminders", count)))
}

// Utility function to create notification (internal use)
pub async fn create_notification(
    state: &AppState,
    user_id: Uuid,
    title: &str,
    message: &str,
    n_type: &str,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO notifications (user_id, title, message, n_type) VALUES ($1, $2, $3, $4)"
    )
    .bind(user_id)
    .bind(title)
    .bind(message)
    .bind(n_type)
    .execute(&state.db)
    .await?;
    
    Ok(())
}
