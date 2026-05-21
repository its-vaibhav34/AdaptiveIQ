import cors from 'cors';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://adaptive-iq-u83e.vercel.app',
  'https://adaptiveiq.onrender.com',
];

// Add CLIENT_URL from env if provided (for production deployments)
if (process.env.CLIENT_URL) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_URL);
}

// Common frontend env var names used by hosting providers
if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow requests with no origin header (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // In dev, allow all localhost variations
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
});
