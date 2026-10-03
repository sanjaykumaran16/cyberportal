const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../schemas/validation.schemas');
const { authenticate } = require('../middleware/auth');

/**
 * Public Authentication Endpoints
 */
// POST /api/auth/login - Rate limited + Zod validated
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

// POST /api/auth/logout - Requires authenticated session
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/session - Verify session validity and get current user role
router.get('/session', authenticate, authController.getSession);

module.exports = router;
