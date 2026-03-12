import { Router } from 'express';
import Quiz from '../models/Quiz.js';
import { generateQuizWithAI } from '../services/groqService.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/quizzes/generate  ← AI-powered quiz generation
// IMPORTANT: must be declared BEFORE /:id to avoid route conflict
// ─────────────────────────────────────────────────────────────
router.post('/generate', async (req, res, next) => {
  try {
    const { topic, count, difficulty } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const safeCount = Math.min(Math.max(Number(count) || 5, 1), 50);
    const safeDifficulty = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';

    console.log(`🤖 Generating quiz: "${topic}" | ${safeCount}q | ${safeDifficulty}`);

    const quizData = await generateQuizWithAI({
      topic: topic.trim(),
      count: safeCount,
      difficulty: safeDifficulty,
    });

    // Persist to MongoDB (non-blocking — don't fail the response if DB write fails)
    try {
      const saved = await new Quiz(quizData).save();
      quizData._id = saved._id.toString();
      console.log(`✅ AI quiz saved to DB: "${saved.title}" (${saved.questions.length} questions)`);
    } catch (dbErr) {
      console.warn('⚠️  Could not persist AI quiz to DB:', dbErr.message);
    }

    res.json(quizData);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/quizzes  ← Create quiz manually
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { title, category, difficulty, questions } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'title and at least one question are required' });
    }

    const quiz = await new Quiz({ title, category, difficulty, questions }).save();
    console.log(`✅ Quiz created: "${quiz.title}" (${quiz.questions.length} questions)`);
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/quizzes  ← List all quizzes
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const skip = Number(req.query.skip) || 0;

    const [quizzes, total] = await Promise.all([
      Quiz.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
      Quiz.countDocuments(),
    ]);

    res.json({ total, quizzes });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/quizzes/:id  ← Get quiz by ID
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).select('-__v');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/quizzes/:id  ← Delete quiz
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ message: 'Quiz deleted successfully', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
