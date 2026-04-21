use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub id: Uuid,
    pub consultation_id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct SendMessageRequest {
    pub content: String,
}
