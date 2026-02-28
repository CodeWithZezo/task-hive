import AppError from '../utils/AppError.js';

/**
 * Middleware factory that validates req.body against a Zod schema
 * @param {ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return next(new AppError('Validation failed', 422, errors));
  }

  // Replace with parsed (and possibly transformed) data
  req[source] = result.data;
  next();
};