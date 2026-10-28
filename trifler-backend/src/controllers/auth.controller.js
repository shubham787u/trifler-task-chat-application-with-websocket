import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { signToken } from "../services/token.service.js";

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("Email is already registered");

  // Password is hashed automatically by the pre-save hook in User.js
  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    token: signToken(user.id),
    user, // toJSON() removes the password
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has select:false in the model, so ask for it explicitly
  const user = await User.findOne({ email }).select("+password");

  // Same message for "no such email" and "wrong password", so attackers
  // can't discover which emails are registered
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  res.json({
    success: true,
    token: signToken(user.id),
    user,
  });
});
