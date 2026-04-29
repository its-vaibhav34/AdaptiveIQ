import jwt from 'jsonwebtoken';

/**
 * Application-level & Route-level Authentication Middleware
 * Verifies JWT token from Authorization header or cookies
 * Attaches decoded user data to req.user
 *
 * Usage:
 * - App-level: app.use(authenticate)
 * - Route-level: router.get('/protected', authenticate, handler)
 */
export function authenticate(req, res, next) {
  try {
    // Priority: Authorization header > Cookie
    let token = null;

    // 1. Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove "Bearer " prefix
    }

    // 2. Fallback: Check cookies
    if (!token && req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }

    // 3. No token found - continue (can be optional or required per route)
    if (!token) {
      req.user = null;
      return next();
    }

    // 4. Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'adaptiveiq-secret-key');

    // 5. Attach user info to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (err) {
    // Invalid token but don't fail - let route decide if auth is required
    if (err.name === 'TokenExpiredError') {
      console.warn('⚠️  Token expired');
    } else if (err.name === 'JsonWebTokenError') {
      console.warn('⚠️  Invalid token');
    }
    req.user = null;
    next();
  }
}

/**
 * Require Authentication Middleware
 * Use this to protect routes that require authentication
 *
 * Usage: router.get('/protected', requireAuth, handler)
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource',
    });
  }
  next();
}

/**
 * Optional Authentication Middleware
 * Tries to authenticate but doesn't fail if token is missing
 * Useful for public endpoints that show different content for logged-in users
 *
 * Usage: router.get('/public', optionalAuth, handler)
 */
export function optionalAuth(req, res, next) {
  // Try to authenticate
  authenticate(req, res, () => {
    // Always continue, even if not authenticated
    next();
  });
}

/**
 * Role-based Authorization Middleware
 * Checks if authenticated user has required role
 *
 * Usage: router.delete('/admin', requireAuth, authorize('admin'), handler)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Token Refresh Middleware
 * Can be used to generate a new token before old one expires
 * Useful for long-running operations
 */
export function refreshToken(req, res, next) {
  if (req.token) {
    const decoded = jwt.decode(req.token);
    const currentTime = Math.floor(Date.now() / 1000);

    // If token expires in less than 5 minutes, generate new one
    if (decoded.exp - currentTime < 5 * 60) {
      const newToken = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET || 'adaptiveiq-secret-key', {
        expiresIn: '30d',
      });

      res.setHeader('X-New-Token', newToken);
      res.cookie('authToken', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
  }
  next();
}
