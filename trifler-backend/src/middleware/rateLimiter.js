import rateLimit from "express-rate-limit";

const buildLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true, // sends RateLimit-* headers
    legacyHeaders: false,
    // Same JSON shape as every other error in the app
    message: { success: false, message },
  });

// General limiter for the whole API: 300 requests per 15 minutes per IP
export const apiLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Too many requests, please try again later.",
});

// Stricter limiter for login/register to slow down password guessing:
// 20 attempts per 15 minutes per IP (used on auth routes later)
export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many login attempts, please try again in 15 minutes.",
});
