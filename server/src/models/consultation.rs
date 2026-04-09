use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

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
    pub symptoms: Option<String>,
    pub doctor_notes: Option<String>,
    pub cancellation_reason: Option<String>,
    pub files_reports: Option<String>, // From UserJourney.md: Upload Files / Reports
    pub additional_notes: Option<String>, // From UserJourney.md: Additional Notes / Requirements
    pub is_follow_up: Option<bool>, // From UserJourney.md: Optionally flag follow-up consultations
    pub patient_rating: Option<i32>, // From UserJourney.md: Provide feedback / rating for doctor
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct BookConsultationRequest {
    pub doctor_id: Uuid,
    pub scheduled_at: DateTime<Utc>,
    pub mode: ConsultationMode,
    pub reason: String,
    pub symptoms: Option<String>,
    pub files_reports: Option<String>, // From UserJourney.md: Upload Files / Reports
    pub additional_notes: Option<String>, // From UserJourney.md: Additional Notes / Requirements
}

#[derive(Debug, Deserialize)]
pub struct UpdateConsultationStatusRequest {
    pub status: ConsultationStatus,
    pub cancellation_reason: Option<String>,
    pub is_follow_up: Option<bool>, // From UserJourney.md: Optionally flag follow-up consultations
}

#[derive(Debug, Deserialize)]
pub struct AddConsultationNotesRequest {
    pub notes: String,
}

#[derive(Debug, Deserialize)]
pub struct AddPatientFeedbackRequest {
    pub rating: i32, // From UserJourney.md: Provide feedback / rating for doctor
}
