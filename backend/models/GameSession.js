import mongoose from 'mongoose';

const PlayerResultSchema = new mongoose.Schema(
  {
    odId: { type: String },
    username: { type: String, required: true },
    avatar: { type: String },
    score: { type: Number, default: 0 },
    isHost: { type: Boolean, default: false },
  },
  { _id: false }
);

const GameSessionSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, index: true, uppercase: true },
    quizTitle: { type: String },
    quizCategory: { type: String },
    players: [PlayerResultSchema],
    status: {
      type: String,
      enum: ['lobby', 'starting', 'question', 'leaderboard', 'finished'],
      default: 'lobby',
    },
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

GameSessionSchema.virtual('winner').get(function () {
  if (!this.players?.length) return null;
  return this.players.reduce((top, p) => (p.score > top.score ? p : top), this.players[0]);
});

export default mongoose.model('GameSession', GameSessionSchema);
