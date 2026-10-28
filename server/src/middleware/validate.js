import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req.params / req.query / req.body against zod schemas.
 * Parsed values are exposed on req.valid (Express 5 makes req.query read-only).
 */
export const validate = (schemas) => (req, _res, next) => {
  req.valid = req.valid || {};
  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      return next(ApiError.badRequest(details[0]?.message || 'Invalid request', details));
    }
    req.valid[key] = result.data;
  }
  next();
};
