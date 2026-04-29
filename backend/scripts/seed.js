/**
 * Database Seeding Script
 * Creates demo users for testing authentication
 *
 * Run: node scripts/seed.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    await connectDB();

    // Demo users
    const demoUsers = [
      {
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'demo123',
        fullName: 'Demo User',
        role: 'player',
      },
      {
        username: 'admin_user',
        email: 'admin@example.com',
        password: 'admin123',
        fullName: 'Admin User',
        role: 'admin',
      },
      {
        username: 'quizmaster',
        email: 'quizmaster@example.com',
        password: 'quiz123',
        fullName: 'Quiz Master Pro',
        role: 'player',
      },
    ];

    // Clear existing users (optional - comment out to preserve data)
    // await User.deleteMany({});

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }],
      });

      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.username} (${userData.email})`);
      } else {
        console.log(`⏭️  User already exists: ${userData.username}`);
      }
    }

    console.log('✨ Database seeding completed!');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

seedDatabase();
