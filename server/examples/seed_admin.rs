use anyhow::Context;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use sqlx::postgres::PgPoolOptions;
use std::env;

#[derive(Debug, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
enum UserRole {
    Patient,
    Doctor,
    Pharmacy,
    Admin,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let database_url = env::var("DATABASE_URL").context("DATABASE_URL must be set")?;
    let admin_email = env::var("ADMIN_EMAIL").unwrap_or_else(|_| "admin@medicata.com".to_string());
    let admin_password = env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "admin123".to_string());
    let admin_full_name = env::var("ADMIN_FULL_NAME").unwrap_or_else(|_| "System Administrator".to_string());
    let admin_phone_number = env::var("ADMIN_PHONE_NUMBER").unwrap_or_else(|_| "+2340000000000".to_string());

    println!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await
        .context("Failed to connect to database")?;

    sqlx::query("SELECT 1")
        .execute(&pool)
        .await
        .context("Failed to execute test query")?;
    println!("Database connection verified.");

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(admin_password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!(e.to_string()))?
        .to_string();

    let result = sqlx::query(
        "INSERT INTO users (full_name, email, password_hash, phone_number, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (email) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             password_hash = EXCLUDED.password_hash,
             phone_number = EXCLUDED.phone_number,
             role = EXCLUDED.role,
             is_verified = TRUE"
    )
    .bind(&admin_full_name)
    .bind(&admin_email)
    .bind(password_hash)
    .bind(&admin_phone_number)
    .bind(UserRole::Admin)
    .execute(&pool)
    .await
    .context("Failed to create or update admin user")?;

    println!("Rows affected: {}", result.rows_affected());
    println!("Admin account ready.");
    println!("Email: {}", admin_email);
    println!("Password: {}", admin_password);
    Ok(())
}
