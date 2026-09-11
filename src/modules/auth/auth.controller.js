/**
 * TaskFlow API - Authentication Controller
 * Handles user registration, credential authentication, and JWT issuance.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const config = require('../../config/env');
const AppError = require('../../utils/appError');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Generates signed JWT authentication token.
 * Payload includes minimal identity fields to keep token size compact.
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * POST /api/v1/auth/register
 * Register a new user account.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw AppError.conflict('An account with this email address already exists.');
  }

  // Event Loop Discipline:
  // bcrypt.hash is asynchronous and uses worker threads (libuv) under the hood.
  // In production we use salt rounds = 10 (~100ms compute time per hash), and in test mode = 4 for instant execution.
  const saltRounds = process.env.NODE_ENV === 'test' ? 4 : 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const insertResult = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at;`,
    [name, email, passwordHash, role || 'user']
  );

  const newUser = insertResult.rows[0];
  const token = generateToken(newUser);

  return ApiResponse.created(
    res,
    {
      user: newUser,
      token,
      tokenType: 'Bearer',
      expiresIn: config.jwt.expiresIn,
    },
    'User registered successfully'
  );
});

/**
 * POST /api/v1/auth/login
 * Authenticate user credentials and return JWT.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await query(
    'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    throw AppError.unauthorized('Invalid email or password credentials.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password credentials.');
  }

  const token = generateToken(user);

  return ApiResponse.success(
    res,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      token,
      tokenType: 'Bearer',
      expiresIn: config.jwt.expiresIn,
    },
    'Authentication successful'
  );
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user profile.
 */
const getMe = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
    [req.user.id]
  );

  const user = result.rows[0];
  if (!user) {
    throw AppError.notFound('User profile not found.');
  }

  return ApiResponse.success(res, { user }, 'User profile retrieved successfully');
});

module.exports = {
  register,
  login,
  getMe,
};
