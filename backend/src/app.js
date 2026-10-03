const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { apiRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const facultyRoutes = require('./routes/faculty.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

/**
 * SECURITY CONTROLS:
 * 1. Helmet: sets critical HTTP security headers (CSP, X-Content-Type-Options, HSTS, etc.)
 * 2. CORS: restricted strictly to configured frontend origin with credentials enabled
 * 3. Body parser size limits to prevent DoS via payload bloating
 * 4. Cookie parser for reading httpOnly auth cookies
 */
app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// Deny-by-default for non-matching API and static routes
app.use(notFoundHandler);

// Centralized safe error handler (prevents stack trace disclosure)
app.use(errorHandler);

module.exports = app;
