const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[RBAC Server] Security-hardened College Portal API running on http://localhost:${PORT}`);
  console.log(`[RBAC Server] Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[RBAC Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[RBAC Server] Process terminated.');
  });
});
