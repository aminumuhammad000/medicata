use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::{
        order::{PharmacyOrder, CreateOrderRequest, UpdateOrderStatusRequest},
        user::UserRole,
    },
    state::AppState,
    auth_utils::Claims,
    handlers::notification::create_notification,
};

// From UserJourney.md Pharmacy Interaction Flow: Order Medicines
pub async fn create_order(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateOrderRequest>,
) -> Result<Json<PharmacyOrder>, AppError> {
    if claims.role != UserRole::Patient {
        return Err(AppError::Forbidden("Only patients can place orders".to_string()));
    }

    let order = sqlx::query_as::<_, PharmacyOrder>(
        "INSERT INTO pharmacy_orders (patient_id, pharmacy_id, prescription_id, delivery_address, contact_info, is_delivery, preferred_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *"
    )
    .bind(claims.sub)
    .bind(payload.pharmacy_id)
    .bind(payload.prescription_id)
    .bind(payload.delivery_address)
    .bind(payload.contact_info) // From UserJourney.md: Contact Info
    .bind(payload.is_delivery)
    .bind(payload.preferred_time)
    .fetch_one(&state.db)
    .await?;

    // From UserJourney.md: Notify pharmacy of new order
    let _ = create_notification(
        &state,
        order.pharmacy_id,
        "New Medication Order",
        &format!("You have a new medicine order from patient {}", order.patient_id),
        "order"
    ).await;

    Ok(Json(order))
}

pub async fn get_my_orders(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<PharmacyOrder>>, AppError> {
    let query = match claims.role {
        UserRole::Patient => "SELECT * FROM pharmacy_orders WHERE patient_id = $1 ORDER BY created_at DESC",
        UserRole::Pharmacy => "SELECT * FROM pharmacy_orders WHERE pharmacy_id = $1 ORDER BY created_at DESC",
        _ => return Err(AppError::Forbidden("Unauthorized role for orders".to_string())),
    };

    let orders = sqlx::query_as::<_, PharmacyOrder>(query)
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await?;

    Ok(Json(orders))
}

// From UserJourney.md Pharmacy Interaction Flow: Update Order Status
pub async fn update_order_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateOrderStatusRequest>,
) -> Result<Json<PharmacyOrder>, AppError> {
    if claims.role != UserRole::Pharmacy {
        return Err(AppError::Forbidden("Only pharmacies can update order status".to_string()));
    }

    let order = sqlx::query_as::<_, PharmacyOrder>(
        "UPDATE pharmacy_orders SET status = $1, updated_at = NOW() 
         WHERE id = $2 AND pharmacy_id = $3 
         RETURNING *"
    )
    .bind(payload.status)
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    // From UserJourney.md: Notify patient of order update
    let _ = create_notification(
        &state,
        order.patient_id,
        "Order Update",
        &format!("Your order status has been updated to {:?}", order.status),
        "order"
    ).await;

    Ok(Json(order))
}
