import User from '../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'adaptiveiq-secret-key', {
    expiresIn: '30d',
  });
}

/**
 * POST /api/auth/signup
 * Register a new user
 */
export async function signup(req, res, next) {
  try {
    const { username, email, password, fullName, avatar } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['username, email, and password are required'],
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({
        error: `User with this ${field} already exists`,
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      fullName,
      avatar,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    console.log(`✅ New user registered: ${username} (${email})`);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find user and select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is deactivated',
      });
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Clear authentication (client-side token removal recommended)
 */
export function logout(req, res) {
  console.log(`✅ User logged out: ${req.user?.email || 'unknown'}`);

  res.json({
    message: 'Logged out successfully',
  });
}

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Requires: JWT token in header or cookie
 */
export async function getCurrentUser(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/profile
 * Update user profile
 */
export async function updateProfile(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    const { fullName, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(fullName && { fullName }),
        ...(avatar && { avatar }),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    console.log(`✅ User profile updated: ${user.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/change-password
 * Change user password
 */
export async function changePassword(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password changed for user: ${user.email}`);

    res.json({
      message: 'Password changed successfully',
    });
  } catch (err) {
    next(err);
  }
}
