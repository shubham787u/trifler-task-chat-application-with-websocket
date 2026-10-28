//! Wraps an async controller so you don't need try/catch in every one.
//! Any error thrown (or rejected promise) is passed to the error handler via next().
//
// Usage:
//   router.get("/me", asyncHandler(async (req, res) => { ... }));
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
