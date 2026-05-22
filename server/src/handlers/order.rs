use axum::{
    extract::{State, Path},
    Json,
};
use sqlx::Row;
use uuid::Uuid;
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
    claims: Claims,
    Json(payload): Json<CreateOrderRequest>,
) -> Result<Json<PharmacyOrder>, AppError> {
    if claims.role != UserRole::Patient {
        return Err(AppError::Forbidden("Only patients can place orders".to_string()));
    }

    let mut tx = state.db.begin().await?;

    // 1. Create the main order record
    let order = sqlx::query_as::<_, PharmacyOrder>(
        "INSERT INTO pharmacy_orders (patient_id, pharmacy_id, prescription_id, delivery_address, contact_info, is_delivery, preferred_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *, (SELECT 0::BIGINT) as total_amount"
    )
    .bind(claims.sub)
    .bind(payload.pharmacy_id)
    .bind(payload.prescription_id)
    .bind(payload.delivery_address)
    .bind(payload.contact_info) // From UserJourney.md: Contact Info
    .bind(payload.is_delivery)
    .bind(payload.preferred_time)
    .fetch_one(&mut *tx)
    .await?;

    // 2. If a prescription is attached, automatically copy items to the order
    if let Some(prescription_id) = payload.prescription_id {
        tracing::debug!("Processing prescription items for prescription: {}", prescription_id);
        
        // Fetch items from prescription
        let prescription_items = sqlx::query(
            "SELECT drug_id, quantity FROM prescription_items WHERE prescription_id = $1"
        )
        .bind(prescription_id)
        .fetch_all(&mut *tx)
        .await?;

        if prescription_items.is_empty() {
            tracing::warn!("No items found for prescription: {}", prescription_id);
        }

        for item_row in prescription_items {
            let drug_id: Uuid = item_row.get("drug_id");
            let quantity: i32 = item_row.get("quantity");
            
            // Get pharmacy price for this drug (default to 1500 as a placeholder if not set)
            let price_row = sqlx::query(
                "SELECT price FROM pharmacy_stock WHERE pharmacy_id = $1 AND drug_id = $2"
            )
            .bind(payload.pharmacy_id)
            .bind(drug_id)
            .fetch_optional(&mut *tx)
            .await?;

            // Use pharmacy price if available, otherwise use a default MVP price (1500)
            let price = match price_row {
                Some(r) => r.get::<i64, _>("price"),
                None => 1500,
            };

            tracing::debug!("Adding item to order: drug_id={}, quantity={}, price={}", drug_id, quantity, price);

            // Insert into order_items
            sqlx::query(
                "INSERT INTO order_items (order_id, drug_id, quantity, price) VALUES ($1, $2, $3, $4)"
            )
            .bind(order.id)
            .bind(drug_id)
            .bind(quantity)
            .bind(price as i64)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;

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
    claims: Claims,
) -> Result<Json<Vec<PharmacyOrderDetails>>, AppError> {
    tracing::debug!("[DEBUG] get_my_orders called for user={}, role={:?}", claims.sub, claims.role);

    let query = match claims.role {
        UserRole::Patient => 
            "SELECT o.*, u.full_name as pharmacy_name,
             COALESCE((SELECT SUM(price * quantity) FROM order_items WHERE order_id = o.id), 0)::BIGINT as total_amount
             FROM pharmacy_orders o
             JOIN users u ON o.pharmacy_id = u.id
             WHERE o.patient_id = $1 
             ORDER BY o.created_at DESC",
        UserRole::Pharmacy => 
            "SELECT o.*, u.full_name as patient_name,
             COALESCE((SELECT SUM(price * quantity) FROM order_items WHERE order_id = o.id), 0)::BIGINT as total_amount
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

    tracing::debug!("[DEBUG] Found {} orders in database", orders.len());

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
    claims: Claims,
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
    claims: Claims,
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
    claims: Claims,
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

pub async fn pay_order_with_wallet(
    State(state): State<AppState>,
    claims: Claims,
    Path(order_id): Path<uuid::Uuid>,
) -> Result<Json<PharmacyOrder>, AppError> {
    // 1. Get order and total amount manually to avoid macro issues
    let order_row = sqlx::query(
        r#"
        SELECT o.id, o.patient_id, o.pharmacy_id, o.status,
               COALESCE((SELECT SUM(price * quantity) FROM order_items WHERE order_id = o.id), 0)::BIGINT as total_amount
        FROM pharmacy_orders o
        WHERE o.id = $1 AND o.patient_id = $2
        "#
    )
    .bind(order_id)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    let order_status: String = order_row.get("status");
    let total_amount: i64 = order_row.get("total_amount");
    let pharmacy_id: uuid::Uuid = order_row.get("pharmacy_id");

    if order_status != "pending" {
        return Err(AppError::BadRequest("Order is already paid or processed".to_string()));
    }

    if total_amount <= 0 {
        return Err(AppError::BadRequest("Order has no items or zero total".to_string()));
    }

    // 2. Perform wallet deduction and order update in a transaction
    let mut tx = state.db.begin().await?;

    // Check balance and deduct
    let wallet_row = sqlx::query(
        "SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE"
    )
    .bind(claims.sub)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::BadRequest("Wallet not found".to_string()))?;

    let wallet_id: uuid::Uuid = wallet_row.get("id");
    let balance: i64 = wallet_row.get("balance");

    if balance < total_amount {
        return Err(AppError::BadRequest("Insufficient wallet balance".to_string()));
    }

    // Deduct from wallet
    sqlx::query(
        "UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2"
    )
    .bind(total_amount)
    .bind(wallet_id)
    .execute(&mut *tx)
    .await?;

    // Record transaction
    sqlx::query(
        "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description, status) 
         VALUES ($1, 'payment', $2, $3, 'completed')"
    )
    .bind(wallet_id)
    .bind(total_amount)
    .bind(format!("Payment for Order #{}", &order_id.to_string()[..8]))
    .execute(&mut *tx)
    .await?;

    // Update order status
    let updated_order = sqlx::query_as::<_, PharmacyOrder>(
        "UPDATE pharmacy_orders 
         SET status = 'processing', payment_status = 'paid', payment_method = 'wallet', updated_at = NOW() 
         WHERE id = $1 
         RETURNING *"
    )
    .bind(order_id)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;

    // 3. Notify pharmacy
    let _ = create_notification(
        &state,
        pharmacy_id,
        "Order Paid",
        &format!("Order #{} has been paid via wallet and is ready for processing.", &order_id.to_string()[..8]),
        "order"
    ).await;

    Ok(Json(updated_order))
}

pub async fn get_pharmacy_analytics(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<crate::models::order::PharmacyAnalytics>, AppError> {
    if claims.role != UserRole::Pharmacy {
        return Err(AppError::Forbidden("Only pharmacies can access their analytics".to_string()));
    }

    // 1. Get order counts and revenue
    let record: (Option<i64>, Option<i64>, Option<i64>) = sqlx::query_as(
        r#"
           SELECT 
               COUNT(*) as total_count,
               COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
               COALESCE(SUM((SELECT SUM(price * quantity) FROM order_items WHERE order_id = o.id)), 0)::BIGINT as total_revenue
           FROM pharmacy_orders o
           WHERE pharmacy_id = $1
        "#
    )
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    // 2. Count prescriptions received (where prescription_id is not null)
    let prescriptions_received = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pharmacy_orders WHERE pharmacy_id = $1 AND prescription_id IS NOT NULL"
    )
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(crate::models::order::PharmacyAnalytics {
        total_orders: record.0.unwrap_or(0),
        pending_orders: record.1.unwrap_or(0),
        total_revenue: record.2.unwrap_or(0),
        prescriptions_received,
    }))
}
