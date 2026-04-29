import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import quizRouter from './quiz.routes.js';
import sessionRouter from './session.routes.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Health check - public endpoint
// ─────────────────────────────────────────────────────────────
router.use('/health', healthRouter);

// ─────────────────────────────────────────────────────────────
// Authentication routes - public + protected
// POST   /api/auth/signup              - Register user
// POST   /api/auth/login               - Login user
// POST   /api/auth/logout              - Logout (requires auth)
// GET    /api/auth/me                  - Get current user (requires auth)
// PUT    /api/auth/profile             - Update profile (requires auth)
// POST   /api/auth/change-password     - Change password (requires auth)
// ─────────────────────────────────────────────────────────────
router.use('/auth', authRouter);

// ─────────────────────────────────────────────────────────────
// Quiz routes
// ─────────────────────────────────────────────────────────────
router.use('/quizzes', quizRouter);

// ─────────────────────────────────────────────────────────────
// Game session routes
// ─────────────────────────────────────────────────────────────
router.use('/sessions', sessionRouter);

export default router;
