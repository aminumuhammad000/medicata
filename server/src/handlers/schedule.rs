use axum::{
    extract::{Path, State, Extension},
    Json,
};
use chrono::{NaiveDate, NaiveTime};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    error::AppError,
    auth_utils::Claims,
    state::AppState,
};



#[derive(Debug, Deserialize)]
pub struct CreateScheduleRequest {
    pub day_of_week: i32,
    pub start_time: String,
    pub end_time: String,
    pub slot_duration_minutes: Option<i32>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ScheduleResponse {
    pub id: Uuid,
    pub day_of_week: i32,
    pub start_time: String,
    pub end_time: String,
    pub slot_duration_minutes: i32,
    pub is_available: bool,
}

pub async fn create_schedule(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateScheduleRequest>,
) -> Result<Json<ScheduleResponse>, AppError> {
    let start_time = NaiveTime::parse_from_str(&payload.start_time, "%H:%M")
        .map_err(|_| AppError::bad_request("Invalid start_time format"))?;
    
    let end_time = NaiveTime::parse_from_str(&payload.end_time, "%H:%M")
        .map_err(|_| AppError::bad_request("Invalid end_time format"))?;

    let row = sqlx::query_as::<_, ScheduleResponse>(
        "INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (doctor_id, day_of_week) DO UPDATE SET
         start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time,
         slot_duration_minutes = EXCLUDED.slot_duration_minutes, updated_at = NOW()
         RETURNING id, day_of_week, start_time::text, end_time::text, slot_duration_minutes, is_available"
    )
    .bind(claims.sub)
    .bind(payload.day_of_week)
    .bind(start_time)
    .bind(end_time)
    .bind(payload.slot_duration_minutes.unwrap_or(30))
    .fetch_one(&state.db)
    .await?;

    Ok(Json(row))
}

pub async fn get_my_schedule(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<ScheduleResponse>>, AppError> {
    let rows = sqlx::query_as::<_, ScheduleResponse>(
        "SELECT id, day_of_week, start_time::text, end_time::text, slot_duration_minutes, is_available
         FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week"
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows))
}

pub async fn delete_schedule(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM doctor_schedules WHERE id = $1 AND doctor_id = $2")
        .bind(id)
        .bind(claims.sub)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({"success": true})))
}

#[derive(Debug, Deserialize)]
pub struct AvailabilityRequest {
    pub date: NaiveDate,
    pub slots: Vec<TimeSlot>,
}

#[derive(Debug, Deserialize)]
pub struct TimeSlot {
    pub start_time: String,
    pub end_time: String,
}

pub async fn set_availability(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<AvailabilityRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Clear existing availability for this date
    sqlx::query("DELETE FROM doctor_availability WHERE doctor_id = $1 AND date = $2")
        .bind(claims.sub)
        .bind(payload.date)
        .execute(&state.db)
        .await?;

    // Insert new slots
    for slot in &payload.slots {
        let start = NaiveTime::parse_from_str(&slot.start_time, "%H:%M")
            .map_err(|_| AppError::bad_request("Invalid time format"))?;
        let end = NaiveTime::parse_from_str(&slot.end_time, "%H:%M")
            .map_err(|_| AppError::bad_request("Invalid time format"))?;

        sqlx::query(
            "INSERT INTO doctor_availability (doctor_id, date, start_time, end_time)
             VALUES ($1, $2, $3, $4)"
        )
        .bind(claims.sub)
        .bind(payload.date)
        .bind(start)
        .bind(end)
        .execute(&state.db)
        .await?;
    }

    Ok(Json(serde_json::json!({"success": true, "slots_created": payload.slots.len()})))
}

pub async fn get_availability(
    State(state): State<AppState>,
    Path((doctor_id, date)): Path<(Uuid, NaiveDate)>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let rows = sqlx::query_as::<_, (Uuid, NaiveDate, NaiveTime, NaiveTime, bool)>(
        "SELECT id, date, start_time, end_time, is_booked
         FROM doctor_availability WHERE doctor_id = $1 AND date = $2 ORDER BY start_time"
    )
    .bind(doctor_id)
    .bind(date)
    .fetch_all(&state.db)
    .await?;

    let slots: Vec<_> = rows.into_iter().map(|(id, date, start, end, booked)| {
        serde_json::json!({
            "id": id,
            "date": date,
            "start_time": start.to_string(),
            "end_time": end.to_string(),
            "is_booked": booked
        })
    }).collect();

    Ok(Json(slots))
}
