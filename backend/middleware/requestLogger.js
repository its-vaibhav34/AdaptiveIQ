/**
 * Lightweight HTTP request logger.
 * Logs: METHOD /path STATUS — Xms
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const icon = status >= 500 ? '❌' : status >= 400 ? '⚠️ ' : status >= 300 ? '↩️ ' : '✅';
    console.log(`${icon} ${req.method.padEnd(6)} ${req.originalUrl.padEnd(40)} ${status}  ${ms}ms`);
  });

  next();
}
