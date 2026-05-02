import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../services/api';

export const useWebSocket = (onMessage?: (msg: any) => void) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connect = () => {
      const url = api.getWebSocketUrl();
      console.log(`Connecting to WebSocket: ${url}`);
      socket = new WebSocket(url);

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
          
          if (data.type === 'webrtc_offer' || data.type === 'webrtc_answer' || data.type === 'webrtc_ice') {
            const eventName = `ws_${data.type}_${data.consultation_id}`;
            console.log(`Global Signal: ${eventName}`);
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      socket.onclose = (e) => {
        console.log('WebSocket Disconnected', e.reason);
        setConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      socketRef.current = socket;
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  const sendMessage = useCallback((msg: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  return { connected, sendMessage };
};
