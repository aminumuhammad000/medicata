use axum::{
    extract::State,
    Json,
};
use crate::{
    error::AppError,
    models::user::{RegisterRequest, LoginRequest, AuthResponse, User},
    auth_utils::{hash_password, verify_password, generate_jwt},
    state::AppState,
};

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let password_hash = hash_password(&payload.password)?;

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (full_name, email, password_hash, phone_number, whatsapp_number, role) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *"
    )
    .bind(&payload.full_name)
    .bind(&payload.email)
    .bind(password_hash)
    .bind(&payload.phone_number)
    .bind(&payload.whatsapp_number)
    .bind(payload.role)
    .fetch_one(&state.db)
    .await?;

    let token = generate_jwt(user.id, user.role, &state.config.jwt_secret)?;

    Ok(Json(AuthResponse { token, user }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

    if !verify_password(&payload.password, &user.password_hash)? {
        return Err(AppError::Unauthorized("Invalid credentials".to_string()));
    }

    let token = generate_jwt(user.id, user.role, &state.config.jwt_secret)?;

    Ok(Json(AuthResponse { token, user }))
}
