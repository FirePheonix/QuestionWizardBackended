import app from './app';
import 'dotenv/config';
import { initializeWebSocketServer } from './utils/websockets';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});

// Initialize WebSocket server and attach it to the HTTP server
initializeWebSocketServer(server);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  process.on(signal, () => {
    console.log(`\nReceived ${signal}, shutting down gracefully.`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  gracefulShutdown(signal);
});
