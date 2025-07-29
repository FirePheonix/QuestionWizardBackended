import { Server } from 'http';
import WebSocket from 'ws';
import { WebSocketMessage } from '../types';

let wss: WebSocket.Server;

export const initializeWebSocketServer = (server: Server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 WebSocket client connected');

    ws.on('message', (message: string) => {
      console.log('received: %s', message);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
  });

  console.log('✅ WebSocket server initialized');
};

export const broadcast = (message: WebSocketMessage) => {
  if (!wss) {
    console.error('WebSocket server not initialized.');
    return;
  }

  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};
