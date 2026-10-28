//!  business logic, shared by REST and WebSocket
//!  sign and verify JWT

import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

// Creates a signed JWT. Only the user id goes inside - never put passwords
// or other sensitive data in a token, because anyone can read its payload.
export const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN,
  });

// Verifies signature + expiry. Throws JsonWebTokenError / TokenExpiredError
// on failure, which errorHandler.js already turns into a 401.
export const verifyToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });

// Token -> user document. Shared by the REST middleware AND the WebSocket
// handshake, so both places authenticate in exactly the same way.
export const getUserFromToken = async (token) => {
  if (!token) throw ApiError.unauthorized("Authentication required");

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub);

  // Token is valid but the account was deleted in the meantime
  if (!user) throw ApiError.unauthorized("User no longer exists");

  return user;
};
