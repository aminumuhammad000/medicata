use axum::{
    extract::State,
    Json,
    Extension,
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

// Get wallet balance
pub async fn get_balance(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
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

// Add money to wallet
pub async fn add_money(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
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
    Extension(claims): Extension<Claims>,
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
    Extension(claims): Extension<Claims>,
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
