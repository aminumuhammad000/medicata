use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::{Row, Postgres};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::state::AppState;
use crate::error::AppError;
use crate::models::user::{User, UserRole};
use crate::auth_utils::Claims;

#[derive(Debug, Serialize)]
pub struct AdminStats {
    pub total_patients: i64,
    pub total_doctors: i64,
    pub total_pharmacies: i64,
    pub total_orders: i64,
    pub total_consultations: i64,
    pub total_revenue: i64,
    pub pending_verifications: i64,
}

#[derive(Debug, Deserialize)]
pub struct VerifyDoctorRequest {
    pub status: String, // "approved" or "rejected"
    pub notes: Option<String>,
    pub reason: Option<String>,
}


pub async fn get_admin_stats(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
) -> Result<Json<AdminStats>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied: Admin only".to_string()));
    }
    // ... existing logic
    let patient_count = sqlx::query("SELECT COUNT(*) FROM users WHERE role = 'patient'")
        .fetch_one(&state.db).await?.get::<i64, _>(0);
        
    let doctor_count = sqlx::query("SELECT COUNT(*) FROM users WHERE role = 'doctor'")
        .fetch_one(&state.db).await?.get::<i64, _>(0);
        
    let pharmacy_count = sqlx::query("SELECT COUNT(*) FROM users WHERE role = 'pharmacy'")
        .fetch_one(&state.db).await?.get::<i64, _>(0);
        
    let order_count = sqlx::query("SELECT COUNT(*) FROM pharmacy_orders")
        .fetch_one(&state.db).await?.get::<i64, _>(0);
        
    let consultation_count = sqlx::query("SELECT COUNT(*) FROM consultations")
        .fetch_one(&state.db).await?.get::<i64, _>(0);
        
    let revenue = sqlx::query("SELECT SUM(amount) FROM wallet_transactions WHERE transaction_type = 'payment' AND status = 'completed'")
        .fetch_one(&state.db).await?.get::<Option<i64>, _>(0).unwrap_or(0);
        
    let pending_docs = sqlx::query("SELECT COUNT(*) FROM users WHERE role = 'doctor' AND (verification_status = 'pending' OR verification_status IS NULL)")
        .fetch_one(&state.db).await?.get::<i64, _>(0);

    Ok(Json(AdminStats {
        total_patients: patient_count,
        total_doctors: doctor_count,
        total_pharmacies: pharmacy_count,
        total_orders: order_count,
        total_consultations: consultation_count,
        total_revenue: revenue,
        pending_verifications: pending_docs,
    }))
}

pub async fn get_pending_doctors(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied: Admin only".to_string()));
    }
    let rows = sqlx::query_as::<Postgres, User>(
        "SELECT * FROM users WHERE role = 'doctor' AND (verification_status = 'pending' OR verification_status IS NULL) ORDER BY created_at DESC"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows))
}

pub async fn verify_doctor(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<VerifyDoctorRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied: Admin only".to_string()));
    }
    let is_verified = payload.status == "approved";
    
    sqlx::query(
        "UPDATE users SET verification_status = $1, is_verified = $2, updated_at = NOW() WHERE id = $3"
    )
    .bind(&payload.status)
    .bind(is_verified)
    .bind(id)
    .execute(&state.db)
    .await?;

    // Notify the doctor
    let message = if is_verified {
        "Your medical profile has been verified. You can now start accepting consultations.".to_string()
    } else {
        let reason = payload.reason.as_deref().or(payload.notes.as_deref()).unwrap_or("Please review your submitted documents and reapply.");
        format!("Your medical profile verification was rejected. Reason: {}", reason)
    };

    let _ = crate::handlers::notification::create_notification(
        &state,
        id,
        "Profile Verification Update",
        &message,
        "system"
    ).await;

    Ok(Json(serde_json::json!({ "status": "success", "message": format!("Doctor status updated to {}", payload.status) })))
}

pub async fn trigger_test_emergency(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    use crate::websocket::{WsMessage, broadcast_message};
    
    let alert = WsMessage::EmergencyAlert {
        id: Uuid::new_v4(),
        patient_name: "Test Patient".to_string(),
        location: "Lagos, Nigeria".to_string(),
        message: "Severe chest pain - Immediate assistance required!".to_string(),
        time: "Just now".to_string(),
    };

    broadcast_message(&state, alert);

    Ok(Json(serde_json::json!({ "status": "success", "message": "Emergency alert broadcast successfully" })))
}

#[derive(Debug, Deserialize)]
pub struct PatientsQuery {
    pub q: Option<String>,
    pub status: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}


#[derive(Debug, Serialize)]
pub struct PatientRecord {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    pub phone_number: Option<String>,
    pub profile_photo: Option<String>,
    pub is_verified: bool,
    pub created_at: DateTime<Utc>,
    pub total_consultations: i64,
    pub total_orders: i64,
}

#[derive(Debug, Serialize)]
pub struct PatientsResponse {
    pub patients: Vec<PatientRecord>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

pub async fn get_all_patients(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Query(params): Query<PatientsQuery>,
) -> Result<Json<PatientsResponse>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied: Admin only".to_string()));
    }

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;
    let search = format!("%{}%", params.q.as_deref().unwrap_or(""));

    let status_filter = match params.status.as_deref() {
        Some("verified") => "AND u.is_verified = true",
        Some("unverified") => "AND u.is_verified = false",
        _ => "",
    };

    let query_str = format!(
        r#"
        SELECT 
            u.id, u.full_name, u.email, u.phone_number, u.profile_photo, u.is_verified, u.created_at,
            COALESCE((SELECT COUNT(*) FROM consultations c WHERE c.patient_id = u.id), 0)::BIGINT as total_consultations,
            COALESCE((SELECT COUNT(*) FROM pharmacy_orders o WHERE o.patient_id = u.id), 0)::BIGINT as total_orders
        FROM users u
        WHERE u.role = 'patient'
          AND (u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.phone_number ILIKE $1)
          {}
        ORDER BY u.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        status_filter
    );

    let rows = sqlx::query(&query_str)
        .bind(&search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let count_query_str = format!(
        "SELECT COUNT(*) FROM users u WHERE role = 'patient' AND (full_name ILIKE $1 OR email ILIKE $1 OR phone_number ILIKE $1) {}",
        status_filter
    );

    let total: i64 = sqlx::query_scalar(&count_query_str)
        .bind(&search)
        .fetch_one(&state.db)
        .await?;


    let patients: Vec<PatientRecord> = rows.into_iter().map(|row| PatientRecord {
        id: row.get("id"),
        full_name: row.get("full_name"),
        email: row.get("email"),
        phone_number: row.get("phone_number"),
        profile_photo: row.get("profile_photo"),
        is_verified: row.get("is_verified"),
        created_at: row.get("created_at"),
        total_consultations: row.get("total_consultations"),
        total_orders: row.get("total_orders"),
    }).collect();

    Ok(Json(PatientsResponse { patients, total, page, per_page }))
}

pub async fn delete_patient(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied: Admin only".to_string()));
    }

    // Since we don't have a suspension flag, we attempt a hard delete.
    // If it fails due to foreign key constraints, we return a 400 error letting the admin know.
    let result = sqlx::query("DELETE FROM users WHERE id = $1 AND role = 'patient'")
        .bind(id)
        .execute(&state.db)
        .await;

    match result {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err(AppError::NotFound("Patient not found".to_string()));
            }
            Ok(Json(serde_json::json!({ "status": "success", "message": "Patient deleted successfully" })))
        }
        Err(sqlx::Error::Database(err)) if err.is_foreign_key_violation() => {
            Err(AppError::BadRequest("Cannot delete patient: This user has active consultations, prescriptions, or orders. To preserve medical records, deletion is blocked.".to_string()))
        }
        Err(e) => Err(AppError::Internal(anyhow::anyhow!(e))),
    }

}

#[derive(Debug, Deserialize)]
pub struct DoctorsQuery {
    pub q: Option<String>,
    pub status: Option<String>,
    pub specialty: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct DoctorRecord {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    pub specialty: Option<String>,
    pub medical_license_number: Option<String>,
    pub is_verified: bool,
    pub created_at: DateTime<Utc>,
}


#[derive(Debug, Serialize)]
pub struct DoctorsResponse {
    pub doctors: Vec<DoctorRecord>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

pub async fn get_all_doctors(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Query(params): Query<DoctorsQuery>,
) -> Result<Json<DoctorsResponse>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied: Admin only".to_string()));
    }

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;
    let search = format!("%{}%", params.q.as_deref().unwrap_or(""));

    let status_filter = match params.status.as_deref() {
        Some("verified") => "AND is_verified = true",
        Some("unverified") => "AND is_verified = false",
        _ => "",
    };

    let specialty_filter = params.specialty.as_deref().map_or("".to_string(), |s| {
        if s.trim().is_empty() {
            "".to_string()
        } else {
            format!("AND specialty ILIKE '%{}%'", s.replace("'", "''")) 
        }
    });

    let query_str = format!(
        r#"
        SELECT 
            id, full_name, email, specialty, medical_license_number, is_verified, created_at
        FROM users
        WHERE role = 'doctor'
          AND (full_name ILIKE $1 OR email ILIKE $1 OR medical_license_number ILIKE $1 OR specialty ILIKE $1)
          {}
          {}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        status_filter, specialty_filter
    );

    let rows = sqlx::query(&query_str)
        .bind(&search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let count_query_str = format!(
        "SELECT COUNT(*) FROM users WHERE role = 'doctor' AND (full_name ILIKE $1 OR email ILIKE $1 OR medical_license_number ILIKE $1 OR specialty ILIKE $1) {} {}",
        status_filter, specialty_filter
    );

    let total: i64 = sqlx::query_scalar(&count_query_str)
        .bind(&search)
        .fetch_one(&state.db)
        .await?;


    let doctors: Vec<DoctorRecord> = rows.into_iter().map(|row| DoctorRecord {
        id: row.get("id"),
        full_name: row.get("full_name"),
        email: row.get("email"),
        specialty: row.get("specialty"),
        medical_license_number: row.get("medical_license_number"),
        is_verified: row.get("is_verified"),
        created_at: row.get("created_at"),
    }).collect();

    Ok(Json(DoctorsResponse { doctors, total, page, per_page }))
}

pub async fn delete_doctor(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied: Admin only".to_string()));
    }

    let result = sqlx::query("DELETE FROM users WHERE id = $1 AND role = 'doctor'")
        .bind(id)
        .execute(&state.db)
        .await;

    match result {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err(AppError::NotFound("Doctor not found".to_string()));
            }
            Ok(Json(serde_json::json!({ "status": "success", "message": "Doctor deleted successfully" })))
        }
        Err(sqlx::Error::Database(err)) if err.is_foreign_key_violation() => {
            Err(AppError::BadRequest("Cannot delete doctor: This practitioner has active consultations, prescriptions, or patients assigned. To preserve medical records, deletion is blocked. Please suspend their account instead.".to_string()))
        }
        Err(e) => Err(AppError::Internal(anyhow::anyhow!(e))),
    }
}

#[derive(Debug, Deserialize)]
pub struct InventoryQuery {
    pub q: Option<String>,
    pub category: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct InventoryDrugRecord {
    pub id: Uuid,
    pub name: String,
    pub brand_name: Option<String>,
    pub category: Option<String>,
    pub strength: Option<String>,
    pub image_url: Option<String>,
    pub pharmacy_count: i64,
}

#[derive(Debug, Serialize)]
pub struct InventoryStats {
    pub total: i64,
    pub categories: i64,
    pub new_this_week: i64,
    pub pharmacies_stocking: i64,
}

#[derive(Debug, Serialize)]
pub struct InventoryResponse {
    pub drugs: Vec<InventoryDrugRecord>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub stats: InventoryStats,
}

pub async fn get_inventory(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Query(params): Query<InventoryQuery>,
) -> Result<Json<InventoryResponse>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;
    let search = format!("%{}%", params.q.as_deref().unwrap_or(""));

    let category_filter = params.category.as_deref().map_or("".to_string(), |c| {
        if c.trim().is_empty() {
            "".to_string()
        } else {
            format!("AND d.category ILIKE '%{}%'", c.replace("'", "''"))
        }
    });

    let query_str = format!(
        r#"
        SELECT 
            d.id, d.name, d.brand as brand_name, d.category, d.strength, d.image_url,
            COALESCE((SELECT COUNT(DISTINCT ps.pharmacy_id) FROM pharmacy_stock ps WHERE ps.drug_id = d.id), 0)::BIGINT as pharmacy_count
        FROM drugs d
        WHERE (d.name ILIKE $1 OR d.brand ILIKE $1 OR d.category ILIKE $1)
        {}
        ORDER BY d.name
        LIMIT $2 OFFSET $3
        "#,
        category_filter
    );

    let rows = sqlx::query(&query_str)
        .bind(&search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let count_query_str = format!(
        "SELECT COUNT(*) FROM drugs d WHERE (d.name ILIKE $1 OR d.brand ILIKE $1 OR d.category ILIKE $1) {}",
        category_filter
    );

    let total: i64 = sqlx::query_scalar(&count_query_str)
        .bind(&search)
        .fetch_one(&state.db)
        .await?;

    let drugs: Vec<InventoryDrugRecord> = rows.into_iter().map(|row| InventoryDrugRecord {
        id: row.get("id"),
        name: row.get("name"),
        brand_name: row.get("brand_name"),
        category: row.get("category"),
        strength: row.get("strength"),
        image_url: row.get("image_url"),
        pharmacy_count: row.get("pharmacy_count"),
    }).collect();

    // Aggregate stats (global, not filtered)
    let stats_total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM drugs")
        .fetch_one(&state.db).await.unwrap_or(0);
    let stats_categories: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT category) FROM drugs WHERE category IS NOT NULL")
        .fetch_one(&state.db).await.unwrap_or(0);
    let stats_new_week: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM drugs WHERE created_at >= NOW() - INTERVAL '7 days'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let stats_pharmacies: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT pharmacy_id) FROM pharmacy_stock")
        .fetch_one(&state.db).await.unwrap_or(0);

    let stats = InventoryStats {
        total: stats_total,
        categories: stats_categories,
        new_this_week: stats_new_week,
        pharmacies_stocking: stats_pharmacies,
    };

    Ok(Json(InventoryResponse { drugs, total, page, per_page, stats }))
}

pub async fn add_inventory_item(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Json(payload): Json<crate::handlers::drugs::CreateDrugRequest>,
) -> Result<Json<crate::handlers::drugs::Drug>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let strength = payload.strengths.as_ref().and_then(|s| s.first().cloned());
    let category = payload.category.unwrap_or_else(|| "General".to_string());
    let brand = payload.brand_name.unwrap_or_else(|| "Generic".to_string());

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO drugs (name, category, brand, strength, image_url) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id"
    )
    .bind(&payload.name)
    .bind(&category)
    .bind(&brand)
    .bind(strength)
    .bind(&payload.image_url)
    .fetch_one(&state.db)
    .await?;

    let drug = crate::handlers::drugs::Drug {
        id,
        name: payload.name,
        generic_name: payload.generic_name,
        brand_name: Some(brand),
        category: Some(category),
        description: payload.description,
        dosage_forms: payload.dosage_forms.unwrap_or_default(),
        strengths: payload.strengths.unwrap_or_default(),
        manufacturer: payload.manufacturer,
        requires_prescription: payload.requires_prescription.unwrap_or(true),
        image_url: payload.image_url,
    };

    Ok(Json(drug))
}

pub async fn update_inventory_item(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<crate::handlers::drugs::CreateDrugRequest>,
) -> Result<Json<crate::handlers::drugs::Drug>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let strength = payload.strengths.as_ref().and_then(|s| s.first().cloned());

    sqlx::query(
        "UPDATE drugs 
         SET name = $1, category = $2, brand = $3, strength = $4, image_url = $5 
         WHERE id = $6"
    )
    .bind(&payload.name)
    .bind(payload.category.unwrap_or_else(|| "General".to_string()))
    .bind(payload.brand_name.unwrap_or_else(|| "Generic".to_string()))
    .bind(strength)
    .bind(&payload.image_url)
    .bind(id)
    .execute(&state.db)
    .await?;

    let row = sqlx::query(
        "SELECT id, name, category, brand as brand_name, strength, image_url 
         FROM drugs WHERE id = $1"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    let drug = crate::handlers::drugs::Drug {
        id: row.get("id"),
        name: row.get("name"),
        generic_name: Some(row.get("name")),
        brand_name: row.get("brand_name"),
        category: row.get("category"),
        description: None,
        dosage_forms: vec![],
        strengths: row.get::<Option<String>, _>("strength").map(|s| vec![s]).unwrap_or_default(),
        manufacturer: None,
        requires_prescription: true,
        image_url: row.get("image_url"),
    };

    Ok(Json(drug))
}

pub async fn delete_inventory_item(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    sqlx::query("DELETE FROM drugs WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "status": "success" })))
}

#[derive(Debug, Serialize)]
pub struct PharmacyRecord {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub is_verified: bool,
    pub created_at: DateTime<Utc>,
    pub stock_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct PharmaciesQuery {
    pub q: Option<String>,
    pub status: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct PharmaciesStats {
    pub total: i64,
    pub verified: i64,
    pub pending: i64,
    pub total_skus: i64,
}

#[derive(Debug, Serialize)]
pub struct PharmaciesResponse {
    pub pharmacies: Vec<PharmacyRecord>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub stats: PharmaciesStats,
}

pub async fn get_all_pharmacies(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Query(params): Query<PharmaciesQuery>,

) -> Result<Json<PharmaciesResponse>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;
    let search = format!("%{}%", params.q.as_deref().unwrap_or(""));

    let status_filter = match params.status.as_deref() {
        Some("verified") => "AND u.is_verified = true",
        Some("unverified") => "AND u.is_verified = false",
        _ => "",
    };

    let query_str = format!(
        r#"
        SELECT 
            u.id, 
            COALESCE(u.pharmacy_name, u.full_name) as full_name, 
            u.email, 
            u.phone_number as phone, 
            COALESCE(u.pharmacy_address, u.address) as address, 
            u.is_verified, 
            u.created_at,
            (SELECT COUNT(*) FROM pharmacy_stock ps WHERE ps.pharmacy_id = u.id) as stock_count
        FROM users u
        WHERE u.role = 'pharmacy'
          AND (u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.address ILIKE $1 OR u.pharmacy_name ILIKE $1)
          {}
        ORDER BY u.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        status_filter
    );

    let rows = sqlx::query(&query_str)
        .bind(&search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let count_query_str = format!(
        "SELECT COUNT(*) FROM users u WHERE u.role = 'pharmacy' AND (u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.address ILIKE $1) {}",
        status_filter
    );

    let total: i64 = sqlx::query_scalar(&count_query_str)
        .bind(&search)
        .fetch_one(&state.db)
        .await?;

    let pharmacies: Vec<PharmacyRecord> = rows.into_iter().map(|row| PharmacyRecord {
        id: row.get("id"),
        full_name: row.get("full_name"),
        email: row.get("email"),
        phone: row.get("phone"),
        address: row.get("address"),
        is_verified: row.get("is_verified"),
        created_at: row.get("created_at"),
        stock_count: row.get("stock_count"),
    }).collect();

    // Aggregate stats
    let stats_total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role = 'pharmacy'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let stats_verified: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role = 'pharmacy' AND is_verified = true")
        .fetch_one(&state.db).await.unwrap_or(0);
    let stats_unverified: i64 = stats_total - stats_verified;
    let stats_total_skus: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pharmacy_stock")
        .fetch_one(&state.db).await.unwrap_or(0);

    let stats = PharmaciesStats {
        total: stats_total,
        verified: stats_verified,
        pending: stats_unverified,
        total_skus: stats_total_skus,
    };

    Ok(Json(PharmaciesResponse { pharmacies, total, page, per_page, stats }))
}

pub async fn delete_pharmacy(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let result = sqlx::query("DELETE FROM users WHERE id = $1 AND role = 'pharmacy'")
        .bind(id)
        .execute(&state.db)
        .await;

    match result {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err(AppError::NotFound("Pharmacy not found".to_string()));
            }
            Ok(Json(serde_json::json!({ "status": "success" })))
        }
        Err(sqlx::Error::Database(err)) if err.is_foreign_key_violation() => {
            Err(AppError::BadRequest("Cannot delete pharmacy: They have active orders or historical database locks. To preserve medical records, deletion is blocked.".to_string()))
        }
        Err(e) => Err(AppError::Internal(anyhow::anyhow!(e))),
    }
}


#[derive(Debug, Serialize)]
pub struct OrderRecord {
    pub id: Uuid,
    pub patient_name: String,
    pub pharmacy_name: String,
    pub total_amount: i64,
    pub status: String,
    pub payment_status: String,
    pub created_at: DateTime<Utc>,
    pub items_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct OrdersQuery {
    pub q: Option<String>,
    pub status: Option<String>,
    pub date_range: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct OrdersStats {
    pub total: i64,
    pub revenue: i64,
    pub processing: i64,
    pub delivered: i64,
}

#[derive(Debug, Serialize)]
pub struct OrdersResponse {
    pub orders: Vec<OrderRecord>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub stats: OrdersStats,
}

pub async fn get_all_orders(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Query(params): Query<OrdersQuery>,
) -> Result<Json<OrdersResponse>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;
    let search = format!("%{}%", params.q.as_deref().unwrap_or(""));

    let status_filter = match params.status.as_deref() {
        Some("pending") | Some("processing") | Some("shipped") | Some("delivered") | Some("cancelled") => {
            format!("AND po.status = '{}'", params.status.as_deref().unwrap())
        },
        _ => "".to_string(),
    };

    let date_filter = match params.date_range.as_deref() {
        Some("7days") => "AND po.created_at >= NOW() - INTERVAL '7 days'",
        Some("30days") => "AND po.created_at >= NOW() - INTERVAL '30 days'",
        Some("this_month") => "AND date_trunc('month', po.created_at) = date_trunc('month', NOW())",
        _ => "",
    };

    let base_query = format!(
        r#"
        FROM pharmacy_orders po
        JOIN users u_p ON po.patient_id = u_p.id
        JOIN users u_ph ON po.pharmacy_id = u_ph.id
        WHERE (u_p.full_name ILIKE $1 
           OR u_ph.pharmacy_name ILIKE $1 
           OR u_ph.full_name ILIKE $1
           OR po.id::text ILIKE $1)
        {} {}
        "#,
        status_filter, date_filter
    );

    let query_str = format!(
        "SELECT po.id, u_p.full_name as patient_name, COALESCE(u_ph.pharmacy_name, u_ph.full_name) as pharmacy_name, 
        COALESCE((SELECT SUM(oi.price * oi.quantity) FROM order_items oi WHERE oi.order_id = po.id), 0)::bigint as total_amount, 
        po.status::text, po.payment_status, po.created_at, 
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = po.id) as items_count 
        {} ORDER BY po.created_at DESC LIMIT $2 OFFSET $3",
        base_query
    );

    let rows = sqlx::query(&query_str)
        .bind(&search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let count_query = format!("SELECT COUNT(*) {}", base_query);
    let total: i64 = sqlx::query_scalar(&count_query)
        .bind(&search)
        .fetch_one(&state.db)
        .await?;

    let orders: Vec<OrderRecord> = rows.into_iter().map(|row| OrderRecord {
        id: row.get("id"),
        patient_name: row.get("patient_name"),
        pharmacy_name: row.get("pharmacy_name"),
        total_amount: row.get("total_amount"),
        status: row.get("status"),
        payment_status: row.get("payment_status"),
        created_at: row.get("created_at"),
        items_count: row.get("items_count"),
    }).collect();

    let stats_total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pharmacy_orders").fetch_one(&state.db).await.unwrap_or(0);
    let stats_processing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pharmacy_orders WHERE status = 'processing'").fetch_one(&state.db).await.unwrap_or(0);
    let stats_delivered: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pharmacy_orders WHERE status = 'delivered'").fetch_one(&state.db).await.unwrap_or(0);
    
    // Revenue sum across paid orders
    let stats_revenue: Option<i64> = sqlx::query_scalar(
        r#"
        SELECT SUM(oi.price * oi.quantity)
        FROM order_items oi
        JOIN pharmacy_orders po ON oi.order_id = po.id
        WHERE po.payment_status = 'paid'
        "#
    ).fetch_one(&state.db).await.unwrap_or(None);

    let stats = OrdersStats {
        total: stats_total,
        revenue: stats_revenue.unwrap_or(0),
        processing: stats_processing,
        delivered: stats_delivered,
    };

    Ok(Json(OrdersResponse { orders, total, page, per_page, stats }))
}

pub async fn admin_cancel_order(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let result = sqlx::query(
        "UPDATE pharmacy_orders SET status = 'cancelled', payment_status = 'refunded' WHERE id = $1"
    )
    .bind(id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Order not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "status": "success" })))
}

#[derive(Debug, Serialize)]
pub struct MonthlyRevenue {
    pub month: String,
    pub amount: i64,
}

#[derive(Debug, Serialize)]
pub struct PharmacyRevenue {
    pub name: String,
    pub amount: i64,
    pub order_count: i64,
}

#[derive(Debug, Serialize)]
pub struct StatusRevenue {
    pub status: String,
    pub amount: i64,
}

#[derive(Debug, Serialize)]
pub struct RevenueStats {
    pub total_revenue: i64,
    pub monthly_revenue: Vec<MonthlyRevenue>,
    pub pharmacy_performance: Vec<PharmacyRevenue>,
    pub revenue_by_status: Vec<StatusRevenue>,
}

pub async fn get_revenue_stats(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
) -> Result<Json<RevenueStats>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    // 1. Total Revenue
    let total_revenue = sqlx::query_scalar(
        "SELECT COALESCE(SUM(oi.price * oi.quantity), 0)::BIGINT 
         FROM pharmacy_orders po
         JOIN order_items oi ON oi.order_id = po.id
         WHERE po.payment_status = 'paid'"
    )
    .fetch_one(&state.db)
    .await?;

    // 2. Monthly Revenue (Last 6 Months)
    let monthly_rows = sqlx::query(
        r#"
        SELECT 
            TO_CHAR(po.created_at, 'Mon YYYY') as month, 
            SUM(oi.price * oi.quantity)::BIGINT as amount,
            DATE_TRUNC('month', po.created_at) as month_date
        FROM pharmacy_orders po
        JOIN order_items oi ON oi.order_id = po.id
        WHERE po.payment_status = 'paid'
          AND po.created_at > NOW() - INTERVAL '12 months'
        GROUP BY 1, 3
        ORDER BY 3 ASC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    let monthly_revenue = monthly_rows.into_iter().map(|row| MonthlyRevenue {
        month: row.get("month"),
        amount: row.get("amount"),
    }).collect();

    // 3. Pharmacy Performance (Top 5)
    let pharmacy_rows = sqlx::query(
        r#"
        SELECT 
            COALESCE(u.pharmacy_name, u.full_name) as name, 
            SUM(oi.price * oi.quantity)::BIGINT as amount,
            COUNT(DISTINCT po.id) as order_count
        FROM users u
        JOIN pharmacy_orders po ON po.pharmacy_id = u.id
        JOIN order_items oi ON oi.order_id = po.id
        WHERE po.payment_status = 'paid'
        GROUP BY u.id, u.pharmacy_name, u.full_name
        ORDER BY amount DESC
        LIMIT 5
        "#
    )
    .fetch_all(&state.db)
    .await?;

    let pharmacy_performance = pharmacy_rows.into_iter().map(|row| PharmacyRevenue {
        name: row.get("name"),
        amount: row.get("amount"),
        order_count: row.get("order_count"),
    }).collect();

    // 4. Revenue by Status
    let status_rows = sqlx::query(
        r#"
        SELECT 
            po.status::text as status, 
            SUM(oi.price * oi.quantity)::BIGINT as amount
        FROM pharmacy_orders po
        JOIN order_items oi ON oi.order_id = po.id
        GROUP BY po.status
        "#
    )
    .fetch_all(&state.db)
    .await?;

    let revenue_by_status = status_rows.into_iter().map(|row| StatusRevenue {
        status: row.get("status"),
        amount: row.get("amount"),
    }).collect();

    Ok(Json(RevenueStats {
        total_revenue,
        monthly_revenue,
        pharmacy_performance,
        revenue_by_status,
    }))
}

#[derive(Debug, Serialize)]
pub struct PayoutRecord {
    pub id: Uuid,
    pub pharmacy_name: String,
    pub amount: i64,
    pub status: String,
    pub bank_name: Option<String>,
    pub account_number: Option<String>,
    pub account_name: Option<String>,
    pub reference: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn get_all_payouts(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
) -> Result<Json<Vec<PayoutRecord>>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let rows = sqlx::query(
        r#"
        SELECT 
            pp.id, 
            COALESCE(u.pharmacy_name, u.full_name) as pharmacy_name,
            pp.amount, pp.status, pp.bank_name, pp.account_number, pp.account_name, 
            pp.reference, pp.created_at
        FROM pharmacy_payouts pp
        JOIN users u ON pp.pharmacy_id = u.id
        ORDER BY pp.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    let payouts = rows.into_iter().map(|row| PayoutRecord {
        id: row.get("id"),
        pharmacy_name: row.get("pharmacy_name"),
        amount: row.get("amount"),
        status: row.get("status"),
        bank_name: row.get("bank_name"),
        account_number: row.get("account_number"),
        account_name: row.get("account_name"),
        reference: row.get("reference"),
        created_at: row.get("created_at"),
    }).collect();

    Ok(Json(payouts))
}

#[derive(Debug, Deserialize)]
pub struct UpdatePayoutStatusRequest {
    pub status: String,
    pub reference: Option<String>,
}

pub async fn update_payout_status(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdatePayoutStatusRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    sqlx::query(
        "UPDATE pharmacy_payouts SET status = $1, reference = COALESCE($2, reference), updated_at = NOW() WHERE id = $3"
    )
    .bind(&payload.status)
    .bind(&payload.reference)
    .bind(id)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "status": "success" })))
}

#[derive(Debug, Serialize)]
pub struct AdminLabTestRecord {
    pub id: Uuid,
    pub patient_name: String,
    pub doctor_name: String,
    pub test_name: String,
    pub status: String,
    pub result_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn get_all_lab_tests(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
) -> Result<Json<Vec<AdminLabTestRecord>>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let rows = sqlx::query(
        r#"
        SELECT 
            ltr.id, u_p.full_name as patient_name, u_d.full_name as doctor_name,
            ltr.test_name, ltr.status::text, ltr.result_url, ltr.created_at
        FROM lab_test_requests ltr
        JOIN users u_p ON ltr.patient_id = u_p.id
        JOIN users u_d ON ltr.doctor_id = u_d.id
        ORDER BY ltr.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    let tests = rows.into_iter().map(|row| AdminLabTestRecord {
        id: row.get("id"),
        patient_name: row.get("patient_name"),
        doctor_name: row.get("doctor_name"),
        test_name: row.get("test_name"),
        status: row.get("status"),
        result_url: row.get("result_url"),
        created_at: row.get("created_at"),
    }).collect();

    Ok(Json(tests))
}

#[derive(Debug, Deserialize)]
pub struct BroadcastRequest {
    pub scope: String, // "all", "doctors", "patients", "pharmacies"
    pub title: String,
    pub message: String,
}

pub async fn broadcast_notification(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Json(payload): Json<BroadcastRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let target_role = match payload.scope.as_str() {
        "doctors" => Some("doctor"),
        "patients" => Some("patient"),
        "pharmacies" => Some("pharmacy"),
        _ => None,
    };

    let users = if let Some(role) = target_role {
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM users WHERE role = $1")
            .bind(role)
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM users")
            .fetch_all(&state.db)
            .await?
    };

    for user_id in &users {
        let _ = crate::handlers::notification::create_notification(
            &state,
            *user_id,
            &payload.title,
            &payload.message,
            "admin"
        ).await;
    }

    Ok(Json(serde_json::json!({ "status": "success", "recipients_count": users.len() })))
}

#[derive(Debug, Serialize)]
pub struct UserActivity {
    pub orders: Vec<serde_json::Value>,
    pub consultations: Vec<serde_json::Value>,
    pub wallet_history: Vec<serde_json::Value>,
    pub reviews: Vec<serde_json::Value>,
}

pub async fn get_user_activity(
    claims: crate::auth_utils::Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserActivity>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let orders = sqlx::query(
        "SELECT id, status::text, total_amount, created_at FROM pharmacy_orders WHERE patient_id = $1 OR pharmacy_id = $1 ORDER BY created_at DESC"
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|r| serde_json::json!({
        "id": r.get::<Uuid, _>("id"),
        "status": r.get::<String, _>("status"),
        "total_amount": r.get::<i64, _>("total_amount"),
        "created_at": r.get::<DateTime<Utc>, _>("created_at"),
    }))
    .collect();

    let consultations = sqlx::query(
        "SELECT id, status::text, scheduled_at FROM consultations WHERE patient_id = $1 OR doctor_id = $1 ORDER BY scheduled_at DESC"
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|r| serde_json::json!({
        "id": r.get::<Uuid, _>("id"),
        "status": r.get::<String, _>("status"),
        "scheduled_at": r.get::<DateTime<Utc>, _>("scheduled_at"),
    }))
    .collect();

    let wallet_history = sqlx::query(
        "SELECT id, amount, type::text, status::text, created_at FROM wallet_transactions wt JOIN wallets w ON wt.wallet_id = w.id WHERE w.user_id = $1 ORDER BY created_at DESC"
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|r| serde_json::json!({
        "id": r.get::<Uuid, _>("id"),
        "amount": r.get::<i64, _>("amount"),
        "type": r.get::<String, _>("type"),
        "status": r.get::<String, _>("status"),
        "created_at": r.get::<DateTime<Utc>, _>("created_at"),
    }))
    .collect();

    let reviews = sqlx::query(
        "SELECT id, rating, comment, created_at FROM reviews WHERE user_id = $1 OR target_id = $1 ORDER BY created_at DESC"
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|r| serde_json::json!({
        "id": r.get::<Uuid, _>("id"),
        "rating": r.get::<i32, _>("rating"),
        "comment": r.get::<Option<String>, _>("comment"),
        "created_at": r.get::<DateTime<Utc>, _>("created_at"),
    }))
    .collect();

    Ok(Json(UserActivity {
        orders,
        consultations,
        wallet_history,
        reviews,
    }))
}

// 1. Appointments Dashboard
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ConsultationRecord {
    pub id: Uuid,
    pub doctor_name: String,
    pub patient_name: String,
    pub status: String,
    pub fee: i64,
    pub scheduled_at: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ConsultationsQuery {
    pub q: Option<String>,
    pub status: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct ConsultationsStats {
    pub total: i64,
    pub scheduled: i64,
    pub completed: i64,
    pub cancelled: i64,
}

#[derive(Debug, Serialize)]
pub struct ConsultationsResponse {
    pub consultations: Vec<ConsultationRecord>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub stats: ConsultationsStats,
}

pub async fn get_all_consultations(
    State(state): State<AppState>,
    claims: Claims,
    Query(params): Query<ConsultationsQuery>,
) -> Result<Json<ConsultationsResponse>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Admin ONLY".to_string()));
    }

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = (page - 1) * per_page;
    let search = format!("%{}%", params.q.as_deref().unwrap_or(""));

    let status_filter = match params.status.as_deref() {
        Some("scheduled") => "AND c.status = 'scheduled'",
        Some("completed") => "AND c.status = 'completed'",
        Some("cancelled") => "AND c.status = 'cancelled'",
        _ => "",
    };

    let query_str = format!(
        r#"
        SELECT 
            c.id,
            d.full_name as doctor_name,
            p.full_name as patient_name,
            c.status::text,
            COALESCE(cs.amount, 0) as fee,
            c.scheduled_at,
            c.created_at
        FROM consultations c
        JOIN users d ON c.doctor_id = d.id
        JOIN users p ON c.patient_id = p.id
        LEFT JOIN checkout_sessions cs ON cs.consultation_id = c.id
        WHERE (d.full_name ILIKE $1 OR p.full_name ILIKE $1 OR c.id::text ILIKE $1)
        {}
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        status_filter
    );

    let records = sqlx::query_as::<_, ConsultationRecord>(&query_str)
        .bind(&search)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let count_query_str = format!(
        "SELECT COUNT(*) FROM consultations c JOIN users d ON c.doctor_id = d.id JOIN users p ON c.patient_id = p.id WHERE (d.full_name ILIKE $1 OR p.full_name ILIKE $1 OR c.id::text ILIKE $1) {}",
        status_filter
    );

    let total: i64 = sqlx::query_scalar(&count_query_str)
        .bind(&search)
        .fetch_one(&state.db)
        .await?;

    // Default global stats across all filters
    let stats_total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM consultations")
        .fetch_one(&state.db).await.unwrap_or(0);
    let stats_scheduled: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM consultations WHERE status = 'scheduled'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let stats_completed: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM consultations WHERE status = 'completed'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let stats_cancelled: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM consultations WHERE status = 'cancelled'")
        .fetch_one(&state.db).await.unwrap_or(0);

    let stats = ConsultationsStats {
        total: stats_total,
        scheduled: stats_scheduled,
        completed: stats_completed,
        cancelled: stats_cancelled,
    };

    Ok(Json(ConsultationsResponse { consultations: records, total, page, per_page, stats }))
}

pub async fn admin_cancel_consultation(
    claims: Claims,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Access denied".to_string()));
    }

    let result = sqlx::query("UPDATE consultations SET status = 'cancelled' WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Consultation not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "status": "success" })))
}

// 2. Specialty & Department Manager
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SpecialtyRecord {
    pub id: Uuid,
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
}

pub async fn get_all_specialties(
    State(state): State<AppState>,
) -> Result<Json<Vec<SpecialtyRecord>>, AppError> {
    let specialties = sqlx::query_as::<_, SpecialtyRecord>(
        "SELECT id, name, icon, description FROM specialties ORDER BY name ASC"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(specialties))
}

#[derive(Debug, Deserialize)]
pub struct CreateSpecialtyRequest {
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
}

pub async fn create_specialty(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<CreateSpecialtyRequest>,
) -> Result<Json<SpecialtyRecord>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Admin ONLY".to_string()));
    }

    let specialty = sqlx::query_as::<_, SpecialtyRecord>(
        "INSERT INTO specialties (name, icon, description) VALUES ($1, $2, $3) RETURNING id, name, icon, description"
    )
    .bind(&payload.name)
    .bind(&payload.icon)
    .bind(&payload.description)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(specialty))
}

// 3. Prescription Registry
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PrescriptionAuditRecord {
    pub id: Uuid,
    pub doctor_name: String,
    pub patient_name: String,
    pub medication_name: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn get_prescription_audit(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<PrescriptionAuditRecord>>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Admin ONLY".to_string()));
    }

    let records = sqlx::query_as::<_, PrescriptionAuditRecord>(
        r#"
        SELECT 
            p.id,
            d.full_name as doctor_name,
            u.full_name as patient_name,
            COALESCE((
                SELECT string_agg(dg.name, ', ')
                FROM prescription_items pi
                JOIN drugs dg ON pi.drug_id = dg.id
                WHERE pi.prescription_id = p.id
            ), 'Unknown Medication') as medication_name,
            CASE 
                WHEN p.is_dispensed THEN 'Dispensed' 
                WHEN p.expiry_date < CURRENT_DATE THEN 'Expired' 
                ELSE 'Active' 
            END as status,
            p.created_at
        FROM prescriptions p
        JOIN users d ON p.doctor_id = d.id
        JOIN users u ON p.patient_id = u.id
        ORDER BY p.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(records))
}

// 4. Feedback & Quality Hub
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct QualityReport {
    pub id: Uuid,
    pub reviewer_name: String,
    pub doctor_name: String,
    pub rating: i32,
    pub comment: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn get_quality_reports(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<QualityReport>>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Admin ONLY".to_string()));
    }

    let reports = sqlx::query_as::<_, QualityReport>(
        r#"
        SELECT 
            r.id,
            p.full_name as reviewer_name,
            d.full_name as doctor_name,
            r.rating,
            r.comment,
            r.created_at
        FROM reviews r
        JOIN users p ON r.reviewer_id = p.id
        JOIN users d ON r.doctor_id = d.id
        ORDER BY r.rating ASC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(reports))
}

// 5. Audit Logs
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AuditLogRecord {
    pub id: Uuid,
    pub admin_name: String,
    pub action: String,
    pub target_type: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn get_admin_audit_logs(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<AuditLogRecord>>, AppError> {
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Admin ONLY".to_string()));
    }

    let logs = sqlx::query_as::<_, AuditLogRecord>(
        r#"
        SELECT 
            l.id,
            u.full_name as admin_name,
            l.action,
            l.target_type,
            l.created_at
        FROM admin_audit_logs l
        JOIN users u ON l.admin_id = u.id
        ORDER BY l.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(logs))
}
