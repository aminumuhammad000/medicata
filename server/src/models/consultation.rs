use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
// Removing unused User import

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "consultation_mode", rename_all = "snake_case")]
pub enum ConsultationMode {
    Chat,
    Video,
    Audio,
    InPerson,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "consultation_status", rename_all = "snake_case")]
pub enum ConsultationStatus {
    Pending,
    Accepted,
    Completed,
    Cancelled,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Consultation {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub doctor_id: Uuid,
    pub scheduled_at: DateTime<Utc>,
    pub mode: ConsultationMode,
    pub status: ConsultationStatus,
    pub reason: String,
    pub doctor_notes: Option<String>,
    pub cancellation_reason: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct BookConsultationRequest {
    pub doctor_id: Uuid,
    pub scheduled_at: DateTime<Utc>,
    pub mode: ConsultationMode,
    pub reason: String,
    pub symptoms: Option<String>,
    #[allow(dead_code)]
    pub additional_notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateConsultationStatusRequest {
    pub status: ConsultationStatus,
    pub cancellation_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddConsultationNotesRequest {
    pub notes: String,
}
