import { Router } from 'express';
import GameSession from '../models/GameSession.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/sessions  ← Save a game session
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const session = await new GameSession(req.body).save();
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/sessions  ← List recent sessions (for analytics)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = Number(req.query.skip) || 0;

    const [sessions, total] = await Promise.all([
      GameSession.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      GameSession.countDocuments(),
    ]);

    res.json({ total, sessions });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/sessions/:id  ← Get session by ID
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const session = await GameSession.findById(req.params.id).select('-__v');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

export default router;
