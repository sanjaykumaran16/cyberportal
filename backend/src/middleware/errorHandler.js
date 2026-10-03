/**
 * SECURITY CONTROL: Safe Error Handler Middleware
 * - Suppresses stack traces and internal database errors to prevent information disclosure.
 * - Formats standard JSON error responses.
 */
function errorHandler(err, req, res, next) {
  // Log internal error for server monitoring without exposing it to the client
  console.error(`[INTERNAL ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'An unexpected internal error occurred.' : err.message,
    ...(isProd ? {} : { debug_info: err.message }),
  });
}

/**
 * SECURITY CONTROL: Deny-by-Default Fallback for Undefined Routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found or resource inaccessible.',
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
