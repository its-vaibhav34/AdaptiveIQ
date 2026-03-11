import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';

dotenv.config();

// ============================================================
// MongoDB Connection
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adaptiveiq';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected to:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// ============================================================
// Mongoose Models
// ============================================================
const QuestionSubSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  timeLimit: { type: Number, default: 15 },
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  questions: [QuestionSubSchema],
}, { timestamps: true, collection: 'quizzes' });

const PlayerSubSchema = new mongoose.Schema({
  odId: String,
  username: { type: String, required: true },
  avatar: String,
  score: { type: Number, default: 0 },
  isHost: { type: Boolean, default: false },
}, { _id: false });

const GameSessionSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, index: true },
  quizTitle: String,
  quizCategory: String,
  players: [PlayerSubSchema],
  status: { type: String, enum: ['lobby', 'starting', 'question', 'leaderboard', 'finished'], default: 'lobby' },
}, { timestamps: true, collection: 'gamesessions' });

const Quiz = mongoose.model('Quiz', QuizSchema);
const GameSession = mongoose.model('GameSession', GameSessionSchema);

// ============================================================
// Groq AI (lazy initialization)
// ============================================================
function getAI() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set in .env');
  return new Groq({ apiKey: key });
}

// ============================================================
// Express App
// ============================================================
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// HTTP + Socket.io Server
// ============================================================
const server = createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowEIO3: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================================
// REST API Routes
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// --- Quiz CRUD ---

// Create quiz (manual)
app.post('/api/quizzes', async (req, res) => {
  try {
    const { title, category, difficulty, questions } = req.body;
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title and at least one question are required' });
    }
    const quiz = new Quiz({ title, category, difficulty, questions });
    const saved = await quiz.save();
    console.log('✅ Quiz saved to MongoDB:', saved.title);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Create quiz error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create quiz' });
  }
});

// List all quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 }).limit(50);
    res.json(quizzes);
  } catch (error) {
    console.error('List quizzes error:', error.message);
    res.json([]);
  }
});

// Get quiz by ID
app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to get quiz' });
  }
});

// AI Generate quiz
app.post('/api/quizzes/generate', async (req, res) => {
  const { topic, count, difficulty } = req.body;

  try {
    const ai = getAI();
    const prompt = `Generate a quiz about "${topic}" with ${count || 5} questions at ${difficulty || 'Medium'} difficulty level. Each question must have exactly 4 options.

Return the response as valid JSON with this structure:
{
  "title": "Quiz Title",
  "category": "${topic}",
  "difficulty": "${difficulty || 'Medium'}",
  "questions": [
    {
      "text": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "timeLimit": 15
    }
  ]
}

Ensure all questions have exactly 4 options and correctAnswer is 0-3.`;

    const response = await ai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2048,
      temperature: 1,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const quizData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Save AI-generated quiz to MongoDB
    try {
      const quiz = new Quiz(quizData);
      await quiz.save();
      quizData._id = quiz._id;
      console.log('✅ AI quiz saved to MongoDB:', quiz.title);
    } catch (dbErr) {
      console.warn('⚠️ Could not save AI quiz to DB:', dbErr.message);
    }

    res.json(quizData);
  } catch (error) {
    console.error('AI Generation Error:', error.message);
    res.status(500).json({ error: 'Failed to generate quiz: ' + (error.message || 'Unknown error') });
  }
});

// --- Game Sessions ---

app.post('/api/sessions', async (req, res) => {
  try {
    const session = new GameSession(req.body);
    const saved = await session.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to save session' });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await GameSession.find().sort({ createdAt: -1 }).limit(20);
    res.json(sessions);
  } catch (error) {
    res.json([]);
  }
});

// ============================================================
// Socket.io Game Logic
// ============================================================
const rooms = new Map();

io.on('connect_error', (error) => {
  console.error('❌ Socket.IO connection error:', error);
});

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  console.log('📊 Total connected clients:', io.engine.clientsCount);

  socket.emit('connection_success', {
    id: socket.id,
    message: 'Connected to game server'
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('join_room', ({ roomCode, player }) => {
    socket.join(roomCode);

    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        code: roomCode,
        players: [],
        status: 'lobby',
        currentQuiz: null,
        currentQuestionIndex: 0,
      });
    }

    const room = rooms.get(roomCode);
    const existingPlayer = room.players.find((p) => p.id === player.id);

    if (!existingPlayer) {
      room.players.push({ ...player, socketId: socket.id, score: 0, isReady: false });
    }

    io.to(roomCode).emit('room_update', room);
    console.log(`📥 ${player.username} joined room ${roomCode} (${room.players.length} players)`);
  });

  socket.on('set_quiz', ({ roomCode, quiz }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.currentQuiz = quiz;
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('start_game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.status = 'starting';
      io.to(roomCode).emit('room_update', room);
      console.log(`🎮 Game starting in room ${roomCode}`);

      setTimeout(() => {
        room.status = 'question';
        io.to(roomCode).emit('room_update', room);
      }, 3000);
    }
  });

  socket.on('submit_answer', ({ roomCode, playerId, score, correct }) => {
    const room = rooms.get(roomCode);
    if (room) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.score += score;
        player.lastAnswerCorrect = correct;
      }
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('next_question', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (room) {
      if (room.currentQuiz && room.currentQuestionIndex < room.currentQuiz.questions.length - 1) {
        room.currentQuestionIndex += 1;
        room.status = 'question';
      } else {
        room.status = 'finished';

        // Save completed game session to MongoDB
        const session = new GameSession({
          roomCode,
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
        session.save()
          .then(() => console.log(`💾 Game session saved for room ${roomCode}`))
          .catch((err) => console.warn('⚠️ Could not save game session:', err.message));
      }
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('show_leaderboard', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.status = 'leaderboard';
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    console.log('📊 Total connected clients:', io.engine.clientsCount);
    
    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex((p) => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const removed = room.players.splice(playerIndex, 1);
        console.log(`📤 ${removed[0]?.username} left room ${roomCode}`);
        if (room.players.length === 0) {
          rooms.delete(roomCode);
          console.log(`🗑️  Room ${roomCode} deleted (empty)`);
        } else {
          io.to(roomCode).emit('room_update', room);
        }
      }
    });
  });
});

// ============================================================
// Start Server
// ============================================================
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`✅ Listening on all interfaces - http://0.0.0.0:${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
    console.log(`🔑 Groq API: ${process.env.GROQ_API_KEY ? 'configured' : 'NOT configured (AI generation disabled)'}`);
  });
});