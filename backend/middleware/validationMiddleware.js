/**
 * Validation Middleware
 * Router-level middleware for request validation
 *
 * Usage:
 * router.post('/endpoint', validateBody(schema), handler);
 */

export function validateBody(requiredFields) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [`Missing required fields: ${missingFields.join(', ')}`],
      });
    }

    next();
  };
}

/**
 * Rate limiting middleware (simple implementation)
 * Usage: app.use(rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 100 }))
 */
export function rateLimit(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxRequests = options.maxRequests || 100;
  const store = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}`;
    const now = Date.now();

    if (!store.has(key)) {
      store.set(key, []);
    }

    const timestamps = store.get(key).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000),
      });
    }

    timestamps.push(now);
    store.set(key, timestamps);

    next();
  };
}

/**
 * Request sanitization middleware
 * Removes sensitive data from request logs
 */
export function sanitizeRequest(req, res, next) {
  // Don't log passwords or tokens
  const sensitiveFields = ['password', 'token', 'authToken', 'secret'];

  const sanitized = { ...req.body };
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  req.sanitized = sanitized;
  next();
}

/**
 * CORS preflight handler
 * Handles OPTIONS requests for CORS
 */
export function corsPreflightHandler(req, res, next) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}
