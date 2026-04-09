use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "order_status", rename_all = "snake_case")]
pub enum OrderStatus {
    Pending, // From UserJourney.md: Pending / Processing
    Processing, // From UserJourney.md: Pending / Processing
    ReadyForPickup, // From UserJourney.md: Ready for Pickup
    OutForDelivery, // From UserJourney.md: Out for Delivery
    Delivered, // From UserJourney.md: Delivered
    PickedUp, // From UserJourney.md: Picked Up
    Completed, // From UserJourney.md: Completed
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PharmacyOrder {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub pharmacy_id: Uuid,
    pub prescription_id: Option<Uuid>, // From UserJourney.md: Prescription ID
    pub status: OrderStatus, // From UserJourney.md: Status (Pending/Processing/Ready/Delivered/Picked Up)
    pub delivery_address: Option<String>, // From UserJourney.md: Address
    pub contact_info: Option<String>, // From UserJourney.md: Contact Info
    pub is_delivery: bool, // From UserJourney.md: Delivery/Pickup
    pub preferred_time: Option<DateTime<Utc>>, // From UserJourney.md: Preferred Time
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
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
