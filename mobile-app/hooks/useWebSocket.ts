import { useEffect, useRef, useState, useCallback } from 'react';

const WEBSOCKET_URL = 'ws://localhost:8080/ws'; // Replace with your backend URL in production

export const useWebSocket = (onMessage?: (msg: any) => void) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
        
        // Dispatch global event for incoming calls etc
        if (data.type === 'webrtc_offer' || data.type === 'webrtc_answer' || data.type === 'webrtc_ice') {
          const eventName = `ws_${data.type}_${data.consultation_id}`;
          // In a real app, use a proper event emitter or global state
          console.log(`Global Signal: ${eventName}`);
        }
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setConnected(false);
    };

    socketRef.current = socket;

    return () => {
      socket.close();
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
