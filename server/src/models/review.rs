use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Review {
    pub id: Uuid,
    pub reviewer_id: Uuid,
    pub target_id: Uuid,
    pub rating: i32,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewRequest {
    pub target_id: Uuid,
    pub rating: i32,
    pub comment: Option<String>,
}
