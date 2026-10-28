// Custom error class for errors we throw on purpose (wrong password, not found, etc.)
// The error handler middleware turns these into clean JSON responses.
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // optional: field-level details, e.g. validation errors
    this.isOperational = true; // marks it as an expected error, not a bug
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }
}

export default ApiError;
