use axum::{
    extract::{Query, State, Extension},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    error::AppError,
    auth_utils::Claims,
    state::AppState,
};



#[derive(Debug, Deserialize)]
pub struct SearchDrugsQuery {
    pub q: Option<String>,
    pub category: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct Drug {
    pub id: Uuid,
    pub name: String,
    pub generic_name: Option<String>,
    pub brand_name: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub dosage_forms: Vec<String>,
    pub strengths: Vec<String>,
    pub manufacturer: Option<String>,
    pub requires_prescription: bool,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DrugsResponse {
    pub drugs: Vec<Drug>,
    pub total: i64,
}

pub async fn search_drugs(
    State(state): State<AppState>,
    _claims: Extension<Claims>,
    Query(params): Query<SearchDrugsQuery>,
) -> Result<Json<DrugsResponse>, AppError> {
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = (params.page.unwrap_or(1).max(1) - 1) * per_page;
    let search_pattern = format!("%{}%", params.q.as_deref().unwrap_or(""));

    // Using existing columns from public.drugs: id, name, category, brand, strength
    let rows = sqlx::query!(
        "SELECT id, name, brand as brand_name, category, strength, image_url
         FROM drugs 
         WHERE (name ILIKE $1 OR brand ILIKE $1)
         AND ($2::TEXT IS NULL OR category = $2)
         ORDER BY name 
         LIMIT $3 OFFSET $4",
        search_pattern,
        params.category,
        per_page,
        offset
    )
    .fetch_all(&state.db)
    .await?;

    let drugs: Vec<Drug> = rows.into_iter().map(|row| Drug {
        id: row.id,
        name: row.name.clone(),
        generic_name: Some(row.name),
        brand_name: row.brand_name,
        category: row.category,
        description: None,
        dosage_forms: vec![],
        strengths: row.strength.map(|s| vec![s]).unwrap_or_default(),
        manufacturer: None,
        requires_prescription: true,
        image_url: row.image_url,
    }).collect();

    let total = drugs.len() as i64;

    Ok(Json(DrugsResponse { drugs, total }))
}

#[derive(Debug, Serialize)]
pub struct CategoriesResponse {
    pub categories: Vec<String>,
}

pub async fn get_categories(
    State(state): State<AppState>,
    _claims: Extension<Claims>,
) -> Result<Json<CategoriesResponse>, AppError> {
    let categories: Vec<String> = sqlx::query_scalar(
        "SELECT DISTINCT category FROM drugs WHERE category IS NOT NULL ORDER BY category"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(CategoriesResponse { categories }))
}

#[derive(Debug, Deserialize)]
pub struct CreateDrugRequest {
    pub name: String,
    pub generic_name: Option<String>,
    pub brand_name: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub dosage_forms: Option<Vec<String>>,
    pub strengths: Option<Vec<String>>,
    pub manufacturer: Option<String>,
    pub requires_prescription: Option<bool>,
    pub image_url: Option<String>,
}

pub async fn create_drug(
    State(state): State<AppState>,
    _claims: Extension<Claims>,
    Json(payload): Json<CreateDrugRequest>,
) -> Result<Json<Drug>, AppError> {
    tracing::info!("Creating drug with payload: {:?}", payload);
    
    // Validate required fields
    if payload.name.trim().is_empty() {
        return Err(AppError::ValidationError("Drug name is required".to_string()));
    }
    
    // Map the incoming payload to existing database columns: brand_name -> brand, strengths -> strength
    let strength = payload.strengths.and_then(|s| s.first().cloned());
    let category = payload.category.filter(|c| !c.trim().is_empty()).unwrap_or_else(|| "Medication".to_string());
    let brand = payload.brand_name.filter(|b| !b.trim().is_empty()).unwrap_or_else(|| "General".to_string());
    
    tracing::info!("Inserting drug: name={}, category={}, brand={}", payload.name, category, brand);
    
    let drug_id: Uuid = sqlx::query_scalar(
        "INSERT INTO drugs (name, category, brand, strength, image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id"
    )
    .bind(&payload.name)
    .bind(&category)
    .bind(&brand)
    .bind(strength)
    .bind(payload.image_url)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to insert drug: {:?}", e);
        AppError::Internal(anyhow::anyhow!(e))
    })?;

    let row = sqlx::query!(
        "SELECT id, name, category, brand as brand_name, strength, image_url
         FROM drugs WHERE id = $1",
        drug_id
    )
    .fetch_one(&state.db)
    .await?;

    let drug = Drug {
        id: row.id,
        name: row.name.clone(),
        generic_name: Some(row.name),
        brand_name: row.brand_name,
        category: row.category,
        description: None,
        dosage_forms: vec![],
        strengths: row.strength.map(|s| vec![s]).unwrap_or_default(),
        manufacturer: None,
        requires_prescription: true,
        image_url: row.image_url,
    };

    Ok(Json(drug))
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PharmacyStockItem {
    pub id: Uuid,
    pub drug_id: Uuid,
    pub drug_name: String,
    pub drug_category: Option<String>,
    pub drug_image_url: Option<String>,
    pub price: i64,
    pub quantity: i32,
    pub is_available: bool,
    pub expiry_date: Option<chrono::NaiveDate>,
}

pub async fn get_pharmacy_stock(
    State(state): State<AppState>,
    claims: Extension<Claims>,
) -> Result<Json<Vec<PharmacyStockItem>>, AppError> {
    let stock = sqlx::query_as::<_, PharmacyStockItem>(
        "SELECT ps.id, ps.drug_id, d.name as drug_name, d.category as drug_category, d.image_url as drug_image_url,
         ps.price, ps.quantity, ps.is_available, ps.expiry_date
         FROM pharmacy_stock ps
         JOIN drugs d ON ps.drug_id = d.id
         WHERE ps.pharmacy_id = $1"
    )
    .bind(claims.user_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(stock))
}

#[derive(Debug, Deserialize)]
pub struct UpdateStockRequest {
    pub drug_id: Uuid,
    pub price: i64,
    pub quantity: i32,
    pub is_available: Option<bool>,
    pub expiry_date: Option<chrono::NaiveDate>,
}

pub async fn update_pharmacy_stock(
    State(state): State<AppState>,
    claims: Extension<Claims>,
    Json(payload): Json<UpdateStockRequest>,
) -> Result<Json<PharmacyStockItem>, AppError> {
    let row = sqlx::query_as::<_, PharmacyStockItem>(
        "INSERT INTO pharmacy_stock (pharmacy_id, drug_id, price, quantity, is_available, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (pharmacy_id, drug_id) DO UPDATE SET
            price = EXCLUDED.price,
            quantity = EXCLUDED.quantity,
            is_available = EXCLUDED.is_available,
            expiry_date = EXCLUDED.expiry_date,
            updated_at = NOW()
         RETURNING id, drug_id, 
            (SELECT name FROM drugs WHERE id = $2) as drug_name,
            (SELECT category FROM drugs WHERE id = $2) as drug_category,
            (SELECT image_url FROM drugs WHERE id = $2) as drug_image_url,
            price, quantity, is_available, expiry_date"
    )
    .bind(claims.user_id)
    .bind(payload.drug_id)
    .bind(payload.price)
    .bind(payload.quantity)
    .bind(payload.is_available.unwrap_or(true))
    .bind(payload.expiry_date)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(row))
}
