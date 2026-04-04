use axum::{
    extract::{State, Query},
    Json,
    Extension,
};
use serde::Deserialize;
use uuid::Uuid;
use crate::{
    error::AppError,
    models::review::{Review, CreateReviewRequest},
    state::AppState,
    auth_utils::Claims,
};

pub async fn create_review(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateReviewRequest>,
) -> Result<Json<Review>, AppError> {
    if payload.rating < 1 || payload.rating > 5 {
        return Err(AppError::ValidationError("Rating must be between 1 and 5".to_string()));
    }

    // Start a transaction to ensure atomicity
    let mut tx = state.db.begin().await?;

    // Insert the review
    let review = sqlx::query_as::<_, Review>(
        "INSERT INTO reviews (reviewer_id, target_id, rating, comment) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *"
    )
    .bind(claims.sub)
    .bind(payload.target_id)
    .bind(payload.rating)
    .bind(payload.comment)
    .fetch_one(&mut *tx)
    .await?;

    // Update target rating and count (Doctor or Pharmacy)
    // We'll check the target's role
    let target_role = sqlx::query_scalar::<_, String>("SELECT role::text FROM users WHERE id = $1")
        .bind(payload.target_id)
        .fetch_one(&mut *tx)
        .await?;

    if target_role == "doctor" {
        sqlx::query(
            "UPDATE doctor_profiles 
             SET rating = (rating * review_count + $1) / (review_count + 1), 
                 review_count = review_count + 1 
             WHERE user_id = $2"
        )
        .bind(payload.rating as f64)
        .bind(payload.target_id)
        .execute(&mut *tx)
        .await?;
    } else if target_role == "pharmacy" {
        sqlx::query(
            "UPDATE pharmacy_profiles 
             SET rating = (rating * (SELECT count(*) FROM reviews WHERE target_id = $2) + $1) / 
                          ((SELECT count(*) FROM reviews WHERE target_id = $2) + 1)
             WHERE user_id = $2"
        )
        .bind(payload.rating as f64)
        .bind(payload.target_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(review))
}

#[derive(Debug, Deserialize)]
pub struct GetReviewsQuery {
    pub target_id: Uuid,
}

pub async fn get_reviews(
    State(state): State<AppState>,
    Query(params): Query<GetReviewsQuery>,
) -> Result<Json<Vec<Review>>, AppError> {
    let reviews = sqlx::query_as::<_, Review>(
        "SELECT * FROM reviews WHERE target_id = $1 ORDER BY created_at DESC"
    )
    .bind(params.target_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(reviews))
}
