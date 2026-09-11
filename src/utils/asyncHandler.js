/**
 * TaskFlow API - Async Route Wrapper
 * Wraps asynchronous controller methods to catch unhandled Promise rejections
 * and cleanly forward them to Express's next() error handling chain.
 *
 * Avoids repetitive try/catch boilerplate across controllers.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
