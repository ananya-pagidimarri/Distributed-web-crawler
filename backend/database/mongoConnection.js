const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGO_URI, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_NAME } = require('../config/envConfig');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    logger.info('MongoDB connected successfully');

    // Lazy-load User model after connection is ready
    const User = require('../models/UserModel');

    // Seed default admin if no admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      // Hash the admin password from .env before storing
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      await User.create({
        name: DEFAULT_ADMIN_NAME,
        email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        role: 'admin'
      });
      logger.info(`Default admin seeded → Email: ${DEFAULT_ADMIN_EMAIL} | Password: ${DEFAULT_ADMIN_PASSWORD}`);
    } else {
      logger.info(`Admin account exists → ${adminExists.email}`);
    }

  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    logger.info('Make sure MongoDB is running: mongod or check MONGO_URI in .env');
    process.exit(1);
  }
};

const isDbConnected = () => isConnected;

module.exports = { connectDB, isDbConnected };