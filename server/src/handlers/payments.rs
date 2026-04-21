use axum::{
    extract::{State, Extension},
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
#[allow(dead_code)]
pub struct InitializePaymentRequest {
    pub amount: i64, // in kobo/cents
    pub email: String,
    pub transaction_type: String, // 'wallet_funding', 'consultation', 'pharmacy_order'
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct PaymentResponse {
    pub authorization_url: String,
    pub reference: String,
}

pub async fn initialize_payment(
    State(_state): State<AppState>,
    Extension(_claims): Extension<Claims>,
    Json(_payload): Json<InitializePaymentRequest>,
) -> Result<Json<PaymentResponse>, AppError> {
    // Mock implementation - integrate with Paystack/Flutterwave/Stripe
    let reference = format!("MED_{}", Uuid::new_v4().to_string().replace("-", "").to_uppercase());
    
    // In production, call payment gateway API here
    // For now, return mock response
    Ok(Json(PaymentResponse {
        authorization_url: format!("https://checkout.medicata.com/pay/{}", reference),
        reference,
    }))
}

#[derive(Debug, Deserialize)]
pub struct VerifyPaymentRequest {
    pub reference: String,
}

#[derive(Debug, Serialize)]
pub struct VerificationResponse {
    pub success: bool,
    pub amount: i64,
    pub status: String,
}

pub async fn verify_payment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<VerifyPaymentRequest>,
) -> Result<Json<VerificationResponse>, AppError> {
    // Mock verification - in production, verify with payment gateway
    
    // Update transaction status
    sqlx::query(
        "UPDATE payment_transactions SET status = 'success', updated_at = NOW()
         WHERE provider_reference = $1 AND user_id = $2"
    )
    .bind(&payload.reference)
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    Ok(Json(VerificationResponse {
        success: true,
        amount: 50000, // Mock amount
        status: "success".to_string(),
    }))
}

pub async fn get_transactions(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let rows = sqlx::query_as::<_, (Uuid, i64, String, String, String, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, amount, currency, provider, transaction_type, status, created_at
         FROM payment_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50"
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    let transactions: Vec<_> = rows.into_iter().map(|(id, amount, currency, provider, tx_type, status, created_at)| {
        serde_json::json!({
            "id": id,
            "amount": amount,
            "currency": currency,
            "provider": provider,
            "transaction_type": tx_type,
            "status": status,
            "created_at": created_at
        })
    }).collect();

    Ok(Json(transactions))
}
