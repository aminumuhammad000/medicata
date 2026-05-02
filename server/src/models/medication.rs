use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct MedicationReminder {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub prescription_id: Option<Uuid>,
    pub medication_name: String,
    pub dosage: Option<String>,
    pub frequency: String,
    pub times: Vec<String>,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateReminderRequest {
    pub prescription_id: Option<Uuid>,
    pub medication_name: String,
    pub dosage: Option<String>,
    pub frequency: String,
    pub times: Vec<String>,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReminderStatusRequest {
    pub is_active: bool,
}
