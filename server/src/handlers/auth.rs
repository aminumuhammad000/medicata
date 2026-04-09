use axum::{
    extract::State,
    Json,
};
use uuid::Uuid;
use crate::{
    error::AppError,
    models::user::{RegisterRequest, LoginRequest, AuthResponse, User, PatientHealthInfoRequest, PatientProfileRequest, DoctorProfessionalInfoRequest, DoctorBioRequest, PharmacyInfoRequest},
    auth_utils::{hash_password, verify_password, generate_jwt, Claims},
    state::AppState,
};

// From UserJourney.md Step 3: Account Creation (Must-Have Info)
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

// From UserJourney.md Step 8: Verification
#[derive(serde::Deserialize)]
pub struct VerifyRequest {
    pub code: String,
}

pub async fn verify(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<VerifyRequest>,
) -> Result<Json<User>, AppError> {
    // For MVP, we'll accept any 4-digit code and mark as verified
    // In production, you would verify against a stored code
    if payload.code.len() != 4 {
        return Err(AppError::BadRequest("Invalid verification code".to_string()));
    }

    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET is_verified = TRUE WHERE id = $1 RETURNING *"
    )
    .bind(claims.user_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(user))
}

#[derive(serde::Deserialize)]
pub struct SendVerificationRequest {
    pub email: String,
}

pub async fn send_verification(
    State(state): State<AppState>,
    Json(payload): Json<SendVerificationRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Generate a random 4-digit verification code
    let code = format!("{:04}", rand::random::<u16>() % 10000);
    
    // Send verification email
    state.email_service.send_verification_email(&payload.email, &code).await
        .map_err(|e| AppError::BadRequest(format!("Failed to send email: {}", e)))?;

    Ok(Json(serde_json::json!({
        "message": "Verification code sent successfully",
        "code": code // For MVP, return the code. In production, don't return it.
    })))
}

#[derive(serde::Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

pub async fn forgot_password(
    State(state): State<AppState>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Check if user exists
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?;

    if user.is_none() {
        // For security, don't reveal if email exists or not
        return Ok(Json(serde_json::json!({
            "message": "If an account exists with this email, a password reset code will be sent."
        })));
    }

    // Generate a random 6-digit reset code
    let reset_code = format!("{:06}", rand::random::<u32>() % 1000000);
    
    // Send password reset email
    state.email_service.send_password_reset_email(&payload.email, &reset_code).await
        .map_err(|e| AppError::BadRequest(format!("Failed to send email: {}", e)))?;

    Ok(Json(serde_json::json!({
        "message": "Password reset code sent to your email",
        "reset_code": reset_code // For MVP, return the code. In production, don't return it.
    })))
}

#[derive(serde::Deserialize)]
pub struct ResetPasswordRequest {
    pub email: String,
    pub code: String,
    pub new_password: String,
}

pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // For MVP, accept any 6-digit code and reset password
    // In production, verify against stored code
    if payload.code.len() != 6 {
        return Err(AppError::BadRequest("Invalid reset code".to_string()));
    }

    let password_hash = hash_password(&payload.new_password)?;

    let rows_affected = sqlx::query(
        "UPDATE users SET password_hash = $1 WHERE email = $2"
    )
    .bind(&password_hash)
    .bind(&payload.email)
    .execute(&state.db)
    .await?
    .rows_affected();

    if rows_affected == 0 {
        return Err(AppError::NotFound("User not found".to_string()));
    }

    Ok(Json(serde_json::json!({
        "message": "Password reset successfully"
    })))
}

// From UserJourney.md Patient Step 5: Basic Health Information
pub async fn update_patient_health_info(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<PatientHealthInfoRequest>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users 
         SET date_of_birth = $2, gender = $3, allergies = $4, existing_conditions = $5, updated_at = NOW()
         WHERE id = $1 RETURNING *"
    )
    .bind(claims.user_id)
    .bind(payload.date_of_birth)
    .bind(&payload.gender)
    .bind(&payload.allergies)
    .bind(&payload.existing_conditions)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(user))
}

// From UserJourney.md Patient Step 6: Profile / Bio & Body Info
pub async fn update_patient_profile(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<PatientProfileRequest>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users 
         SET bio = $2, height_cm = $3, weight_kg = $4, body_type = $5, address = $6, city = $7, state = $8, updated_at = NOW()
         WHERE id = $1 RETURNING *"
    )
    .bind(claims.user_id)
    .bind(&payload.bio)
    .bind(payload.height)
    .bind(payload.weight)
    .bind(&payload.body_type)
    .bind(&payload.address)
    .bind(&payload.city)
    .bind(&payload.state)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(user))
}

// From UserJourney.md Doctor Step 5: Professional Information
pub async fn update_doctor_professional_info(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<DoctorProfessionalInfoRequest>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users 
         SET medical_license_number = $2, specialty = $3, years_of_experience = $4, 
             clinic_hospital_affiliation = $5, profile_photo = $6, clinic_hospital_address = $7, updated_at = NOW()
         WHERE id = $1 RETURNING *"
    )
    .bind(claims.user_id)
    .bind(&payload.medical_license_number)
    .bind(&payload.specialty)
    .bind(payload.years_of_experience)
    .bind(&payload.clinic_hospital_affiliation)
    .bind(&payload.profile_photo)
    .bind(&payload.clinic_hospital_address)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(user))
}

// From UserJourney.md Doctor Step 6: Bio / Introduction
pub async fn update_doctor_bio(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<DoctorBioRequest>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users 
         SET bio = $2, languages_spoken = $3, working_hours = $4, updated_at = NOW()
         WHERE id = $1 RETURNING *"
    )
    .bind(claims.user_id)
    .bind(&payload.bio)
    .bind(&payload.languages_spoken)
    .bind(&payload.working_hours)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(user))
}

// From UserJourney.md Pharmacy Step 1: Pharmacy Info
pub async fn update_pharmacy_info(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<PharmacyInfoRequest>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users 
         SET pharmacy_name = $2, pharmacy_address = $3, pharmacy_license = $4, 
             pharmacy_contact_info = $5, opening_hours = $6, updated_at = NOW()
         WHERE id = $1 RETURNING *"
    )
    .bind(claims.user_id)
    .bind(&payload.pharmacy_name)
    .bind(&payload.pharmacy_address)
    .bind(&payload.pharmacy_license)
    .bind(&payload.pharmacy_contact_info)
    .bind(&payload.opening_hours)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(user))
}
