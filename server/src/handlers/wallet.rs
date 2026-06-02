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
    #[allow(dead_code)]
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
    let user_row = sqlx::query(
        "SELECT full_name, email, phone_number FROM users WHERE id = $1"
    )
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    let full_name: String = user_row.get("full_name");
    let email: String = user_row.get("email");
    let phone_number: String = user_row.get("phone_number");

    let names: Vec<&str> = full_name.split_whitespace().collect();
    let first_name = names.first().unwrap_or(&"Customer").to_string();
    let last_name = names.get(1).unwrap_or(&"User").to_string();
    let reference = format!("MED_WAL_{}", Uuid::new_v4().to_string().replace("-", "").to_uppercase());

    // 2. Call VTStack API (Production Implementation)
    let client = reqwest::Client::new();
    let api_key = std::env::var("VTSTACK_API_KEY").unwrap_or_default();
    let base_url = std::env::var("VTSTACK_BASE_URL").unwrap_or_else(|_| "https://api.vtstack.com.ng/api".to_string());

    let vtstack_payload = serde_json::json!({
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "phone": phone_number,
        "bvn": "22123456789", // Mock BVN as it's sensitive, in production this should be collected
        "reference": reference
    });

    let vt_res = client.post(format!("{}/virtual-accounts", base_url))
        .header("x-api-key", &api_key)
        .json(&vtstack_payload)
        .send()
        .await;

    let (virtual_account_number, virtual_bank_name, virtual_account_name) = match vt_res {
        Ok(res) if res.status().is_success() => {
            let vt_data: serde_json::Value = res.json().await.map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to parse VTStack response: {}", e)))?;
            let account_num = vt_data["data"]["accountNumber"].as_str().unwrap_or("0000000000").to_string();
            let bank_name = vt_data["data"]["bankName"].as_str().unwrap_or("PalmPay").to_string();
            let account_name = vt_data["data"]["accountName"].as_str().unwrap_or(&full_name).to_string();
            (account_num, bank_name, account_name)
        },
        _ => {
            // Log the error but fallback to simulation for MVP/Testing
            tracing::warn!("VTStack API unavailable or failed. Using simulated account for reference: {}", reference);
            (
                format!("99{}", rand::Rng::gen_range(&mut rand::thread_rng(), 10000000..99999999)),
                "Medicata Test Bank".to_string(),
                full_name.clone()
            )
        }
    };

    let expires_at = Utc::now() + chrono::Duration::minutes(30);

    // 3. Save checkout session to database
    let session_row = sqlx::query(
        r#"
        INSERT INTO checkout_sessions 
        (user_id, amount, reference, virtual_account_number, virtual_bank_name, virtual_account_name, expires_at, order_id, consultation_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, amount, reference, virtual_account_number, virtual_bank_name, virtual_account_name, expires_at
        "#
    )
    .bind(claims.sub)
    .bind(payload.amount)
    .bind(reference)
    .bind(virtual_account_number)
    .bind(virtual_bank_name)
    .bind(virtual_account_name)
    .bind(expires_at)
    .bind(payload.order_id)
    .bind(payload.consultation_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(CheckoutSessionResponse {
        id: session_row.get("id"),
        amount: session_row.get("amount"),
        reference: session_row.get("reference"),
        account_number: session_row.get::<Option<String>, _>("virtual_account_number").unwrap_or_default(),
        bank_name: session_row.get::<Option<String>, _>("virtual_bank_name").unwrap_or_default(),
        account_name: session_row.get::<Option<String>, _>("virtual_account_name").unwrap_or_default(),
        expires_at: session_row.get("expires_at"),
    }))
}

pub async fn check_session_status(
    State(state): State<AppState>,
    claims: Claims,
    axum::extract::Path(reference): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let session = sqlx::query(
        "SELECT status FROM checkout_sessions WHERE reference = $1 AND user_id = $2"
    )
    .bind(&reference)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;

    match session {
        Some(row) => {
            let status: String = row.get("status");
            Ok(Json(serde_json::json!({ "status": status })))
        },
        None => Err(AppError::NotFound("Session not found".to_string())),
    }
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
    #[allow(dead_code)]
    pub currency: String,
    #[allow(dead_code)]
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
        let session_row = sqlx::query(
            "SELECT user_id, amount, order_id, consultation_id FROM checkout_sessions WHERE reference = $1"
        )
        .bind(&payload.data.reference)
        .fetch_optional(&state.db)
        .await?;

        if let Some(row) = session_row {
            let session_user_id: Uuid = row.get("user_id");
            let _session_amount: i64 = row.get("amount");
            let session_order_id: Option<Uuid> = row.get("order_id");
            let session_consultation_id: Option<Uuid> = row.get("consultation_id");

            // 2. Perform updates in a transaction
            let mut tx = state.db.begin().await?;

            // Credit the wallet (audit trail)
            let amount_to_credit = payload.data.amount;
            
            let wallet_row: sqlx::postgres::PgRow = sqlx::query(
                "INSERT INTO wallets (user_id, balance) 
                 VALUES ($1, 0) 
                 ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() 
                 RETURNING id"
            )
            .bind(session_user_id)
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
            if let Some(order_id) = session_order_id {
                // Update order to paid
                sqlx::query(
                    "UPDATE pharmacy_orders SET status = 'processing', payment_status = 'paid', payment_method = 'bank_transfer', updated_at = NOW() WHERE id = $1"
                )
                .bind(order_id)
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
                let order_info_row = sqlx::query("SELECT pharmacy_id FROM pharmacy_orders WHERE id = $1")
                    .bind(order_id)
                    .fetch_one(&mut *tx).await?;
                
                let pharmacy_id: Uuid = order_info_row.get("pharmacy_id");

                let _ = crate::handlers::notification::create_notification(
                    &state,
                    pharmacy_id,
                    "Order Paid",
                    &format!("Order #{} has been paid and is ready for processing.", &order_id.to_string()[..8]),
                    "order"
                ).await;

            } else if let Some(consultation_id) = session_consultation_id {
                // Update consultation to accepted (which means scheduled/confirmed in our system)
                sqlx::query(
                    "UPDATE consultations SET status = 'accepted' WHERE id = $1"
                )
                .bind(consultation_id)
                .execute(&mut *tx)
                .await?;

                // --- DOCTOR EARNINGS LOGIC ---
                // 1. Get doctor_id for this consultation
                let consultation_info_row = sqlx::query("SELECT doctor_id FROM consultations WHERE id = $1")
                    .bind(consultation_id)
                    .fetch_one(&mut *tx).await?;
                
                let doctor_id: Uuid = consultation_info_row.get("doctor_id");

                // 2. Calculate earnings (e.g., 90% to doctor, 10% platform fee)
                let total_fee = amount_to_credit;
                let doctor_earnings = (total_fee as f64 * 0.9) as i64;

                // 3. Credit Doctor's Wallet
                let doctor_wallet_row: sqlx::postgres::PgRow = sqlx::query(
                    "INSERT INTO wallets (user_id, balance) 
                     VALUES ($1, $2) 
                     ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + $2, updated_at = NOW() 
                     RETURNING id"
                )
                .bind(doctor_id)
                .bind(doctor_earnings)
                .fetch_one(&mut *tx)
                .await?;

                let doctor_wallet_id: Uuid = doctor_wallet_row.get("id");

                // 4. Record earnings transaction for doctor
                sqlx::query(
                    "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) 
                     VALUES ($1, 'earnings', $2, $3, 'completed')"
                )
                .bind(doctor_wallet_id)
                .bind(doctor_earnings)
                .bind(format!("Earnings for Consultation #{}", &consultation_id.to_string()[..8]))
                .execute(&mut *tx)
                .await?;

                // 5. Notify Doctor of earnings
                let _ = crate::handlers::notification::create_notification(
                    &state,
                    doctor_id,
                    "Earnings Credited",
                    &format!("You have earned ₦{} from consultation #{}.", format_currency(doctor_earnings), &consultation_id.to_string()[..8]),
                    "wallet"
                ).await;

                // Record payment deduction in wallet history for patient (audit only)
                sqlx::query(
                    "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) 
                     VALUES ($1, 'payment', $2, $3, 'completed')"
                )
                .bind(wallet_id)
                .bind(amount_to_credit)
                .bind(format!("Payment for Consultation #{}", &consultation_id.to_string()[..8]))
                .execute(&mut *tx)
                .await?;

                // Notify Doctor of new appointment
                let _ = crate::handlers::notification::create_notification(
                    &state,
                    doctor_id,
                    "New Appointment Paid",
                    &format!("An appointment (#{}) has been paid and scheduled.", &consultation_id.to_string()[..8]),
                    "appointment"
                ).await;
            }

            // Update session status
            sqlx::query(
                "UPDATE checkout_sessions SET status = 'completed', updated_at = NOW() WHERE reference = $1"
            )
            .bind(&payload.data.reference)
            .execute(&mut *tx)
            .await?;

            tx.commit().await?;

            // Notify user
            let _ = crate::handlers::notification::create_notification(
                &state,
                session_user_id,
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
