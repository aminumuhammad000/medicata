use axum::{
    extract::{State, Path, Query},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::{
        prescription::{Prescription, CreatePrescriptionRequest, FullPrescriptionResponse, PrescriptionItem, Drug, PrescriptionItemWithDrug, SharePrescriptionRequest, ReorderPrescriptionRequest},
        user::UserRole,
    },
    state::AppState,
    auth_utils::Claims,
    handlers::notification::create_notification,
};
use chrono::{Utc, Duration};
use uuid::Uuid;

// From UserJourney.md Prescription Workflow: Drug Selection
#[allow(dead_code)]
pub async fn search_drugs(
    State(state): State<AppState>,
    Query(params): Query<serde_json::Value>,
) -> Result<Json<Vec<Drug>>, AppError> {
    let name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
    
    let drugs = sqlx::query_as::<_, Drug>(
        "SELECT * FROM drugs WHERE name ILIKE $1 LIMIT 50"
    )
    .bind(format!("%{}%", name))
    .fetch_all(&state.db)
    .await?;

    Ok(Json(drugs))
}

// From UserJourney.md Prescription Workflow: Create Prescription
pub async fn create_prescription(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreatePrescriptionRequest>,
) -> Result<Json<Prescription>, AppError> {
    if claims.role != UserRole::Doctor {
        return Err(AppError::Forbidden("Only doctors can issue prescriptions".to_string()));
    }

    let mut tx = state.db.begin().await?;

    let expiry_date = Utc::now()
        .checked_add_signed(Duration::days(payload.expiry_days))
        .unwrap()
        .date_naive();

    let prescription = sqlx::query_as::<_, Prescription>(
        "INSERT INTO prescriptions (consultation_id, patient_id, doctor_id, expiry_date, is_verified) 
         VALUES ($1, $2, $3, $4, true) 
         RETURNING *"
    )
    .bind(payload.consultation_id)
    .bind(payload.patient_id)
    .bind(claims.sub)
    .bind(expiry_date)
    .fetch_one(&mut *tx)
    .await?;

    for item in payload.items {
        sqlx::query(
            "INSERT INTO prescription_items (prescription_id, drug_id, dosage, frequency, duration_days, quantity, instructions) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)"
        )
        .bind(prescription.id)
        .bind(item.drug_id)
        .bind(item.dosage)
        .bind(item.frequency)
        .bind(item.duration_days)
        .bind(item.quantity)
        .bind(item.instructions)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    // From UserJourney.md: Send notification to patient
    let _ = create_notification(
        &state,
        prescription.patient_id,
        "New Prescription",
        "You have received a new prescription",
        "prescription"
    ).await;

    Ok(Json(prescription))
}

pub async fn get_prescription_details(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<FullPrescriptionResponse>, AppError> {
    let prescription = sqlx::query_as::<_, Prescription>("SELECT * FROM prescriptions WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    let items = sqlx::query(
        "SELECT pi.*, d.name as drug_name, d.category as drug_category, d.brand as drug_brand, d.strength as drug_strength
         FROM prescription_items pi
         JOIN drugs d ON pi.drug_id = d.id
         WHERE pi.prescription_id = $1"
    )
    .bind(prescription.id)
    .fetch_all(&state.db)
    .await?;

    let detailed_items = items.into_iter().map(|i| {
        use sqlx::Row;
        PrescriptionItemWithDrug {
            item: PrescriptionItem {
                id: i.get("id"),
                prescription_id: i.get("prescription_id"),
                drug_id: i.get("drug_id"),
                dosage: i.get("dosage"),
                frequency: i.get("frequency"),
                duration_days: i.get("duration_days"),
                quantity: i.get("quantity"),
                instructions: i.get("instructions"),
            },
            drug: Drug {
                id: i.get("drug_id"),
                name: i.get("drug_name"),
                category: i.get("drug_category"),
                brand: i.get("drug_brand"),
                strength: i.get("drug_strength"),
            },
        }
    }).collect();

    Ok(Json(FullPrescriptionResponse {
        prescription,
        items: detailed_items,
    }))
}

// From UserJourney.md Prescription Sharing Workflow: Share Prescription
pub async fn share_prescription(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<SharePrescriptionRequest>,
) -> Result<Json<Prescription>, AppError> {
    let prescription = sqlx::query_as::<_, Prescription>(
        "UPDATE prescriptions SET is_shared = true, shared_with = $1 
         WHERE id = $2 AND (doctor_id = $3 OR patient_id = $3) 
         RETURNING *"
    )
    .bind(&payload.share_with)
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(prescription))
}

// From UserJourney.md Prescription Workflow: Reorder Prescription (Buy Again)
pub async fn reorder_prescription(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ReorderPrescriptionRequest>,
) -> Result<Json<Prescription>, AppError> {
    if claims.role != UserRole::Patient {
        return Err(AppError::Forbidden("Only patients can reorder prescriptions".to_string()));
    }

    // Verify the prescription belongs to the patient
    let original = sqlx::query_as::<_, Prescription>(
        "SELECT * FROM prescriptions WHERE id = $1 AND patient_id = $2"
    )
    .bind(payload.prescription_id)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Prescription not found".to_string()))?;

    // Create a new prescription based on the original
    let new_expiry = Utc::now()
        .checked_add_signed(Duration::days(30))
        .unwrap()
        .date_naive();

    let new_prescription = sqlx::query_as::<_, Prescription>(
        "INSERT INTO prescriptions (patient_id, doctor_id, expiry_date, is_verified) 
         VALUES ($1, $2, $3, true) 
         RETURNING *"
    )
    .bind(claims.sub)
    .bind(original.doctor_id)
    .bind(new_expiry)
    .fetch_one(&state.db)
    .await?;

    // Copy all items from the original prescription
    let items = sqlx::query_as::<_, PrescriptionItem>(
        "SELECT * FROM prescription_items WHERE prescription_id = $1"
    )
    .bind(payload.prescription_id)
    .fetch_all(&state.db)
    .await?;

    for item in items {
        sqlx::query(
            "INSERT INTO prescription_items (prescription_id, drug_id, dosage, frequency, duration_days, quantity, instructions) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)"
        )
        .bind(new_prescription.id)
        .bind(item.drug_id)
        .bind(item.dosage)
        .bind(item.frequency)
        .bind(item.duration_days)
        .bind(item.quantity)
        .bind(item.instructions)
        .execute(&state.db)
        .await?;
    }

    Ok(Json(new_prescription))
}

pub async fn get_my_prescriptions(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Prescription>>, AppError> {
    let query = match claims.role {
        UserRole::Patient => 
            "SELECT p.*, u.full_name as doctor_name 
             FROM prescriptions p
             JOIN users u ON p.doctor_id = u.id
             WHERE p.patient_id = $1 
             ORDER BY p.created_at DESC",
        UserRole::Doctor => 
            "SELECT p.*, u.full_name as patient_name 
             FROM prescriptions p
             JOIN users u ON p.patient_id = u.id
             WHERE p.doctor_id = $1 
             ORDER BY p.created_at DESC",
        UserRole::Pharmacy =>
            "SELECT p.*, u.full_name as patient_name 
             FROM prescriptions p
             JOIN users u ON p.patient_id = u.id
             WHERE p.is_shared = true AND p.shared_with = (SELECT full_name FROM users WHERE id = $1)
             ORDER BY p.created_at DESC",
        _ => return Err(AppError::Forbidden("Unauthorized role for prescriptions".to_string())),
    };

    let prescriptions = sqlx::query_as::<_, Prescription>(query)
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await?;

    Ok(Json(prescriptions))
}

pub async fn verify_prescription_by_token(
    State(state): State<AppState>,
    Path(token): Path<uuid::Uuid>,
) -> Result<Json<FullPrescriptionResponse>, AppError> {
    println!("[DEBUG] Verifying prescription with token: {}", token);

    // 1. Fetch prescription by qr_code_token
    let prescription = sqlx::query_as::<_, Prescription>(
        "SELECT p.*, u_doc.full_name as doctor_name, u_pat.full_name as patient_name 
         FROM prescriptions p
         JOIN users u_doc ON p.doctor_id = u_doc.id
         JOIN users u_pat ON p.patient_id = u_pat.id
         WHERE p.qr_code_token = $1"
    )
    .bind(token)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invalid prescription token".to_string()))?;

    // 2. Fetch items with drugs
    let items = sqlx::query(
        "SELECT pi.*, d.name as drug_name, d.category as drug_category, d.brand as drug_brand, d.strength as drug_strength
         FROM prescription_items pi
         JOIN drugs d ON pi.drug_id = d.id
         WHERE pi.prescription_id = $1"
    )
    .bind(prescription.id)
    .fetch_all(&state.db)
    .await?;

    let detailed_items = items.into_iter().map(|i| {
        use sqlx::Row;
        PrescriptionItemWithDrug {
            item: PrescriptionItem {
                id: i.get("id"),
                prescription_id: i.get("prescription_id"),
                drug_id: i.get("drug_id"),
                dosage: i.get("dosage"),
                frequency: i.get("frequency"),
                duration_days: i.get("duration_days"),
                quantity: i.get("quantity"),
                instructions: i.get("instructions"),
            },
            drug: Drug {
                id: i.get("drug_id"),
                name: i.get("drug_name"),
                category: i.get("drug_category"),
                brand: i.get("drug_brand"),
                strength: i.get("drug_strength"),
            },
        }
    }).collect();

    Ok(Json(FullPrescriptionResponse {
        prescription,
        items: detailed_items,
    }))
}

pub async fn dispense_prescription(
    State(state): State<AppState>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> Result<Json<Prescription>, AppError> {
    let prescription = sqlx::query_as::<_, Prescription>(
        "UPDATE prescriptions 
         SET is_dispensed = true, dispensed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND is_dispensed = false
         RETURNING *"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(prescription))
}
