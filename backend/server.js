/**
 * AdaptiveIQ Backend — Entry Point
 *
 * Responsibility: load env → connect DB → wire Socket.IO → start HTTP server.
 * All app logic lives in app.js / routes / socket / models / services.
 */
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/database.js';
import { registerGameHandlers } from './socket/gameHandlers.js';

const PORT = process.env.PORT || 5001;

// ── Express App ───────────────────────────────────────────────
const app = createApp();
const httpServer = createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────
const io = new Server(httpServer, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket) => registerGameHandlers(io, socket));

// ── Boot ──────────────────────────────────────────────────────
async function start() {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║      🎮  AdaptiveIQ Backend v2.0         ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`📡  HTTP   : http://localhost:${PORT}`);
    console.log(`🔌  Socket : ws://localhost:${PORT}/socket.io`);
    console.log(`🤖  Groq AI: ${process.env.GROQ_API_KEY ? '✅ configured' : '❌ not configured'}`);
    console.log(`🌍  ENV    : ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});