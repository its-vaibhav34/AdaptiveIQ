import cors from 'cors';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://adaptive-iq-ten.vercel.app',
  'https://adaptive-iq-u83e.vercel.app',
  'https://adaptiveiq.onrender.com',
];

/**
 * Check if origin is allowed by CORS policy.
 * @param {string|undefined} origin
 * @returns {boolean}
 */
export function isOriginAllowed(origin) {
  // Allow requests with no origin header (Postman, curl, server-to-server)
  if (!origin) return true;

  const normalized = origin.replace(/\/$/, '');

  // Check predefined allowed origins list
  if (ALLOWED_ORIGINS.includes(normalized)) return true;

  // Check env vars (supports comma-separated origins)
  const envOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ]
    .filter(Boolean)
    .flatMap((val) => val.split(',').map((s) => s.trim().replace(/\/$/, '')));

  if (envOrigins.includes(normalized)) return true;

  // Allow all Vercel deployment URLs for AdaptiveIQ (production, preview branches, etc.)
  if (/^https:\/\/adaptive-iq.*\.vercel\.app$/.test(normalized)) {
    return true;
  }

  // Allow all localhost variations
  if (normalized.startsWith('http://localhost:') || normalized.startsWith('http://127.0.0.1:')) {
    return true;
  }

  return false;
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
});
