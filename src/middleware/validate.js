/**
 * TaskFlow API - Zod Schema Validation Middleware
 * Validates request body, query parameters, and URL path parameters.
 */

const AppError = require('../utils/appError');

/**
 * Creates an Express validation middleware for a given Zod schema specification.
 * Supports both plain objects { body, query, params } and ZodObject instances.
 *
 * @param {Object|import('zod').ZodObject} schemas - Schema mapping object or ZodObject
 * @returns {Function} Express middleware function
 */
const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      const paramsSchema = schemas.params || (schemas.shape && schemas.shape.params);
      const querySchema = schemas.query || (schemas.shape && schemas.shape.query);
      const bodySchema = schemas.body || (schemas.shape && schemas.shape.body);

      if (paramsSchema) {
        req.params = await paramsSchema.parseAsync(req.params);
      }
      if (querySchema) {
        req.query = await querySchema.parseAsync(req.query);
      }
      if (bodySchema) {
        req.body = await bodySchema.parseAsync(req.body);
      }
      return next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return next(
          new AppError('Validation failed. Please check your request parameters.', 422, 'VALIDATION_ERROR', details)
        );
      }
      return next(error);
    }
  };
};

module.exports = validate;
