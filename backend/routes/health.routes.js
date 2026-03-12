import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/health
 * Returns server, DB, and AI status.
 */
router.get('/', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    mongodb: dbStates[mongoose.connection.readyState] || 'unknown',
    groq: process.env.GROQ_API_KEY ? 'configured' : 'not configured',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

export default router;
