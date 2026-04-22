use axum::{
    extract::State,
    Json,
};
use chrono::Utc;
use serde::Deserialize;
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

    let user_result = sqlx::query_as::<_, User>(
        "INSERT INTO users (full_name, email, password_hash, phone_number, whatsapp_number, address, role) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *"
    )
    .bind(&payload.full_name)
    .bind(&payload.email)
    .bind(password_hash)
    .bind(payload.phone_number.as_ref())
    .bind(payload.whatsapp_number.as_ref())
    .bind(payload.address.as_ref())
    .bind(payload.role)
    .fetch_one(&state.db)
    .await;

    let user = match user_result {
        Ok(u) => u,
        Err(e) => {
            if let Some(db_err) = e.as_database_error() {
                if db_err.is_unique_violation() {
                    return Err(AppError::BadRequest("A user with this email or phone number already exists".to_string()));
                }
            }
            return Err(e.into());
        }
    };

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
    // Fetch user with verification code info
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(claims.user_id)
        .fetch_optional(&state.db)
        .await?;

    let user = match user {
        Some(u) => u,
        None => return Err(AppError::NotFound("User not found".to_string())),
    };

    // Verify code
    let stored_code = match user.verification_code {
        Some(c) => c,
        None => return Err(AppError::BadRequest("No verification code sent".to_string())),
    };

    if stored_code != payload.code {
        return Err(AppError::BadRequest("Invalid verification code".to_string()));
    }

    // Mark as verified and clear code
    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE id = $1 RETURNING *"
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
    
    // Save verification code to database
    sqlx::query("UPDATE users SET verification_code = $1 WHERE email = $2")
        .bind(&code)
        .bind(&payload.email)
        .execute(&state.db)
        .await?;

    // Send verification email in background (non-blocking)
    let email_service = state.email_service.clone();
    let email = payload.email.clone();
    let code_clone = code.clone();
    tokio::spawn(async move {
        println!("Background process: Preparing to send verification email to {}", email);
        if let Err(e) = email_service.send_verification_email(&email, &code_clone).await {
            eprintln!("ERROR: Failed to send verification email to {}: {:?}", email, e);
        } else {
            println!("Background process: Successfully completed verification email task for {}", email);
        }
    });

    Ok(Json(serde_json::json!({
        "message": "Verification code sent successfully"
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
    let expires_at = Utc::now() + chrono::Duration::minutes(10);
    
    // Save reset code to database
    sqlx::query("UPDATE users SET reset_code = $1, reset_code_expires_at = $2 WHERE email = $3")
        .bind(&reset_code)
        .bind(expires_at)
        .bind(&payload.email)
        .execute(&state.db)
        .await?;

    // Send password reset email in background (non-blocking)
    let email_service = state.email_service.clone();
    let email = payload.email.clone();
    let code_clone = reset_code.clone();
    tokio::spawn(async move {
        println!("Background process: Preparing to send password reset email to {}", email);
        if let Err(e) = email_service.send_password_reset_email(&email, &code_clone).await {
            eprintln!("ERROR: Failed to send password reset email to {}: {:?}", email, e);
        } else {
            println!("Background process: Successfully completed email task for {}", email);
        }
    });

    Ok(Json(serde_json::json!({
        "message": "Password reset code sent to your email"
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
    // Fetch user with reset code info
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?;

    let user = match user {
        Some(u) => u,
        None => return Err(AppError::NotFound("User not found".to_string())),
    };

    // Verify reset code
    let stored_code = match user.reset_code {
        Some(c) => c,
        None => return Err(AppError::BadRequest("No reset code requested".to_string())),
    };

    if stored_code != payload.code {
        return Err(AppError::BadRequest("Invalid reset code".to_string()));
    }

    // Verify expiry
    let expires_at = match user.reset_code_expires_at {
        Some(e) => e,
        None => return Err(AppError::BadRequest("Reset code has no expiration".to_string())),
    };

    if Utc::now() > expires_at {
        return Err(AppError::BadRequest("Reset code has expired".to_string()));
    }

    // Reset password and clear code
    let password_hash = hash_password(&payload.new_password)?;

    sqlx::query(
        "UPDATE users SET password_hash = $1, reset_code = NULL, reset_code_expires_at = NULL WHERE id = $2"
    )
    .bind(&password_hash)
    .bind(user.id)
    .execute(&state.db)
    .await?;

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
    tracing::debug!("Updating patient profile for user: {} with payload: {:?}", claims.user_id, payload);
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
    tracing::debug!("Updating pharmacy info for user: {} with payload: {:?}", claims.user_id, payload);
    
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
    .fetch_optional(&state.db)
    .await?;

    match user {
        Some(u) => {
            tracing::debug!("Successfully updated pharmacy info for user: {}", u.id);
            Ok(Json(u))
        },
        None => {
            tracing::error!("Failed to update pharmacy info: User {} not found in database", claims.user_id);
            Err(AppError::NotFound("User not found".to_string()))
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct PayoutInfoRequest {
    pub bank_name: String,
    pub account_number: String,
    pub account_name: String,
}

pub async fn update_payout_info(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<PayoutInfoRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE users SET bank_name = $1, account_number = $2, account_name = $3, updated_at = NOW() WHERE id = $4"
    )
    .bind(&payload.bank_name)
    .bind(&payload.account_number)
    .bind(&payload.account_name)
    .bind(claims.user_id)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "status": "success", "message": "Payout info updated" })))
}
