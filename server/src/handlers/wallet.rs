use axum::{
    extract::State,
    Json,
};
use crate::{
    error::AppError,
    state::AppState,
    auth_utils::Claims,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Wallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub balance: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct WalletTransaction {
    pub id: Uuid,
    pub wallet_id: Uuid,
    pub transaction_type: String,
    pub amount: i64,
    pub description: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AddMoneyRequest {
    pub amount: i64,
    pub payment_method: String,
}

#[derive(Debug, Deserialize)]
pub struct WithdrawRequest {
    pub amount: i64,
    pub bank_account: String,
}

#[derive(Debug, Serialize)]
pub struct WalletBalanceResponse {
    pub balance: i64,
    pub currency: String,
}

#[derive(Debug, Deserialize)]
pub struct InitializeCheckoutRequest {
    pub amount: i64,
    pub r#type: String,
    pub order_id: Option<Uuid>,
    pub consultation_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct CheckoutSessionResponse {
    pub id: Uuid,
    pub amount: i64,
    pub reference: String,
    pub account_number: String,
    pub bank_name: String,
    pub account_name: String,
    pub expires_at: DateTime<Utc>,
}

// Get wallet balance
pub async fn get_balance(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<WalletBalanceResponse>, AppError> {
    let wallet = sqlx::query_as::<_, Wallet>(
        "SELECT * FROM wallets WHERE user_id = $1"
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;

    let balance = match wallet {
        Some(w) => w.balance,
        None => {
            // Create wallet if doesn't exist
            sqlx::query(
                "INSERT INTO wallets (user_id, balance) VALUES ($1, $2)"
            )
            .bind(claims.sub)
            .bind(0)
            .execute(&state.db)
            .await?;
            0
        }
    };

    Ok(Json(WalletBalanceResponse {
        balance,
        currency: "NGN".to_string(),
    }))
}

// Initialize high-fidelity checkout with VTStack
pub async fn initialize_checkout(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<InitializeCheckoutRequest>,
) -> Result<Json<CheckoutSessionResponse>, AppError> {
    // 1. Get user info for VTStack
    let user = sqlx::query!(
        "SELECT full_name, email, phone_number FROM users WHERE id = $1",
        claims.sub
    )
    .fetch_one(&state.db)
    .await?;

    let names: Vec<&str> = user.full_name.split_whitespace().collect();
    let first_name = names.first().unwrap_or(&"Customer").to_string();
    let last_name = names.get(1).unwrap_or(&"User").to_string();
    let email = user.email;
    let phone = user.phone_number.unwrap_or_else(|| "08000000000".to_string());
    let reference = format!("MED_WAL_{}", Uuid::new_v4().to_string().replace("-", "").to_uppercase());

    // 2. Call VTStack API (Production Implementation)
    let client = reqwest::Client::new();
    let api_key = std::env::var("VTSTACK_API_KEY").unwrap_or_default();
    let base_url = std::env::var("VTSTACK_BASE_URL").unwrap_or_else(|_| "https://api.vtstack.com.ng/api".to_string());

    let vtstack_payload = serde_json::json!({
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "phone": phone,
        "bvn": "22123456789", // Mock BVN as it's sensitive, in production this should be collected
        "reference": reference
    });

    let vt_res = client.post(format!("{}/virtual-accounts", base_url))
        .header("x-api-key", &api_key)
        .json(&vtstack_payload)
        .send()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("VTStack API request failed: {}", e)))?;

    let (virtual_account_number, virtual_bank_name, virtual_account_name) = if vt_res.status().is_success() {
        let vt_data: serde_json::Value = vt_res.json().await.map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to parse VTStack response: {}", e)))?;
        
        // Extract account details from VTStack response
        // Based on documentation provided: { "accountNumber": "...", "accountName": "...", "bankName": "..." }
        let account_num = vt_data["data"]["accountNumber"].as_str().unwrap_or("0000000000").to_string();
        let bank_name = vt_data["data"]["bankName"].as_str().unwrap_or("PalmPay").to_string();
        let account_name = vt_data["data"]["accountName"].as_str().unwrap_or(&user.full_name).to_string();
        
        (account_num, bank_name, account_name)
    } else {
        // Fallback or handle error (for now, logging and returning simulated for safety if API is busy)
        tracing::error!("VTStack API returned error: {:?}", vt_res.status());
        let err_text = vt_res.text().await.unwrap_or_default();
        tracing::error!("Error body: {}", err_text);
        
        // Return a simulated one only if we want to bypass during testing, 
        // but for a live key, we should probably return an error.
        return Err(AppError::Internal(anyhow::anyhow!("Failed to create virtual account with VTStack")));
    };

    let expires_at = Utc::now() + chrono::Duration::minutes(30);

    // 3. Save checkout session to database
    let session = sqlx::query!(
        r#"
        INSERT INTO checkout_sessions 
        (user_id, amount, reference, virtual_account_number, virtual_bank_name, virtual_account_name, expires_at, order_id, consultation_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, amount, reference, virtual_account_number, virtual_bank_name, virtual_account_name, expires_at
        "#,
        claims.sub,
        payload.amount,
        reference,
        virtual_account_number,
        virtual_bank_name,
        virtual_account_name,
        expires_at,
        payload.order_id,
        payload.consultation_id
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(CheckoutSessionResponse {
        id: session.id,
        amount: session.amount,
        reference: session.reference,
        account_number: session.virtual_account_number.unwrap_or_default(),
        bank_name: session.virtual_bank_name.unwrap_or_default(),
        account_name: session.virtual_account_name.unwrap_or_default(),
        expires_at: session.expires_at,
    }))
}

#[derive(Debug, Deserialize)]
pub struct VTStackWebhookPayload {
    pub event: String,
    pub data: VTStackTransactionData,
}

#[derive(Debug, Deserialize)]
pub struct VTStackTransactionData {
    pub reference: String,
    pub amount: i64,
    pub currency: String,
    pub status: Option<String>,
}

// VTStack Webhook Handler
pub async fn vtstack_webhook(
    State(state): State<AppState>,
    Json(payload): Json<VTStackWebhookPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::info!("Received VTStack Webhook: {:?}", payload);

    if payload.event == "transaction.deposit" {
        // 1. Find the checkout session by reference
        let session = sqlx::query!(
            "SELECT user_id, amount, order_id, consultation_id FROM checkout_sessions WHERE reference = $1",
            payload.data.reference
        )
        .fetch_optional(&state.db)
        .await?;

        if let Some(session) = session {
            // 2. Perform updates in a transaction
            let mut tx = state.db.begin().await?;

            // Credit the wallet (audit trail)
            let amount_to_credit = payload.data.amount;
            
            let wallet_row = sqlx::query(
                "INSERT INTO wallets (user_id, balance) 
                 VALUES ($1, 0) 
                 ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() 
                 RETURNING id"
            )
            .bind(session.user_id)
            .fetch_one(&mut *tx)
            .await?;

            let wallet_id: Uuid = wallet_row.get("id");

            // We don't actually update the balance here because the money is immediately used for the service,
            // but we record the transaction for history.
            
            // Record deposit transaction
            sqlx::query(
                "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) 
                 VALUES ($1, 'deposit', $2, $3, 'completed')"
            )
            .bind(wallet_id)
            .bind(amount_to_credit)
            .bind(format!("Direct Payment (Ref: {})", &payload.data.reference[..8]))
            .execute(&mut *tx)
            .await?;

            // Handle Service Specific Logic
            if let Some(order_id) = session.order_id {
                // Update order to paid
                sqlx::query!(
                    "UPDATE pharmacy_orders SET status = 'processing', payment_status = 'paid', payment_method = 'bank_transfer', updated_at = NOW() WHERE id = $1",
                    order_id
                )
                .execute(&mut *tx)
                .await?;

                // Record payment deduction in wallet history
                sqlx::query(
                    "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) 
                     VALUES ($1, 'payment', $2, $3, 'completed')"
                )
                .bind(wallet_id)
                .bind(amount_to_credit)
                .bind(format!("Payment for Order #{}", &order_id.to_string()[..8]))
                .execute(&mut *tx)
                .await?;

                // Notify Pharmacy
                let order_info = sqlx::query!("SELECT pharmacy_id FROM pharmacy_orders WHERE id = $1", order_id)
                    .fetch_one(&mut *tx).await?;
                
                let _ = crate::handlers::notification::create_notification(
                    &state,
                    order_info.pharmacy_id,
                    "Order Paid",
                    &format!("Order #{} has been paid and is ready for processing.", &order_id.to_string()[..8]),
                    "order"
                ).await;

            } else if let Some(consultation_id) = session.consultation_id {
                // Update consultation to accepted (which means scheduled/confirmed in our system)
                // Note: consultations table doesn't have updated_at column
                sqlx::query!(
                    "UPDATE consultations SET status = 'accepted' WHERE id = $1",
                    consultation_id
                )
                .execute(&mut *tx)
                .await?;

                // Record payment deduction in wallet history
                sqlx::query(
                    "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) 
                     VALUES ($1, 'payment', $2, $3, 'completed')"
                )
                .bind(wallet_id)
                .bind(amount_to_credit)
                .bind(format!("Payment for Consultation #{}", &consultation_id.to_string()[..8]))
                .execute(&mut *tx)
                .await?;

                // Notify Doctor
                let consultation_info = sqlx::query!("SELECT doctor_id FROM consultations WHERE id = $1", consultation_id)
                    .fetch_one(&mut *tx).await?;

                let _ = crate::handlers::notification::create_notification(
                    &state,
                    consultation_info.doctor_id,
                    "New Appointment Paid",
                    &format!("An appointment (#{}) has been paid and scheduled.", &consultation_id.to_string()[..8]),
                    "appointment"
                ).await;
            }

            // Update session status
            sqlx::query!(
                "UPDATE checkout_sessions SET status = 'completed', updated_at = NOW() WHERE reference = $1",
                payload.data.reference
            )
            .execute(&mut *tx)
            .await?;

            tx.commit().await?;

            // Notify user
            let _ = crate::handlers::notification::create_notification(
                &state,
                session.user_id,
                "Payment Successful",
                &format!("Your payment of ₦{} was successful. Your request is now being processed.", format_currency(amount_to_credit)),
                "system"
            ).await;
        }
    }

    Ok(Json(serde_json::json!({ "status": "success" })))
}

fn format_currency(amount: i64) -> String {
    let s = amount.to_string();
    let mut result = String::new();
    let chars: Vec<char> = s.chars().collect();
    let len = chars.len();
    
    for (i, &c) in chars.iter().enumerate() {
        if i > 0 && (len - i) % 3 == 0 {
            result.push(',');
        }
        result.push(c);
    }
    result
}

// Add money to wallet
pub async fn add_money(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<AddMoneyRequest>,
) -> Result<Json<Wallet>, AppError> {
    if payload.amount <= 0 {
        return Err(AppError::BadRequest("Amount must be positive".to_string()));
    }

    // Get or create wallet
    let wallet = sqlx::query_as::<_, Wallet>(
        "SELECT * FROM wallets WHERE user_id = $1"
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;

    let wallet_id = match wallet {
        Some(w) => w.id,
        None => {
            let result = sqlx::query(
                "INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING id"
            )
            .bind(claims.sub)
            .bind(0)
            .fetch_one(&state.db)
            .await?;
            result.get("id")
        }
    };

    // Update balance
    let updated_wallet = sqlx::query_as::<_, Wallet>(
        "UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2 RETURNING *"
    )
    .bind(payload.amount)
    .bind(wallet_id)
    .fetch_one(&state.db)
    .await?;

    // Record transaction
    sqlx::query(
        "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(wallet_id)
    .bind("credit")
    .bind(payload.amount)
    .bind(format!("Added via {}", payload.payment_method))
    .bind("completed")
    .execute(&state.db)
    .await?;

    Ok(Json(updated_wallet))
}

// Withdraw money (for doctors)
pub async fn withdraw(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<WithdrawRequest>,
) -> Result<Json<Wallet>, AppError> {
    if payload.amount <= 0 {
        return Err(AppError::BadRequest("Amount must be positive".to_string()));
    }

    // Get wallet
    let wallet = sqlx::query_as::<_, Wallet>(
        "SELECT * FROM wallets WHERE user_id = $1"
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;

    let (wallet_id, current_balance) = match wallet {
        Some(w) => (w.id, w.balance),
        None => return Err(AppError::BadRequest("Wallet not found".to_string())),
    };

    if current_balance < payload.amount {
        return Err(AppError::BadRequest("Insufficient balance".to_string()));
    }

    // Update balance
    let updated_wallet = sqlx::query_as::<_, Wallet>(
        "UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2 RETURNING *"
    )
    .bind(payload.amount)
    .bind(wallet_id)
    .fetch_one(&state.db)
    .await?;

    // Record transaction
    sqlx::query(
        "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(wallet_id)
    .bind("debit")
    .bind(payload.amount)
    .bind(format!("Withdrawal to {}", payload.bank_account))
    .bind("pending")
    .execute(&state.db)
    .await?;

    Ok(Json(updated_wallet))
}

// Get transaction history
pub async fn get_transactions(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<WalletTransaction>>, AppError> {
    let wallet = sqlx::query_as::<_, Wallet>(
        "SELECT * FROM wallets WHERE user_id = $1"
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;

    let wallet_id = match wallet {
        Some(w) => w.id,
        None => return Ok(Json(vec![])),
    };

    let transactions = sqlx::query_as::<_, WalletTransaction>(
        "SELECT * FROM wallet_transactions WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT 50"
    )
    .bind(wallet_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(transactions))
}

// Deduct money for payment (internal use)
#[allow(dead_code)]
pub async fn deduct_for_payment(
    db: &sqlx::PgPool,
    user_id: Uuid,
    amount: i64,
    description: &str,
) -> Result<(), AppError> {
    let wallet = sqlx::query_as::<_, Wallet>(
        "SELECT * FROM wallets WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_optional(db)
    .await?;

    let (wallet_id, current_balance) = match wallet {
        Some(w) => (w.id, w.balance),
        None => return Err(AppError::BadRequest("Wallet not found".to_string())),
    };

    if current_balance < amount {
        return Err(AppError::BadRequest("Insufficient balance".to_string()));
    }

    sqlx::query(
        "UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2"
    )
    .bind(amount)
    .bind(wallet_id)
    .execute(db)
    .await?;

    sqlx::query(
        "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(wallet_id)
    .bind("debit")
    .bind(amount)
    .bind(description)
    .bind("completed")
    .execute(db)
    .await?;

    Ok(())
}

// Credit money (for doctor earnings, etc.)
#[allow(dead_code)]
pub async fn credit_wallet(
    db: &sqlx::PgPool,
    user_id: Uuid,
    amount: i64,
    description: &str,
) -> Result<(), AppError> {
    let wallet = sqlx::query_as::<_, Wallet>(
        "SELECT * FROM wallets WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_optional(db)
    .await?;

    let wallet_id = match wallet {
        Some(w) => w.id,
        None => {
            let result = sqlx::query(
                "INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING id"
            )
            .bind(user_id)
            .bind(0)
            .fetch_one(db)
            .await?;
            result.get("id")
        }
    };

    sqlx::query(
        "UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2"
    )
    .bind(amount)
    .bind(wallet_id)
    .execute(db)
    .await?;

    sqlx::query(
        "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(wallet_id)
    .bind("credit")
    .bind(amount)
    .bind(description)
    .bind("completed")
    .execute(db)
    .await?;

    Ok(())
}
