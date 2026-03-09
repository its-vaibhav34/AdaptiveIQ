import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// ============================================================
// MongoDB Connection
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/adaptiveiq";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected to:", MONGODB_URI);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    console.warn("⚠️  Server will continue without database. Data will not persist.");
  }
}

// ============================================================
// Mongoose Models
// ============================================================
const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  timeLimit: { type: Number, default: 15 },
});

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

const GameSessionSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    players: [
      {
        odId: String,
        username: String,
        avatar: String,
        score: { type: Number, default: 0 },
        isHost: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["lobby", "starting", "question", "leaderboard", "finished"],
      default: "lobby",
    },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", QuizSchema);
const GameSession = mongoose.model("GameSession", GameSessionSchema);

// ============================================================
// Gemini AI Setup (lazy - only created when needed)
// ============================================================
function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenAI({ apiKey: key });
}

// ============================================================
// Express + Socket.io Server
// ============================================================
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  await connectDB();

  // In-memory store for active game rooms (real-time state)
  const rooms = new Map<string, any>();

  // ============================================================
  // REST API Routes
  // ============================================================

  // Health Check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  // --- Quiz CRUD ---

  // Create a quiz (manual)
  app.post("/api/quizzes", async (req, res) => {
    try {
      const { title, category, difficulty, questions } = req.body;
      if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ error: "Title and at least one question are required" });
      }

      // Try to save to MongoDB, but succeed even if DB is offline
      if (mongoose.connection.readyState === 1) {
        const quiz = new Quiz({ title, category, difficulty, questions });
        const saved = await quiz.save();
        return res.status(201).json(saved);
      } else {
        // DB offline - return the quiz data as-is with a generated ID
        return res.status(201).json({ _id: Date.now().toString(36), title, category, difficulty, questions });
      }
    } catch (error: any) {
      console.error("Create quiz error:", error);
      res.status(500).json({ error: error.message || "Failed to create quiz" });
    }
  });

  // List all quizzes
  app.get("/api/quizzes", async (_req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) return res.json([]);
      const quizzes = await Quiz.find().sort({ createdAt: -1 }).limit(50);
      res.json(quizzes);
    } catch (error: any) {
      console.error("List quizzes error:", error);
      res.json([]);
    }
  });

  // Get a single quiz by ID
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) return res.status(404).json({ error: "Database offline" });
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ error: "Quiz not found" });
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get quiz" });
    }
  });

  // AI Generate quiz
  app.post("/api/quizzes/generate", async (req, res) => {
    const { topic, count, difficulty } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
      const response = await getAI().models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate a quiz about "${topic}" with ${count || 5} questions at ${difficulty || "Medium"} difficulty level. Each question must have exactly 4 options.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctAnswer: {
                      type: Type.INTEGER,
                      description: "Index of the correct answer (0-3)",
                    },
                    timeLimit: {
                      type: Type.INTEGER,
                      description: "Time limit in seconds (10-30)",
                    },
                  },
                  required: ["text", "options", "correctAnswer", "timeLimit"],
                },
              },
            },
            required: ["title", "category", "difficulty", "questions"],
          },
        },
      });

      const quizData = JSON.parse(response.text || "{}");

      // Save to MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        try {
          const quiz = new Quiz(quizData);
          await quiz.save();
          quizData._id = quiz._id;
        } catch (dbErr) {
          console.warn("Could not save AI quiz to DB:", dbErr);
        }
      }

      res.json(quizData);
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate quiz: " + (error.message || "Unknown error") });
    }
  });

  // --- Game Sessions ---

  // Save game session results
  app.post("/api/sessions", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(201).json({ message: "Session not saved (DB offline)" });
      }
      const session = new GameSession(req.body);
      const saved = await session.save();
      res.status(201).json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save session" });
    }
  });

  // Get game session history
  app.get("/api/sessions", async (_req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) return res.json([]);
      const sessions = await GameSession.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("quizId");
      res.json(sessions);
    } catch (error: any) {
      res.json([]);
    }
  });

  // ============================================================
  // Socket.io Game Logic
  // ============================================================
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", ({ roomCode, player }) => {
      socket.join(roomCode);

      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, {
          code: roomCode,
          players: [],
          status: "lobby",
          currentQuiz: null,
          currentQuestionIndex: 0,
        });
      }

      const room = rooms.get(roomCode);
      const existingPlayer = room.players.find((p: any) => p.id === player.id);

      if (!existingPlayer) {
        const newPlayer = {
          ...player,
          socketId: socket.id,
          score: 0,
          isReady: false,
        };
        room.players.push(newPlayer);
      }

      io.to(roomCode).emit("room_update", room);
    });

    socket.on("set_quiz", ({ roomCode, quiz }) => {
      const room = rooms.get(roomCode);
      if (room) {
        room.currentQuiz = quiz;
        io.to(roomCode).emit("room_update", room);
      }
    });

    socket.on("start_game", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room) {
        room.status = "starting";
        io.to(roomCode).emit("room_update", room);

        setTimeout(() => {
          room.status = "question";
          io.to(roomCode).emit("room_update", room);
        }, 3000);
      }
    });

    socket.on("submit_answer", ({ roomCode, playerId, score, correct }) => {
      const room = rooms.get(roomCode);
      if (room) {
        const player = room.players.find((p: any) => p.id === playerId);
        if (player) {
          player.score += score;
          player.lastAnswerCorrect = correct;
        }
        io.to(roomCode).emit("room_update", room);
      }
    });

    socket.on("next_question", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room) {
        if (
          room.currentQuiz &&
          room.currentQuestionIndex < room.currentQuiz.questions.length - 1
        ) {
          room.currentQuestionIndex += 1;
          room.status = "question";
        } else {
          room.status = "finished";

          // Save game session to MongoDB
          try {
            const session = new GameSession({
              roomCode,
              players: room.players.map((p: any) => ({
                odId: p.id,
                username: p.username,
                avatar: p.avatar,
                score: p.score,
                isHost: p.isHost,
              })),
              status: "finished",
            });
            session.save().catch((err: any) =>
              console.warn("Could not save game session:", err)
            );
          } catch (err) {
            console.warn("Error creating game session:", err);
          }
        }
        io.to(roomCode).emit("room_update", room);
      }
    });

    socket.on("show_leaderboard", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room) {
        room.status = "leaderboard";
        io.to(roomCode).emit("room_update", room);
      }
    });

    socket.on("disconnect", () => {
      rooms.forEach((room, roomCode) => {
        const playerIndex = room.players.findIndex(
          (p: any) => p.socketId === socket.id
        );
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomCode);
          } else {
            io.to(roomCode).emit("room_update", room);
          }
        }
      });
    });
  });

  // ============================================================
  // Vite Dev Middleware (must be after API routes)
  // ============================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  // ============================================================
  // Start Server
  // ============================================================
  const PORT = parseInt(process.env.PORT || "3000", 10);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
