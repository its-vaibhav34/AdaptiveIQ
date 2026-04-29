/**
 * Express Session Configuration
 * Setup session persistence with MongoDB using connect-mongo
 *
 * Installation: npm install express-session connect-mongo
 *
 * Features:
 * - Session data persisted to MongoDB
 * - Secure cookies (httpOnly, sameSite)
 * - Auto-cleanup of expired sessions
 * - Session ID stored in client cookies
 */

import session from 'express-session';
import MongoStore from 'connect-mongo';

/**
 * Create session middleware
 * Pass to app.use() AFTER body parsers and BEFORE routes
 *
 * app.use(sessionMiddleware);
 */
export function createSessionMiddleware() {

  return session({
    name: 'sessionId', // Cookie name
    secret: process.env.SESSION_SECRET || 'adaptiveiq-session-secret',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't save empty sessions
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adaptiveiq',
      collection: 'sessions',
      ttl: 24 * 60 * 60, // 24 hours - session expiry in seconds
      autoRemove: 'interval',
      autoRemoveInterval: 10, // Check for expired sessions every 10 minutes
      touchAfter: 24 * 3600, // Lazy session update - only update every 24h
    }),
    cookie: {
      httpOnly: true, // Prevent JavaScript access
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
    },
  });
}

/**
 * Set session data
 * Usage in route handlers: req.session.userId = user._id;
 * Automatically serialized and stored in MongoDB
 */
export function setSessionData(req, key, value) {
  req.session[key] = value;
}

/**
 * Get session data
 * Usage: const userId = getSessionData(req, 'userId');
 */
export function getSessionData(req, key) {
  return req.session[key];
}

/**
 * Clear specific session data
 */
export function clearSessionData(req, key) {
  delete req.session[key];
}

/**
 * Destroy entire session
 * Usage: destroySession(req);
 */
export function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      resolve();
    });
  });
}
