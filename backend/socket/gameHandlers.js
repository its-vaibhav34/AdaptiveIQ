import GameSession from '../models/GameSession.js';

// In-memory room state — cleared on server restart (intentional: rooms are transient)
const rooms = new Map();

function createRoom(roomCode) {
  return {
    code: roomCode,
    players: [],
    status: 'lobby',
    currentQuiz: null,
    currentQuestionIndex: 0,
  };
}

async function saveGameSession(room) {
  try {
    const session = new GameSession({
      roomCode: room.code,
      quizTitle: room.currentQuiz?.title,
      quizCategory: room.currentQuiz?.category,
      players: room.players.map((p) => ({
        odId: p.id,
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        isHost: p.isHost,
      })),
      status: 'finished',
    });
    await session.save();
    console.log(`💾 Game session saved for room ${room.code}`);
  } catch (err) {
    console.warn(`⚠️  Could not save game session for room ${room.code}:`, err.message);
  }
}

/**
 * Register all game-related Socket.IO event handlers for a single connection.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerGameHandlers(io, socket) {
  console.log(`🔌 Connected: ${socket.id} | Total: ${io.engine.clientsCount}`);

  // Acknowledge connection
  socket.emit('connection_success', {
    id: socket.id,
    message: 'Connected to AdaptiveIQ game server',
  });

  // ── Join Room ────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode, player }) => {
    if (!roomCode || !player?.id) return;

    socket.join(roomCode);

    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, createRoom(roomCode));
      console.log(`🏠 Room created: ${roomCode}`);
    }

    const room = rooms.get(roomCode);

    // Upsert player (reconnect support)
    const existing = room.players.find((p) => p.id === player.id);
    if (existing) {
      existing.socketId = socket.id; // update socket on reconnect
    } else {
      room.players.push({ ...player, socketId: socket.id, score: 0, isReady: false });
    }

    io.to(roomCode).emit('room_update', room);
    console.log(`📥 ${player.username} joined room ${roomCode} (${room.players.length} players)`);
  });

  // ── Set Quiz ─────────────────────────────────────────────────
  socket.on('set_quiz', ({ roomCode, quiz }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.currentQuiz = quiz;
    room.currentQuestionIndex = 0;
    io.to(roomCode).emit('room_update', room);
    console.log(`📋 Quiz set in room ${roomCode}: "${quiz?.title}"`);
  });

  // ── Start Game ───────────────────────────────────────────────
  socket.on('start_game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.status = 'starting';
    room.currentQuestionIndex = 0;
    // Reset all player scores for a fresh game
    room.players.forEach((p) => { p.score = 0; p.lastAnswerCorrect = undefined; });

    io.to(roomCode).emit('room_update', room);
    console.log(`🎮 Game starting in room ${roomCode} (3s countdown)`);

    // 3-second countdown then show first question
    setTimeout(() => {
      const r = rooms.get(roomCode);
      if (!r) return;
      r.status = 'question';
      io.to(roomCode).emit('room_update', r);
    }, 3000);
  });

  // ── Submit Answer ────────────────────────────────────────────
  socket.on('submit_answer', ({ roomCode, playerId, score, correct }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.score += Math.max(0, score || 0);
      player.lastAnswerCorrect = correct;
    }

    io.to(roomCode).emit('room_update', room);
  });

  // ── Show Leaderboard ─────────────────────────────────────────
  socket.on('show_leaderboard', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.status = 'leaderboard';
    io.to(roomCode).emit('room_update', room);
  });

  // ── Next Question ────────────────────────────────────────────
  socket.on('next_question', async ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const totalQuestions = room.currentQuiz?.questions?.length || 0;

    if (room.currentQuestionIndex < totalQuestions - 1) {
      room.currentQuestionIndex += 1;
      room.status = 'question';
    } else {
      // Last question done → finish the game
      room.status = 'finished';
      await saveGameSession(room);
    }

    io.to(roomCode).emit('room_update', room);
  });

  // ── Disconnect ───────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Disconnected: ${socket.id} (${reason}) | Total: ${io.engine.clientsCount}`);

    rooms.forEach((room, roomCode) => {
      const idx = room.players.findIndex((p) => p.socketId === socket.id);
      if (idx === -1) return;

      const [removed] = room.players.splice(idx, 1);
      console.log(`📤 ${removed.username} left room ${roomCode}`);

      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`🗑️  Room ${roomCode} removed (empty)`);
      } else {
        io.to(roomCode).emit('room_update', room);
      }
    });
  });

  socket.on('error', (err) => console.error('❌ Socket error:', err));
}
