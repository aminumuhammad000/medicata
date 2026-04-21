use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use uuid::Uuid;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "chat")]
    Chat {
        consultation_id: Uuid,
        user_id: Uuid,
        content: String,
    },
    #[serde(rename = "webrtc_offer")]
    WebRTCOffer {
        consultation_id: Uuid,
        user_id: Uuid,
        target_id: Uuid,
        sdp: String,
    },
    #[serde(rename = "webrtc_answer")]
    WebRTCAnswer {
        consultation_id: Uuid,
        user_id: Uuid,
        target_id: Uuid,
        sdp: String,
    },
    #[serde(rename = "webrtc_ice")]
    WebRTCICE {
        consultation_id: Uuid,
        user_id: Uuid,
        target_id: Uuid,
        candidate: String,
    },
    #[serde(rename = "typing")]
    Typing {
        consultation_id: Uuid,
        user_id: Uuid,
        is_typing: bool,
    },
}

pub type ClientMap = Arc<Mutex<HashMap<String, broadcast::Sender<WsMessage>>>>;

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let client_id = Uuid::new_v4().to_string();
    let clients = state.ws_clients.clone();
    
    // Create a broadcast channel for this client
    let (tx, _rx) = broadcast::channel(100);
    
    // Register client
    {
        let mut clients_lock = clients.lock().unwrap();
        clients_lock.insert(client_id.clone(), tx);
    }
    
    // Spawn a task to handle incoming messages
    let clients_clone = clients.clone();
    let state_clone = state.clone();
    
    let send_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                        // Persist chat messages to DB
                        if let WsMessage::Chat { consultation_id, user_id, content } = &ws_msg {
                            let _ = sqlx::query(
                                "INSERT INTO messages (consultation_id, sender_id, content) VALUES ($1, $2, $3)"
                            )
                            .bind(consultation_id)
                            .bind(user_id)
                            .bind(content)
                            .execute(&state_clone.db)
                            .await;
                        }

                        // Broadcast message to all clients
                        // In production, we'd only send to participants of the consultation_id
                        let clients_lock = clients_clone.lock().unwrap();
                        for (_, tx) in clients_lock.iter() {
                            let _ = tx.send(ws_msg.clone());
                        }
                    }
                }
                Message::Close(_) => {
                    break;
                }
                _ => {}
            }
        }
    });
    
    // Send broadcast messages to this client
    let clients_clone = clients.clone();
    let client_id_clone = client_id.clone();
    
    let recv_task = tokio::spawn(async move {
        let mut rx = {
            let clients_lock = clients_clone.lock().unwrap();
            clients_lock.get(&client_id_clone).unwrap().subscribe()
        };
        
        while let Ok(msg) = rx.recv().await {
            if let Ok(text) = serde_json::to_string(&msg) {
                if sender.send(Message::Text(text)).await.is_err() {
                    break;
                }
            }
        }
    });
    
    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }
    
    // Remove client on disconnect
    {
        let mut clients_lock = clients.lock().unwrap();
        clients_lock.remove(&client_id);
    }
}

pub fn create_client_map() -> ClientMap {
    Arc::new(Mutex::new(HashMap::new()))
}
