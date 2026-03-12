/**
 * 404 handler — must be mounted AFTER all routes.
 */
export function notFound(req, res, next) {
  const err = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

/**
 * Global error handler — must be the LAST middleware (4 args).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';
  const statusCode = err.statusCode || err.status || 500;

  // Log server errors; skip 4xx in production
  if (statusCode >= 500) {
    console.error(`❌ [${statusCode}] ${req.method} ${req.originalUrl} — ${err.message}`);
    if (isDev) console.error(err.stack);
  } else if (isDev) {
    console.warn(`⚠️  [${statusCode}] ${req.method} ${req.originalUrl} — ${err.message}`);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }

  // Handle Mongoose cast errors (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for field '${err.path}'` });
  }

  // Handle duplicate key errors (MongoDB code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({ error: `Duplicate value for: ${field}` });
  }

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(isDev && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
