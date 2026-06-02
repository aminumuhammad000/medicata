use axum::{
    extract::{State, Path},
    Json,
};
use crate::{
    error::AppError,
    state::AppState,
    auth_utils::Claims,
};
use livekit_api::access_token::{AccessToken, VideoGrants};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct JoinRoomResponse {
    pub token: String,
    pub room_name: String,
    pub url: String,
}

pub async fn get_join_token(
    State(state): State<AppState>,
    claims: Claims,
    Path(consultation_id): Path<Uuid>,
) -> Result<Json<JoinRoomResponse>, AppError> {
    // 1. Verify user is part of this consultation
    let consultation = sqlx::query(
        "SELECT id FROM consultations WHERE id = $1 AND (patient_id = $2 OR doctor_id = $2)"
    )
    .bind(consultation_id)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;

    if consultation.is_none() {
        return Err(AppError::Forbidden("You are not part of this consultation".to_string()));
    }

    // 2. Generate LiveKit Token
    let api_key = std::env::var("LIVEKIT_API_KEY").unwrap_or_default();
    let api_secret = std::env::var("LIVEKIT_API_SECRET").unwrap_or_default();
    let livekit_url = std::env::var("LIVEKIT_URL").unwrap_or_else(|_| "wss://medicata-xxxx.livekit.cloud".to_string());

    if api_key.is_empty() || api_secret.is_empty() {
        return Err(AppError::Internal(anyhow::anyhow!("LiveKit credentials not configured")));
    }

    let room_name = format!("room_{}", consultation_id);
    let identity = claims.sub.to_string();

    let mut video_grants = VideoGrants::default();
    video_grants.room_join = true;
    video_grants.room = room_name.clone();

    let token = AccessToken::with_api_key(&api_key, &api_secret)
        .with_identity(&identity)
        .with_grants(video_grants)
        .to_jwt()
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to generate LiveKit token: {}", e)))?;

    Ok(Json(JoinRoomResponse {
        token,
        room_name,
        url: livekit_url,
    }))
}
