/**
 * TaskFlow API - Auth Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { registerSchema, loginSchema } = require('./auth.schema');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
