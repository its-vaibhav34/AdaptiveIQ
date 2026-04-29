import mongoose from 'mongoose';

const PlayerAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: Number },
    correctAnswer: { type: Number },
    isCorrect: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }, // in seconds
    points: { type: Number, default: 0 },
  },
  { _id: false, timestamps: true }
);

const PlayerResultSchema = new mongoose.Schema(
  {
    userId: { type: String },
    odId: { type: String },
    username: { type: String, required: true },
    avatar: { type: String },
    score: { type: Number, default: 0 },
    isHost: { type: Boolean, default: false },
    correctAnswers: { type: Number, default: 0 },
    totalAttempted: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    answers: [PlayerAnswerSchema],
  },
  { _id: false }
);

const GameSessionSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, index: true, uppercase: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    quizTitle: { type: String },
    quizCategory: { type: String },
    quizDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    totalQuestions: { type: Number, default: 0 },
    players: [PlayerResultSchema],
    status: {
      type: String,
      enum: ['lobby', 'starting', 'question', 'leaderboard', 'finished'],
      default: 'lobby',
    },
    gameDuration: { type: Number, default: 0 }, // in seconds
    questionsAttempted: { type: Number, default: 0 },
    hostId: { type: String },
    winner: {
      userId: String,
      username: String,
      score: Number,
    },
    endTime: { type: Date },
  },
  {
    timestamps: true,
    collection: 'gamesessions',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GameSessionSchema.virtual('playerCount').get(function () {
  return this.players?.length || 0;
});

GameSessionSchema.virtual('topScore').get(function () {
  if (!this.players?.length) return 0;
  return Math.max(...this.players.map(p => p.score));
});

GameSessionSchema.virtual('averageScore').get(function () {
  if (!this.players?.length) return 0;
  const total = this.players.reduce((sum, p) => sum + p.score, 0);
  return Math.round(total / this.players.length);
});

export default mongoose.model('GameSession', GameSessionSchema);
