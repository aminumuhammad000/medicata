use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Drug {
    pub id: Uuid,
    pub name: String,
    pub category: Option<String>,
    pub brand: Option<String>,
    pub strength: Option<String>,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Prescription {
    pub id: Uuid,
    pub consultation_id: Option<Uuid>,
    pub patient_id: Uuid,
    pub doctor_id: Uuid,
    pub qr_code_token: Uuid,
    pub expiry_date: NaiveDate,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PrescriptionItem {
    pub id: Uuid,
    pub prescription_id: Uuid,
    pub drug_id: Uuid,
    pub dosage: String,
    pub frequency: String,
    pub duration_days: i32,
    pub quantity: i32,
    pub instructions: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePrescriptionRequest {
    pub consultation_id: Option<Uuid>,
    pub patient_id: Uuid,
    pub items: Vec<CreatePrescriptionItemRequest>,
    pub expiry_days: i64, // e.g., 30 days
}

#[derive(Debug, Deserialize)]
pub struct CreatePrescriptionItemRequest {
    pub drug_id: Uuid,
    pub dosage: String,
    pub frequency: String,
    pub duration_days: i32,
    pub quantity: i32,
    pub instructions: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct FullPrescriptionResponse {
    pub prescription: Prescription,
    pub items: Vec<PrescriptionItemWithDrug>,
}

#[derive(Debug, Serialize)]
pub struct PrescriptionItemWithDrug {
    pub item: PrescriptionItem,
    pub drug: Drug,
}
