import express from 'express';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/authMiddleware.js';
import { createSessionMiddleware } from './config/session.js';
import apiRouter from './routes/index.js';

/**
 * Factory function that creates and configures the Express app.
 * Separated from server.js so it can be tested in isolation.
 * 
 * Middleware Order (important):
 * 1. CORS - Allow cross-origin requests
 * 2. Body parsers - Parse JSON/URL-encoded bodies
 * 3. Cookie parser - Parse cookies
 * 4. Session - Session management
 * 5. Request logger - Log HTTP requests
 * 6. Authentication - Verify JWT tokens
 * 7. Routes - Handle requests
 * 8. Error handlers - Catch errors (must be last)
 */
export function createApp() {
  const app = express();

  // ═════════════════════════════════════════════════════════════
  // APPLICATION-LEVEL MIDDLEWARE (applied to all routes)
  // ═════════════════════════════════════════════════════════════

  // CORS middleware - handle cross-origin requests
  app.use(corsMiddleware);

  // Body parsing middleware
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Cookie parsing middleware - parse cookies into req.cookies
  app.use(cookieParser());

  // Session middleware - persistent sessions with MongoDB
  app.use(createSessionMiddleware());

  // Request logging middleware - log all HTTP requests
  app.use(requestLogger);

  // Authentication middleware - optional JWT verification
  // Doesn't fail if token missing; attach user to req.user if valid
  app.use(authenticate);

  // ═════════════════════════════════════════════════════════════
  // API ROUTES
  // ═════════════════════════════════════════════════════════════
  app.use('/api', apiRouter);

  // ═════════════════════════════════════════════════════════════
  // ERROR HANDLING MIDDLEWARE (must come last)
  // ═════════════════════════════════════════════════════════════
  // 404 handler - for undefined routes
  app.use(notFound);

  // Global error handler - catches all errors from routes/middleware
  app.use(errorHandler);

  return app;
}
