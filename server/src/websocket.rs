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
        user_id: String,
        content: String,
        timestamp: String,
    },
    #[serde(rename = "webrtc_offer")]
    WebRTCOffer {
        user_id: String,
        target_id: String,
        sdp: String,
    },
    #[serde(rename = "webrtc_answer")]
    WebRTCAnswer {
        user_id: String,
        target_id: String,
        sdp: String,
    },
    #[serde(rename = "webrtc_ice")]
    WebRTCICE {
        user_id: String,
        target_id: String,
        candidate: String,
    },
    #[serde(rename = "typing")]
    Typing {
        user_id: String,
        is_typing: bool,
    },
}

#[derive(Clone)]
pub struct ConnectionState {
    pub user_id: String,
}

pub type ClientMap = Arc<Mutex<HashMap<String, broadcast::Sender<WsMessage>>>>;

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state.ws_clients))
}

async fn handle_socket(socket: WebSocket, clients: ClientMap) {
    let (mut sender, mut receiver) = socket.split();
    let client_id = Uuid::new_v4().to_string();
    
    // Create a broadcast channel for this client
    let (tx, _rx) = broadcast::channel(100);
    
    // Register client
    {
        let mut clients_lock = clients.lock().unwrap();
        clients_lock.insert(client_id.clone(), tx);
    }
    
    // Spawn a task to handle incoming messages
    let clients_clone = clients.clone();
    let client_id_clone = client_id.clone();
    
    let send_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                        // Broadcast message to all clients (in production, filter by target)
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
