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
