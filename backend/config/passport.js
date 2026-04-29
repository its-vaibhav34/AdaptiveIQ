/**
 * Passport.js Configuration
 * Implements JWT strategy for stateless authentication
 *
 * Installation: npm install passport passport-jwt
 *
 * Usage in middleware:
 * import passport from 'passport';
 * import './config/passport.js';  // Initialize strategies
 *
 * app.use(passport.initialize());
 * router.get('/protected', passport.authenticate('jwt', { session: false }), handler);
 */

import passport from 'passport';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.js';

/**
 * JWT Strategy Configuration
 * Extracts JWT from Authorization header or cookies
 * Verifies token and attaches user to req.user
 */
passport.use(
  'jwt',
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Extract from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Fallback: Extract from cookies
        (req) => {
          if (req && req.cookies) {
            return req.cookies.authToken;
          }
          return null;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET || 'adaptiveiq-secret-key',
      passReqToCallback: false,
    },
    async (jwtPayload, done) => {
      try {
        // Find user by ID from JWT payload
        const user = await User.findById(jwtPayload.id);

        if (!user) {
          return done(null, false);
        }

        if (!user.isActive) {
          return done(null, false);
        }

        // Attach user to req.user
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/**
 * Serialize user - stored in session (if using sessions)
 * For stateless JWT, this is optional
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user - retrieves from session
 * For stateless JWT, this is optional
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
