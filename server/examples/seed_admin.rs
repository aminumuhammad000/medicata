use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, SaltString},
    Argon2,
};
use sqlx::postgres::PgPoolOptions;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Patient,
    Doctor,
    Pharmacy,
    Admin,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    println!("Connecting to: {}", database_url);
    
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Verify connection
    sqlx::query("SELECT 1").execute(&pool).await.expect("Failed to execute test query");
    println!("Database connection verified.");

    // Hash password
    let password = "admin123";
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!(e.to_string()))?
        .to_string();
    
    let result = sqlx::query(
        "INSERT INTO users (full_name, email, password_hash, role, is_verified) 
         VALUES ('System Administrator', 'admin@medicata.com', $1, $2, TRUE)
         ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = $2"
    )
    .bind(password_hash)
    .bind(UserRole::Admin)
    .execute(&pool)
    .await
    .expect("Failed to insert admin user");

    println!("Rows affected: {}", result.rows_affected());
    println!("Successfully seeded admin user!");
    Ok(())
}
