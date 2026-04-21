use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use crate::{
    error::AppError,
    models::{
        order::{PharmacyOrder, PharmacyOrderDetails, OrderItem, CreateOrderRequest, UpdateOrderStatusRequest, AddOrderItemRequest},
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
) -> Result<Json<Vec<PharmacyOrderDetails>>, AppError> {
    let query = match claims.role {
        UserRole::Patient => 
            "SELECT o.*, u.full_name as pharmacy_name,
             (SELECT SUM(price * quantity) FROM order_items WHERE order_id = o.id) as total_amount
             FROM pharmacy_orders o
             JOIN users u ON o.pharmacy_id = u.id
             WHERE o.patient_id = $1 
             ORDER BY o.created_at DESC",
        UserRole::Pharmacy => 
            "SELECT o.*, u.full_name as patient_name,
             (SELECT SUM(price * quantity) FROM order_items WHERE order_id = o.id) as total_amount
             FROM pharmacy_orders o
             JOIN users u ON o.patient_id = u.id
             WHERE o.pharmacy_id = $1 
             ORDER BY o.created_at DESC",
        _ => return Err(AppError::Forbidden("Unauthorized role for orders".to_string())),
    };

    let orders = sqlx::query_as::<_, PharmacyOrder>(query)
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await?;

    let mut detailed_orders = Vec::new();

    // Fetch items for each order
    for order in orders {
        let items = sqlx::query_as::<_, OrderItem>(
            "SELECT oi.*, d.name as drug_name
             FROM order_items oi
             JOIN drugs d ON oi.drug_id = d.id
             WHERE oi.order_id = $1"
        )
        .bind(order.id)
        .fetch_all(&state.db)
        .await?;
        
        detailed_orders.push(PharmacyOrderDetails {
            order,
            items,
        });
    }

    Ok(Json(detailed_orders))
}

pub async fn get_order(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<PharmacyOrderDetails>, AppError> {
    let order = sqlx::query_as::<_, PharmacyOrder>(
        "SELECT o.*, u.full_name as patient_name, p.full_name as pharmacy_name,
         (SELECT SUM(price * quantity) FROM order_items WHERE order_id = o.id) as total_amount
         FROM pharmacy_orders o
         LEFT JOIN users u ON o.patient_id = u.id
         LEFT JOIN users p ON o.pharmacy_id = p.id
         WHERE o.id = $1 AND (o.patient_id = $2 OR o.pharmacy_id = $2)"
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("Order not found or access denied".to_string()))?;

    let items = sqlx::query_as::<_, OrderItem>(
        "SELECT oi.*, d.name as drug_name
         FROM order_items oi
         JOIN drugs d ON oi.drug_id = d.id
         WHERE oi.order_id = $1"
    )
    .bind(order.id)
    .fetch_all(&state.db)
    .await?;
    
    Ok(Json(PharmacyOrderDetails {
        order,
        items,
    }))
}

// Add item to existing order (for pharmacies to add medications)
pub async fn add_order_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(order_id): Path<uuid::Uuid>,
    Json(payload): Json<AddOrderItemRequest>,
) -> Result<Json<OrderItem>, AppError> {
    if claims.role != UserRole::Pharmacy {
        return Err(AppError::Forbidden("Only pharmacies can add order items".to_string()));
    }

    // Verify the order belongs to this pharmacy
    let order_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM pharmacy_orders WHERE id = $1 AND pharmacy_id = $2)"
    )
    .bind(order_id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    if !order_exists {
        return Err(AppError::Forbidden("Order not found or does not belong to this pharmacy".to_string()));
    }

    let item = sqlx::query_as::<_, OrderItem>(
        "INSERT INTO order_items (order_id, drug_id, quantity, price)
         VALUES ($1, $2, $3, $4)
         RETURNING id, order_id, drug_id, quantity, price, created_at"
    )
    .bind(order_id)
    .bind(payload.drug_id)
    .bind(payload.quantity)
    .bind(payload.price)
    .fetch_one(&state.db)
    .await?;

    // Fetch drug name for the response
    let item_with_name = sqlx::query_as::<_, OrderItem>(
        "SELECT oi.*, d.name as drug_name
         FROM order_items oi
         JOIN drugs d ON oi.drug_id = d.id
         WHERE oi.id = $1"
    )
    .bind(item.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(item_with_name))
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
