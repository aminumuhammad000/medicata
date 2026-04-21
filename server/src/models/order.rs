use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "order_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum OrderStatus {
    #[serde(alias = "Pending")]
    Pending,
    #[serde(alias = "Processing")]
    Processing,
    #[serde(alias = "ReadyForPickup")]
    ReadyForPickup,
    #[serde(alias = "OutForDelivery")]
    OutForDelivery,
    #[serde(alias = "Delivered")]
    Delivered,
    #[serde(alias = "PickedUp")]
    PickedUp,
    #[serde(alias = "Completed")]
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
    pub contact_info: Option<String>,
    pub is_delivery: bool,
    pub preferred_time: Option<DateTime<Utc>>,
    pub total_amount: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    // UI convenience fields
    #[sqlx(default)]
    pub patient_name: Option<String>,
    #[sqlx(default)]
    pub pharmacy_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PharmacyOrderDetails {
    #[serde(flatten)]
    pub order: PharmacyOrder,
    pub items: Vec<OrderItem>,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct OrderItem {
    pub id: Uuid,
    pub order_id: Uuid,
    pub drug_id: Uuid,
    pub quantity: i32,
    pub price: i64,
    pub created_at: DateTime<Utc>,
    
    // Join fields
    #[sqlx(default)]
    pub drug_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderRequest {
    pub pharmacy_id: Uuid,
    pub prescription_id: Option<Uuid>, // From UserJourney.md: Prescription ID
    pub delivery_address: Option<String>, // From UserJourney.md: Address
    pub contact_info: Option<String>, // From UserJourney.md: Contact Info
    pub is_delivery: bool, // From UserJourney.md: Delivery/Pickup
    pub preferred_time: Option<DateTime<Utc>>, // From UserJourney.md: Preferred Time
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: OrderStatus, // From UserJourney.md: Update status
}

#[derive(Debug, Deserialize)]
pub struct AddOrderItemRequest {
    pub drug_id: Uuid,
    pub quantity: i32,
    pub price: i64, // Price per unit in kobo (Naira * 100)
}
