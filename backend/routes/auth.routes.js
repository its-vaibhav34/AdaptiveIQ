import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Public endpoint - Register a new user
 * Body: { username, email, password, fullName?, avatar? }
 */
router.post('/signup', authController.signup);

/**
 * POST /api/auth/login
 * Public endpoint - Authenticate user
 * Body: { email, password }
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout
 * Protected endpoint - Clear session
 * Requires: Authentication
 */
router.post('/logout', authenticate, requireAuth, authController.logout);

/**
 * GET /api/auth/me
 * Protected endpoint - Get current authenticated user
 * Requires: Authentication
 */
router.get('/me', authenticate, requireAuth, authController.getCurrentUser);

/**
 * PUT /api/auth/profile
 * Protected endpoint - Update user profile
 * Requires: Authentication
 * Body: { fullName?, avatar? }
 */
router.put('/profile', authenticate, requireAuth, authController.updateProfile);

/**
 * POST /api/auth/change-password
 * Protected endpoint - Change user password
 * Requires: Authentication
 * Body: { currentPassword, newPassword }
 */
router.post('/change-password', authenticate, requireAuth, authController.changePassword);

export default router;
