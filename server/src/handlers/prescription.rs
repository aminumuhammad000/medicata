use axum::{
    extract::{State, Path, Query},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::{
        prescription::{Prescription, CreatePrescriptionRequest, FullPrescriptionResponse, PrescriptionItem, Drug, PrescriptionItemWithDrug},
        user::UserRole,
    },
    state::AppState,
    auth_utils::Claims,
};
use chrono::{Utc, Duration};

pub async fn search_drugs(
    State(state): State<AppState>,
    Query(params): Query<serde_json::Value>, // Generic query for now
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
        "INSERT INTO prescriptions (consultation_id, patient_id, doctor_id, expiry_date) 
         VALUES ($1, $2, $3, $4) 
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

    // In a real app, I'd use a single join query. For MVP, I'll do it separately for clarity if needed.
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
