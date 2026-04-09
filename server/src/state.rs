use sqlx::PgPool;
use crate::config::Config;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use crate::websocket::WsMessage;
use crate::email::EmailService;

pub type ClientMap = Arc<Mutex<HashMap<String, broadcast::Sender<WsMessage>>>>;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: Config,
    pub ws_clients: ClientMap,
    pub email_service: Arc<EmailService>,
}
