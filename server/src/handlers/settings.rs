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
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserSettings {
    pub id: Uuid,
    pub user_id: Uuid,
    pub push_notifications: bool,
    pub email_notifications: bool,
    pub sms_notifications: bool,
    pub whatsapp_notifications: bool,
    pub dark_mode: bool,
    pub biometric_login: bool,
    pub location_services: bool,
    pub data_saving: bool,
    pub language: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub push_notifications: Option<bool>,
    pub email_notifications: Option<bool>,
    pub sms_notifications: Option<bool>,
    pub whatsapp_notifications: Option<bool>,
    pub dark_mode: Option<bool>,
    pub biometric_login: Option<bool>,
    pub location_services: Option<bool>,
    pub data_saving: Option<bool>,
    pub language: Option<String>,
}

// Get user settings
pub async fn get_settings(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<UserSettings>, AppError> {
    let settings = sqlx::query_as::<_, UserSettings>(
        "SELECT * FROM user_settings WHERE user_id = $1"
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;

    let settings = match settings {
        Some(s) => s,
        None => {
            sqlx::query_as::<_, UserSettings>(
                "INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *"
            )
            .bind(claims.sub)
            .fetch_one(&state.db)
            .await?
        }
    };

    Ok(Json(settings))
}

// Update user settings
pub async fn update_settings(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateSettingsRequest>,
) -> Result<Json<UserSettings>, AppError> {
    let current = sqlx::query_as::<_, UserSettings>(
        "SELECT * FROM user_settings WHERE user_id = $1"
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?;

    let updated = match current {
        Some(_) => {
            sqlx::query_as::<_, UserSettings>(
                "UPDATE user_settings SET 
                    push_notifications = COALESCE($1, push_notifications),
                    email_notifications = COALESCE($2, email_notifications),
                    sms_notifications = COALESCE($3, sms_notifications),
                    whatsapp_notifications = COALESCE($4, whatsapp_notifications),
                    dark_mode = COALESCE($5, dark_mode),
                    biometric_login = COALESCE($6, biometric_login),
                    location_services = COALESCE($7, location_services),
                    data_saving = COALESCE($8, data_saving),
                    language = COALESCE($9, language),
                    updated_at = NOW()
                WHERE user_id = $10
                RETURNING *"
            )
            .bind(payload.push_notifications)
            .bind(payload.email_notifications)
            .bind(payload.sms_notifications)
            .bind(payload.whatsapp_notifications)
            .bind(payload.dark_mode)
            .bind(payload.biometric_login)
            .bind(payload.location_services)
            .bind(payload.data_saving)
            .bind(payload.language)
            .bind(claims.sub)
            .fetch_one(&state.db)
            .await?
        }
        None => {
            sqlx::query_as::<_, UserSettings>(
                "INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *"
            )
            .bind(claims.sub)
            .fetch_one(&state.db)
            .await?
        }
    };

    Ok(Json(updated))
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SystemSettings {
    pub id: Uuid,
    pub commission_rate_percentage: f64,
    pub min_withdrawal_amount: i64,
    pub platform_name: String,
    pub support_email: String,
    pub emergency_contact: String,
    pub maintenance_mode: bool,
    pub ai_model: Option<String>,
    pub ai_api_key: Option<String>,
    pub ai_system_prompt: Option<String>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSystemSettingsRequest {
    pub commission_rate_percentage: Option<f64>,
    pub min_withdrawal_amount: Option<i64>,
    pub platform_name: Option<String>,
    pub support_email: Option<String>,
    pub emergency_contact: Option<String>,
    pub maintenance_mode: Option<bool>,
    pub ai_model: Option<String>,
    pub ai_api_key: Option<String>,
    pub ai_system_prompt: Option<String>,
}

// Get system settings (Admin only ideally, but public for some info)
pub async fn get_system_settings(
    State(state): State<AppState>,
) -> Result<Json<SystemSettings>, AppError> {
    let settings = sqlx::query_as::<_, SystemSettings>(
        "SELECT * FROM system_settings LIMIT 1"
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(settings))
}

// Update system settings (Admin only)
pub async fn update_system_settings(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<UpdateSystemSettingsRequest>,
) -> Result<Json<SystemSettings>, AppError> {
    // Basic role check (simplified, should use middleware or more robust check)
    // Assuming admin role is checked in router or here
    use crate::models::user::UserRole;
    if claims.role != UserRole::Admin {
        return Err(AppError::Unauthorized("Admin only".to_string()));
    }

    let updated = sqlx::query_as::<_, SystemSettings>(
        "UPDATE system_settings SET 
            commission_rate_percentage = COALESCE($1, commission_rate_percentage),
            min_withdrawal_amount = COALESCE($2, min_withdrawal_amount),
            platform_name = COALESCE($3, platform_name),
            support_email = COALESCE($4, support_email),
            emergency_contact = COALESCE($5, emergency_contact),
            maintenance_mode = COALESCE($6, maintenance_mode),
            ai_model = COALESCE($7, ai_model),
            ai_api_key = COALESCE($8, ai_api_key),
            ai_system_prompt = COALESCE($9, ai_system_prompt),
            updated_at = NOW()
         RETURNING *"
    )
    .bind(payload.commission_rate_percentage)
    .bind(payload.min_withdrawal_amount)
    .bind(payload.platform_name)
    .bind(payload.support_email)
    .bind(payload.emergency_contact)
    .bind(payload.maintenance_mode)
    .bind(payload.ai_model)
    .bind(payload.ai_api_key)
    .bind(payload.ai_system_prompt)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(updated))
}
