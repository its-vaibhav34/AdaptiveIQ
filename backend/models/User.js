import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username must not exceed 50 characters'],
      lowercase: true,
      match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: [100, 'Full name must not exceed 100 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['player', 'admin'],
      default: 'player',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Hash password before saving if modified
 * Middleware: pre-save hook
 */
UserSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Instance method: Compare plaintext password with hashed password
 * Usage: user.matchPassword(plaintextPassword)
 * Returns: Promise<boolean>
 */
UserSchema.methods.matchPassword = async function (plaintextPassword) {
  return bcrypt.compare(plaintextPassword, this.password);
};

/**
 * Instance method: Return user data without sensitive fields
 */
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', UserSchema);
