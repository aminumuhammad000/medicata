use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::message::ChatMessage,
    state::AppState,
    auth_utils::Claims,
};

// Fetch chat history for a specific consultation
pub async fn get_chat_history(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(consultation_id): Path<uuid::Uuid>,
) -> Result<Json<Vec<ChatMessage>>, AppError> {
    // Verify that the user is part of the consultation
    let is_authorized: Option<(i32,)> = sqlx::query_as(
        "SELECT 1 FROM consultations 
         WHERE id = $1 AND (patient_id = $2 OR doctor_id = $2)"
    )
    .bind(consultation_id)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;
    let is_authorized = is_authorized.is_some();

    if !is_authorized {
        return Err(AppError::Forbidden("You are not part of this consultation".to_string()));
    }

    let messages = sqlx::query_as::<_, ChatMessage>(
        "SELECT * FROM messages WHERE consultation_id = $1 ORDER BY created_at ASC"
    )
    .bind(consultation_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(messages))
}
