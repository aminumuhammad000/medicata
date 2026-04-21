use axum::{
    routing::{get, post, patch, delete},
    Router,
    middleware as axum_middleware,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod error;
mod state;
mod models;
mod handlers;
mod auth_utils;
mod middleware;
mod websocket;
mod email;

use config::Config;
use state::AppState;
use websocket::create_client_map;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "server=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    
    // Initialize database
    let db = db::init_db(&config.database_url).await?;

    // Create WebSocket client map
    let ws_clients = create_client_map();

    // Initialize email service
    let email_service = Arc::new(email::EmailService::new(&config));

    // Application state
    let state = AppState {
        db,
        config,
        ws_clients,
        email_service,
    };

    // Public routes (no auth required)
    let public_routes = Router::new()
        .route("/auth/register", post(handlers::auth::register))
        .route("/auth/login", post(handlers::auth::login))
        .route("/auth/send-verification", post(handlers::auth::send_verification))
        .route("/auth/forgot-password", post(handlers::auth::forgot_password))
        .route("/auth/reset-password", post(handlers::auth::reset_password))
        .route("/pharmacies/search", get(handlers::profile::search_pharmacies))
        .route("/doctors/search", get(handlers::discovery::search_doctors))
        .route("/doctors/specialties", get(handlers::discovery::get_specialties))
        .route("/doctors/:id/profile", get(handlers::profile::get_doctor_profile))
        .route("/pharmacies/:id", get(handlers::profile::get_pharmacy_profile))
        .route("/prescriptions/verify/:token", get(handlers::prescription::verify_prescription_by_token));

    // Protected routes (auth required)
    let protected_routes = Router::new()
        .route("/auth/verify", post(handlers::auth::verify))
        .route("/patient/health-info", post(handlers::auth::update_patient_health_info))
        .route("/patient/profile", post(handlers::auth::update_patient_profile))
        .route("/doctor/professional-info", post(handlers::auth::update_doctor_professional_info))
        .route("/doctor/bio", post(handlers::auth::update_doctor_bio))
        .route("/doctor/analytics", get(handlers::consultation::get_doctor_analytics))
        .route("/pharmacy/info", post(handlers::auth::update_pharmacy_info))
        .route("/pharmacy/payout-info", post(handlers::auth::update_payout_info))
        .route("/me", get(handlers::profile::get_me))
        .route("/profile/patient", post(handlers::profile::create_patient_profile))
        .route("/profile/doctor", post(handlers::profile::create_doctor_profile))
        .route("/profile/pharmacy", post(handlers::profile::create_pharmacy_profile))
        .route("/consultations", post(handlers::consultation::book_consultation))
        .route("/consultations", get(handlers::consultation::get_my_consultations))
        .route("/consultations/:id/status", patch(handlers::consultation::update_status))
        .route("/consultations/:id/notes", patch(handlers::consultation::add_notes))
        .route("/consultations/:id/feedback", post(handlers::consultation::add_patient_feedback))
        .route("/consultations/:id/messages", get(handlers::message::get_chat_history))
        .route("/prescriptions", post(handlers::prescription::create_prescription))
        .route("/prescriptions", get(handlers::prescription::get_my_prescriptions))
        .route("/prescriptions/:id", get(handlers::prescription::get_prescription_details))
        .route("/prescriptions/:id/share", post(handlers::prescription::share_prescription))
        .route("/prescriptions/reorder", post(handlers::prescription::reorder_prescription))
        .route("/prescriptions/:id/dispense", post(handlers::prescription::dispense_prescription))
        .route("/orders", post(handlers::order::create_order))
        .route("/orders", get(handlers::order::get_my_orders))
        .route("/orders/:id", get(handlers::order::get_order))
        .route("/orders/:id/items", post(handlers::order::add_order_item))
        .route("/orders/:id/status", patch(handlers::order::update_order_status))
        .route("/reviews", post(handlers::review::create_review))
        .route("/reviews", get(handlers::review::get_reviews))
        .route("/notifications", get(handlers::notification::get_my_notifications))
        .route("/notifications/:id/read", patch(handlers::notification::mark_as_read))
        .route("/admin/trigger-reminders", post(handlers::notification::trigger_refill_reminders))
        .route("/wallet/balance", get(handlers::wallet::get_balance))
        .route("/wallet/add", post(handlers::wallet::add_money))
        .route("/wallet/withdraw", post(handlers::wallet::withdraw))
        .route("/wallet/transactions", get(handlers::wallet::get_transactions))
        .route("/settings", get(handlers::settings::get_settings))
        .route("/settings", patch(handlers::settings::update_settings))
        .route("/schedule", post(handlers::schedule::create_schedule))
        .route("/schedule", get(handlers::schedule::get_my_schedule))
        .route("/schedule/:id", delete(handlers::schedule::delete_schedule))
        .route("/availability", post(handlers::schedule::set_availability))
        .route("/availability/:doctor_id/:date", get(handlers::schedule::get_availability))
        .route("/drugs/search", get(handlers::drugs::search_drugs))
        .route("/drugs/categories", get(handlers::drugs::get_categories))
        .route("/drugs", post(handlers::drugs::create_drug))
        .route("/pharmacy/stock", get(handlers::drugs::get_pharmacy_stock))
        .route("/pharmacy/stock", post(handlers::drugs::update_pharmacy_stock))
        .route("/ai/chat", post(handlers::ai_chat::send_message))
        .route("/ai/sessions", get(handlers::ai_chat::get_sessions))
        .route("/ai/sessions/:session_id/history", get(handlers::ai_chat::get_chat_history))
        .route("/payments/initialize", post(handlers::payments::initialize_payment))
        .route("/payments/verify", post(handlers::payments::verify_payment))
        .route("/payments/transactions", get(handlers::payments::get_transactions))
        .layer(axum_middleware::from_fn_with_state(state.clone(), crate::middleware::auth::auth_middleware));

    // Combined router nested under /api
    let api_router = Router::new()
        .merge(public_routes)
        .merge(protected_routes);

    // Main app router
    let app = Router::new()
        .route("/", get(handler))
        .route("/health", get(health_check))
        .route("/ws", get(websocket::websocket_handler))
        .nest("/api", api_router)
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(state.clone());

    // Run our app with hyper
    let addr = SocketAddr::from(([0, 0, 0, 0], state.config.port));
    tracing::debug!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

async fn handler() -> &'static str {
    "Hello, Medicat!"
}

async fn health_check() -> &'static str {
    "OK"
}
