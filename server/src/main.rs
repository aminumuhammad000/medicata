use axum::{
    routing::{get, post, patch, put, delete},
    Router,
    middleware as axum_middleware,
};
use axum::http::{Method, header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE, ORIGIN}};
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
        db: db.clone(),
        config: config.clone(),
        ws_clients,
        email_service,
    };

    // Seed admin user if not exists
    let admin_exists = sqlx::query("SELECT 1 FROM users WHERE email = 'admin@medicata.com'")
        .fetch_optional(&db)
        .await?;

    if admin_exists.is_none() {
        let password_hash = crate::auth_utils::hash_password("admin123")?;
        sqlx::query(
            "INSERT INTO users (full_name, email, password_hash, phone_number, role, is_verified) 
             VALUES ('System Administrator', 'admin@medicata.com', $1, '0000000000', $2, TRUE)"
        )
        .bind(password_hash)
        .bind(crate::models::user::UserRole::Admin)
        .execute(&db)
        .await?;
        tracing::info!("Seeded default admin user: admin@medicata.com");
    }

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
        .route("/patients/search", get(handlers::discovery::search_patients))
        .route("/prescriptions/verify/:token", get(handlers::prescription::verify_prescription_by_token));

    // Protected routes (auth required)
    let protected_routes = Router::new()
        .route("/patients/:id/history", get(handlers::consultation::get_patient_history))
        .route("/auth/verify", post(handlers::auth::verify))
        .route("/auth/push-token", post(handlers::auth::update_push_token))
        .route("/patient/health-info", post(handlers::auth::update_patient_health_info))
        .route("/patient/profile", post(handlers::auth::update_patient_profile))
        .route("/doctor/professional-info", post(handlers::auth::update_doctor_professional_info))
        .route("/doctor/verify", post(handlers::auth::upload_verification_documents))
        .route("/doctor/bio", post(handlers::auth::update_doctor_bio))
        .route("/doctor/profile", patch(handlers::auth::update_doctor_profile))
        .route("/doctor/analytics", get(handlers::consultation::get_doctor_analytics))
        .route("/pharmacy/info", post(handlers::auth::update_pharmacy_info))
        .route("/pharmacy/payout-info", post(handlers::auth::update_payout_info))
        .route("/me", get(handlers::profile::get_me))
        .route("/profile/patient", post(handlers::profile::create_patient_profile))
        .route("/profile/doctor", post(handlers::profile::create_doctor_profile))
        .route("/profile/pharmacy", post(handlers::profile::create_pharmacy_profile))
        .route("/profile/photo", post(handlers::profile::update_profile_photo))
        .route("/consultations", post(handlers::consultation::book_consultation))
        .route("/consultations", get(handlers::consultation::get_my_consultations))
        .route("/consultations/:id/status", patch(handlers::consultation::update_status))
        .route("/consultations/:id/notes", patch(handlers::consultation::add_notes))
        .route("/consultations/labs", post(handlers::consultation::request_lab_test))
        .route("/consultations/:id/lab-tests", get(handlers::consultation::get_consultation_lab_tests))
        .route("/consultations/:id/prescriptions", get(handlers::consultation::get_consultation_prescriptions))
        .route("/lab-tests/:id", get(handlers::consultation::get_lab_test))
        .route("/lab-tests/:id/status", patch(handlers::consultation::update_lab_test_status))
        .route("/lab-tests/:id/results", post(handlers::consultation::upload_lab_result))
        .route("/consultations/:id/feedback", post(handlers::consultation::add_patient_feedback))
        .route("/consultations/:id/join-video", get(handlers::livekit::get_join_token))
        .route("/consultations/labs/upload/:id", post(handlers::consultation::upload_lab_result))
        .route("/consultations/labs/comment/:id", post(handlers::consultation::add_lab_test_comment))
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
        .route("/orders/:id/pay-wallet", post(handlers::order::pay_order_with_wallet))
        .route("/orders/:id/items", post(handlers::order::add_order_item))
        .route("/orders/:id/status", patch(handlers::order::update_order_status))
        .route("/pharmacy/analytics", get(handlers::order::get_pharmacy_analytics))
        .route("/reviews", post(handlers::review::create_review))
        .route("/reviews", get(handlers::review::get_reviews))
        .route("/notifications", get(handlers::notification::get_my_notifications))
        .route("/notifications/:id/read", patch(handlers::notification::mark_as_read))
        .route("/admin/trigger-reminders", post(handlers::notification::trigger_refill_reminders))
        .route("/wallet/balance", get(handlers::wallet::get_balance))
        .route("/wallet/add", post(handlers::wallet::add_money))
        .route("/wallet/checkout/initialize", post(handlers::wallet::initialize_checkout))
        .route("/wallet/status/:reference", get(handlers::wallet::check_session_status))
        .route("/wallet/withdraw", post(handlers::wallet::withdraw))
        .route("/wallet/transactions", get(handlers::wallet::get_transactions))
        .route("/settings", get(handlers::settings::get_settings))
        .route("/settings", patch(handlers::settings::update_settings))
        .route("/system-settings", get(handlers::settings::get_system_settings))
        .route("/system-settings", patch(handlers::settings::update_system_settings))
        .route("/schedule", post(handlers::schedule::create_schedule))
        .route("/schedule", get(handlers::schedule::get_my_schedule))
        .route("/schedule/:id", delete(handlers::schedule::delete_schedule))
        .route("/availability", post(handlers::schedule::set_availability))
        .route("/availability/:doctor_id/:date", get(handlers::schedule::get_availability))
        .route("/drugs/search", get(handlers::drugs::search_drugs))
        .route("/webhooks/vtstack", post(handlers::wallet::vtstack_webhook))
        .route("/drugs/categories", get(handlers::drugs::get_categories))
        .route("/drugs", post(handlers::drugs::create_drug))
        .route("/pharmacy/stock", get(handlers::drugs::get_pharmacy_stock))
        .route("/pharmacy/stock", post(handlers::drugs::update_pharmacy_stock))
        .route("/ai/chat", post(handlers::ai_chat::send_message))
        .route("/ai/sessions", get(handlers::ai_chat::get_sessions))
        .route("/ai/sessions/:session_id/history", get(handlers::ai_chat::get_chat_history))
        .route("/ai/sessions/:session_id", delete(handlers::ai_chat::delete_session))
        .route("/payments/initialize", post(handlers::payments::initialize_payment))
        .route("/payments/verify", post(handlers::payments::verify_payment))
        .route("/payments/transactions", get(handlers::payments::get_transactions))
        .route("/medication/reminders", post(handlers::medication::create_reminder))
        .route("/medication/reminders", get(handlers::medication::get_my_reminders))
        .route("/medication/reminders/:id", patch(handlers::medication::update_reminder_status))
        .route("/medication/reminders/:id", delete(handlers::medication::delete_reminder))
        .layer(axum_middleware::from_fn_with_state(state.clone(), crate::middleware::auth::auth_middleware));

    let admin_routes = Router::new()
        .route("/stats", get(handlers::admin::get_admin_stats))
        .route("/pending-doctors", get(handlers::admin::get_pending_doctors))
        .route("/verify-doctor/:id", post(handlers::admin::verify_doctor))
        .route("/trigger-emergency", post(handlers::admin::trigger_test_emergency))
        .route("/patients", get(handlers::admin::get_all_patients))
        .route("/patients/:id", delete(handlers::admin::delete_patient))
        .route("/doctors", get(handlers::admin::get_all_doctors))
        .route("/doctors/:id", delete(handlers::admin::delete_doctor))
        .route("/inventory", get(handlers::admin::get_inventory))
        .route("/inventory", post(handlers::admin::add_inventory_item))
        .route("/inventory/:id", put(handlers::admin::update_inventory_item))
        .route("/inventory/:id", delete(handlers::admin::delete_inventory_item))
        .route("/pharmacies", get(handlers::admin::get_all_pharmacies))
        .route("/pharmacies/:id", delete(handlers::admin::delete_pharmacy))
        .route("/orders", get(handlers::admin::get_all_orders))
        .route("/orders/:id/cancel", patch(handlers::admin::admin_cancel_order))
        .route("/revenue", get(handlers::admin::get_revenue_stats))
        .route("/payouts", get(handlers::admin::get_all_payouts))
        .route("/payouts/:id", patch(handlers::admin::update_payout_status))
        .route("/lab-tests", get(handlers::admin::get_all_lab_tests))
        .route("/broadcast", post(handlers::admin::broadcast_notification))
        .route("/user-activity/:id", get(handlers::admin::get_user_activity))
        .route("/consultations", get(handlers::admin::get_all_consultations))
        .route("/consultations/:id/cancel", patch(handlers::admin::admin_cancel_consultation))
        .route("/prescriptions", get(handlers::admin::get_prescription_audit))
        .route("/specialties", get(handlers::admin::get_all_specialties))
        .route("/specialties", post(handlers::admin::create_specialty))
        .route("/specialties/:id", put(handlers::admin::update_specialty))
        .route("/specialties/:id", delete(handlers::admin::delete_specialty))
        .route("/quality-reports", get(handlers::admin::get_quality_reports))
        .route("/audit-logs", get(handlers::admin::get_admin_audit_logs))
        .route("/managers", get(handlers::admin::get_all_admins))
        .route("/managers", post(handlers::admin::create_admin))
        .route("/managers/:id", delete(handlers::admin::delete_admin))
        .layer(axum_middleware::from_fn_with_state(state.clone(), crate::middleware::auth::auth_middleware));

    // Combined router nested under /api
    let api_router = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .nest("/admin", admin_routes);

    // Main app router
    let app = Router::new()
        .route("/", get(handler))
        .route("/health", get(health_check))
        .route("/ws", get(websocket::websocket_handler))
        .nest("/api", api_router)
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_origin([
                    "https://app.medicata.ng".parse().unwrap(),
                    "https://admin.medicata.ng".parse().unwrap(),
                    "https://medicata.ng".parse().unwrap(),
                ])
                .allow_methods([
                    Method::GET,
                    Method::POST,
                    Method::PUT,
                    Method::PATCH,
                    Method::DELETE,
                    Method::OPTIONS,
                ])
                .allow_headers([AUTHORIZATION, CONTENT_TYPE, ACCEPT, ORIGIN])
                .allow_credentials(true),
        )
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
