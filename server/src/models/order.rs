use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "order_status", rename_all = "snake_case")]
pub enum OrderStatus {
    Pending,
    Processing,
    ReadyForPickup,
    OutForDelivery,
    Delivered,
    Completed,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PharmacyOrder {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub pharmacy_id: Uuid,
    pub prescription_id: Option<Uuid>,
    pub status: OrderStatus,
    pub delivery_address: Option<String>,
    pub is_delivery: bool,
    pub preferred_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderRequest {
    pub pharmacy_id: Uuid,
    pub prescription_id: Option<Uuid>,
    pub delivery_address: Option<String>,
    pub is_delivery: bool,
    pub preferred_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: OrderStatus,
}
