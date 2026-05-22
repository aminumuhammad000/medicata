use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;
use sqlx::{Pool, Postgres};

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
    claims: Claims,
    Json(payload): Json<ChatMessageRequest>,
) -> Result<Json<ChatResponse>, AppError> {
    let mut session_id = payload.session_id;

    // Create session if it doesn't exist
    if session_id.is_none() {
        let title = if payload.message.len() > 30 {
            format!("{}...", &payload.message[0..27])
        } else {
            payload.message.clone()
        };

        let row = sqlx::query!(
            "INSERT INTO ai_chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id",
            claims.sub,
            title
        )
        .fetch_one(&state.db)
        .await?;
        
        session_id = Some(row.id);
    }

    let sid = session_id.unwrap();

    // Save user message
    let user_msg = sqlx::query_as::<_, ChatMessage>(
        "INSERT INTO ai_chat_messages (user_id, session_id, role, content)
         VALUES ($1, $2, 'user', $3)
         RETURNING id, session_id, role, content, created_at"
    )
    .bind(claims.sub)
    .bind(sid)
    .bind(&payload.message)
    .fetch_one(&state.db)
    .await?;

    // Generate AI response
    let ai_response = generate_ai_response(&payload.message, &state.db).await;

    // Save AI response
    let assistant_msg = sqlx::query_as::<_, ChatMessage>(
        "INSERT INTO ai_chat_messages (user_id, session_id, role, content)
         VALUES ($1, $2, 'assistant', $3)
         RETURNING id, session_id, role, content, created_at"
    )
    .bind(claims.sub)
    .bind(sid)
    .bind(&ai_response)
    .fetch_one(&state.db)
    .await?;

    // Update session timestamp
    sqlx::query!(
        "UPDATE ai_chat_sessions SET updated_at = NOW() WHERE id = $1",
        sid
    )
    .execute(&state.db)
    .await?;

    Ok(Json(ChatResponse {
        session_id: sid,
        user_message: user_msg,
        assistant_message: assistant_msg,
    }))
}

async fn generate_ai_response(message: &str, db: &Pool<Postgres>) -> String {
    // 1. Fetch AI Configuration from System Settings
    let ai_config = sqlx::query!(
        "SELECT ai_model, ai_system_prompt FROM system_settings LIMIT 1"
    )
    .fetch_one(db)
    .await;

    let (model, prompt) = match ai_config {
        Ok(c) => (c.ai_model.unwrap_or_else(|| "gemini-1.5-flash".to_string()), c.ai_system_prompt.unwrap_or_default()),
        Err(_) => ("gemini-1.5-flash".to_string(), "".to_string()),
    };

    let msg = message.to_lowercase();

    // 2. Logic for Internal Mode or Fallback
    if model == "internal-heuristic" {
        if msg.contains("doctor") || msg.contains("appointment") {
            return "I can help you find a doctor! You can search by specialty in the platform dashboard.".to_string();
        }
        if msg.contains("pharmacy") || msg.contains("medicine") {
            return "Medicata connects you with hundreds of local pharmacies. Just upload your prescription!".to_string();
        }
        return format!("(Internal Mode) {} - I am here to help you navigate Medicata.", prompt);
    }

    // 3. Real External Logic Check (Placeholder for real API call)
    // If model starts with 'gemini' and we had an API key, we would use reqwest here.
    // For now, we enhance the "Smart Mock" to show it's working with the prompt.
    
    if msg.contains("medi") || msg.contains("who are you") {
        return format!("I am Medi. My current system prompt is: '{}'", prompt);
    }

    if msg.contains("how many doctors") {
         let count = sqlx::query_scalar!(
            "SELECT count(*) FROM users WHERE role = 'doctor'"
        )
        .fetch_one(db)
        .await
        .unwrap_or(Some(0))
        .unwrap_or(0);
        return format!("We currently have {} registered doctors on the platform.", count);
    }

    "I'm processing your request using the configured AI engine. How can I assist you with your health today?".to_string()
}

pub async fn get_chat_history(
    State(state): State<AppState>,
    claims: Claims,
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
    pub updated_at: chrono::DateTime<Utc>,
}

pub async fn get_sessions(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<ChatSession>>, AppError> {
    let sessions = sqlx::query_as::<_, ChatSession>(
        "SELECT id, title, is_active, created_at, updated_at
         FROM ai_chat_sessions
         WHERE user_id = $1 AND is_active = true
         ORDER BY updated_at DESC"
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(sessions))
}

pub async fn delete_session(
    State(state): State<AppState>,
    claims: Claims,
    Path(session_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!(
        "UPDATE ai_chat_sessions SET is_active = false WHERE id = $1 AND user_id = $2",
        session_id,
        claims.sub
    )
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "status": "success" })))
}
