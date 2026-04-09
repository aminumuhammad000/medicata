use axum::{
    routing::{get, post, patch},
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

    // Public routes
    let public_routes = Router::new()
        .route("/", get(handler))
        .route("/health", get(health_check))
        .route("/api/auth/register", post(handlers::auth::register))
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/auth/send-verification", post(handlers::auth::send_verification))
        .route("/api/auth/forgot-password", post(handlers::auth::forgot_password))
        .route("/api/auth/reset-password", post(handlers::auth::reset_password))
        .route("/api/doctors/search", get(handlers::profile::search_doctors))
        .route("/api/pharmacies/search", get(handlers::profile::search_pharmacies))
        .route("/api/drugs/search", get(handlers::prescription::search_drugs))
        .route("/ws", get(websocket::websocket_handler));

    // Protected routes
    let protected_routes = Router::new()
        // From UserJourney.md: Verification
        .route("/api/auth/verify", post(handlers::auth::verify))
        // From UserJourney.md Patient Onboarding
        .route("/api/patient/health-info", post(handlers::auth::update_patient_health_info))
        .route("/api/patient/profile", post(handlers::auth::update_patient_profile))
        // From UserJourney.md Doctor Onboarding
        .route("/api/doctor/professional-info", post(handlers::auth::update_doctor_professional_info))
        .route("/api/doctor/bio", post(handlers::auth::update_doctor_bio))
        // From UserJourney.md Pharmacy Onboarding
        .route("/api/pharmacy/info", post(handlers::auth::update_pharmacy_info))
        // Existing routes
        .route("/me", get(handlers::profile::get_me))
        .route("/profile/patient", post(handlers::profile::create_patient_profile))
        .route("/profile/doctor", post(handlers::profile::create_doctor_profile))
        .route("/profile/pharmacy", post(handlers::profile::create_pharmacy_profile))
        // From UserJourney.md Consultation Flow
        .route("/consultations", post(handlers::consultation::book_consultation))
        .route("/consultations", get(handlers::consultation::get_my_consultations))
        .route("/consultations/:id/status", patch(handlers::consultation::update_status))
        .route("/consultations/:id/notes", patch(handlers::consultation::add_notes))
        .route("/consultations/:id/feedback", post(handlers::consultation::add_patient_feedback))
        // From UserJourney.md Prescription Workflow
        .route("/prescriptions", post(handlers::prescription::create_prescription))
        .route("/prescriptions/:id", get(handlers::prescription::get_prescription_details))
        .route("/prescriptions/:id/share", post(handlers::prescription::share_prescription))
        .route("/prescriptions/reorder", post(handlers::prescription::reorder_prescription))
        // From UserJourney.md Pharmacy Interaction Flow
        .route("/orders", post(handlers::order::create_order))
        .route("/orders", get(handlers::order::get_my_orders))
        .route("/orders/:id/status", patch(handlers::order::update_order_status))
        // Notifications
        .route("/reviews", post(handlers::review::create_review))
        .route("/notifications", get(handlers::notification::get_my_notifications))
        .route("/notifications/:id/read", patch(handlers::notification::mark_as_read))
        .route("/admin/trigger-reminders", post(handlers::notification::trigger_refill_reminders))
        .route("/reviews", get(handlers::review::get_reviews))
        .layer(axum_middleware::from_fn_with_state(state.clone(), crate::middleware::auth::auth_middleware));

    // Build our application with routes
    let app = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
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
