//! protects routes by checking the JWT
//! runs zod schemas on requests

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { getUserFromToken } from "../services/token.service.js";

// Protects a route. Expects the header:  Authorization: Bearer <token>
// On success it sets req.user, so controllers can use req.user.id.
//
// Usage:  router.get("/me", protect, getMe);
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Authentication required");
  }

  const token = header.split(" ")[1];
  req.user = await getUserFromToken(token);

  next();
});
