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
    pub qr_code_token: Uuid, // From UserJourney.md: Unique prescription ID / QR Code for verification
    pub expiry_date: NaiveDate, // From UserJourney.md: Prescription Expiry Date
    pub is_verified: bool, // From UserJourney.md: Verification status
    pub is_shared: bool, // From UserJourney.md: Sharing functionality
    pub shared_with: Option<String>, // From UserJourney.md: Share with other users
    pub is_dispensed: bool, // From UserJourney.md: Track if prescription was filled
    pub dispensed_at: Option<DateTime<Utc>>, // Timestamp when prescription was dispensed
    pub created_at: DateTime<Utc>,

    // Add these fields for UI convenience
    #[sqlx(default)]
    pub doctor_name: Option<String>,
    #[sqlx(default)]
    pub patient_name: Option<String>,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PrescriptionItem {
    pub id: Uuid,
    pub prescription_id: Uuid,
    pub drug_id: Uuid,
    pub dosage: String, // From UserJourney.md: Dosage
    pub frequency: String, // From UserJourney.md: Frequency
    pub duration_days: i32, // From UserJourney.md: Duration / Number of Days
    pub quantity: i32, // From UserJourney.md: Quantity
    pub instructions: Option<String>, // From UserJourney.md: Instructions / Notes
}

#[derive(Debug, Deserialize)]
pub struct CreatePrescriptionRequest {
    pub consultation_id: Option<Uuid>,
    pub patient_id: Uuid,
    pub items: Vec<CreatePrescriptionItemRequest>,
    pub expiry_days: i64, // From UserJourney.md: Expiry date (e.g., 30 days)
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

#[derive(Debug, Deserialize)]
pub struct SharePrescriptionRequest {
    pub share_with: String, // From UserJourney.md: Share with another Medicata user
    #[allow(dead_code)]
    pub export_format: Option<String>, // From UserJourney.md: Export as Prescription Card (PDF/image)
}

#[derive(Debug, Deserialize)]
pub struct ReorderPrescriptionRequest {
    pub prescription_id: Uuid, // From UserJourney.md: Buy Again creates new order using same prescription
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
