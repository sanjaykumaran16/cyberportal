/**
 * SECURITY CONTROL: Zod Schema Request Validation Middleware
 * Validates req.body, req.query, or req.params.
 * Returns clean validation error messages and strips unexpected malicious fields.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Invalid request data.',
        errors: formattedErrors,
      });
    }

    // Replace source data with parsed & sanitized data
    req[source] = result.data;
    next();
  };
}

module.exports = {
  validate,
};
