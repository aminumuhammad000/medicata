use axum::{
    extract::{Path, State, Extension},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

use crate::{
    error::AppError,
    auth_utils::Claims,
    state::AppState,
};

#[derive(Debug, Deserialize)]
pub struct ChatMessageRequest {
    pub session_id: Option<Uuid>,
    pub message: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ChatMessage {
    pub id: Uuid,
    pub session_id: Uuid,
    pub role: String,
    pub content: String,
    pub created_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub session_id: Uuid,
    pub user_message: ChatMessage,
    pub assistant_message: ChatMessage,
}

pub async fn send_message(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ChatMessageRequest>,
) -> Result<Json<ChatResponse>, AppError> {
    let session_id = payload.session_id.unwrap_or_else(Uuid::new_v4);

    // Save user message
    let user_msg = sqlx::query_as::<_, ChatMessage>(
        "INSERT INTO ai_chat_messages (user_id, session_id, role, content)
         VALUES ($1, $2, 'user', $3)
         RETURNING id, session_id, role, content, created_at"
    )
    .bind(claims.sub)
    .bind(session_id)
    .bind(&payload.message)
    .fetch_one(&state.db)
    .await?;

    // Generate AI response (mock implementation)
    let ai_response = generate_ai_response(&payload.message).await;

    // Save AI response
    let assistant_msg = sqlx::query_as::<_, ChatMessage>(
        "INSERT INTO ai_chat_messages (user_id, session_id, role, content)
         VALUES ($1, $2, 'assistant', $3)
         RETURNING id, session_id, role, content, created_at"
    )
    .bind(claims.sub)
    .bind(session_id)
    .bind(&ai_response)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(ChatResponse {
        session_id,
        user_message: user_msg,
        assistant_message: assistant_msg,
    }))
}

async fn generate_ai_response(message: &str) -> String {
    // Simple keyword-based responses for MVP
    let msg = message.to_lowercase();
    
    if msg.contains("headache") || msg.contains("pain") {
        "I understand you're experiencing pain. For headaches, rest and hydration often help. If severe or persistent, please consult a doctor immediately. Would you like me to help you find a doctor?".to_string()
    } else if msg.contains("fever") || msg.contains("temperature") {
        "Fever can indicate an infection. Monitor your temperature, stay hydrated, and rest. If temperature exceeds 38.5°C or lasts more than 3 days, please consult a doctor.".to_string()
    } else if msg.contains("appointment") || msg.contains("book") {
        "I can help you book an appointment! Would you like to search for doctors by specialty or see doctors available today?".to_string()
    } else if msg.contains("prescription") || msg.contains("medicine") {
        "You can view your prescriptions in the Prescriptions section. If you need a refill, please book a consultation with your doctor.".to_string()
    } else if msg.contains("pharmacy") || msg.contains("order") {
        "To order medicines, go to the Pharmacy section and upload your prescription. You can search for nearby pharmacies or have medicines delivered.".to_string()
    } else if msg.contains("emergency") || msg.contains("urgent") {
        "If this is a medical emergency, please call emergency services immediately (112/911) or go to the nearest hospital.".to_string()
    } else {
        "Thank you for your message. I'm here to help with general health information. For specific medical advice, please consult with a doctor. How can I assist you today?".to_string()
    }
}

pub async fn get_chat_history(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(session_id): Path<Uuid>,
) -> Result<Json<Vec<ChatMessage>>, AppError> {
    let messages = sqlx::query_as::<_, ChatMessage>(
        "SELECT id, session_id, role, content, created_at
         FROM ai_chat_messages
         WHERE user_id = $1 AND session_id = $2
         ORDER BY created_at ASC"
    )
    .bind(claims.sub)
    .bind(session_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(messages))
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ChatSession {
    pub id: Uuid,
    pub title: Option<String>,
    pub is_active: bool,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn get_sessions(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<ChatSession>>, AppError> {
    let sessions = sqlx::query_as::<_, ChatSession>(
        "SELECT id, title, is_active, created_at
         FROM ai_chat_sessions
         WHERE user_id = $1 AND is_active = true
         ORDER BY updated_at DESC"
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(sessions))
}
