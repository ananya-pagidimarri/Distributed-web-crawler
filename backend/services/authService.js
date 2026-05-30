const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/envConfig');

// Login — optionally enforce expectedRole (only for admin endpoint)
exports.login = async (email, password, expectedRole = null) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('Invalid email or password');

  // Compare plain password against the stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  if (expectedRole && user.role !== expectedRole) {
    throw new Error(`Access denied. Requires ${expectedRole} privileges.`);
  }

  // Sign JWT
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

// Register — hashes password before saving
exports.register = async (name, email, password) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: 'user'
  });

  return { name: newUser.name, email: newUser.email, role: newUser.role };
};