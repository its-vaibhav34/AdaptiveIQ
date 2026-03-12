import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

/**
 * Factory function that creates and configures the Express app.
 * Separated from server.js so it can be tested in isolation.
 */
export function createApp() {
  const app = express();

  // ── Core middleware ───────────────────────────────────────────
  app.use(corsMiddleware);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(requestLogger);

  // ── API Routes ────────────────────────────────────────────────
  app.use('/api', apiRouter);

  // ── Error handling (must come last) ──────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
