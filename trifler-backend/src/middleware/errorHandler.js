import { ZodError } from "zod";
import env from "../config/env.js";
import logger from "../utils/logger.js";

// Central error handler - must be the LAST middleware in app.js.
// Every error in the app ends up here and leaves as the same JSON shape:
//   { success: false, message: "...", errors?: [...] }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors || null;

  // Zod validation error (request body/params failed a schema)
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  // Mongoose schema validation error
  else if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose bad ObjectId, e.g. /groups/abc
  else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB duplicate key, e.g. email already registered
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
  }

  // JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired, please log in again";
  }

  // Log server errors fully; 4xx are the client's fault so a short line is enough
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err);
  } else {
    logger.debug(
      `${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`,
    );
  }

  // Never leak internal error details to clients in production
  if (statusCode >= 500 && env.isProd) {
    message = "Internal server error";
    errors = null;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(!env.isProd && statusCode >= 500 && { stack: err.stack }),
  });
};

export default errorHandler;
