import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteAccount } from "../services/user.service.js";

// Makes user input safe to put inside a RegExp ("a.b*" must not act as a pattern)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/users/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PATCH /api/users/me
export const updateMe = asyncHandler(async (req, res) => {
  const updates = req.body; // already cleaned by validate(updateMeSchema)

  if (updates.email && updates.email !== req.user.email) {
    const taken = await User.findOne({ email: updates.email });
    if (taken) throw ApiError.conflict("Email is already in use");
  }

  req.user.set(updates);
  await req.user.save();

  res.json({ success: true, user: req.user });
});

// DELETE /api/users/me
export const deleteMe = asyncHandler(async (req, res) => {
  await deleteAccount(req.user._id);
  res.json({ success: true, message: "Account deleted" });
});

// GET /api/users?search=john
// Used by the "start private chat" modal to find real people.
export const searchUsers = asyncHandler(async (req, res) => {
  const { search, limit } = req.validated.query;

  const users = await User.find({
    _id: { $ne: req.user._id }, // never show yourself
    $or: [
      { name: { $regex: escapeRegex(search), $options: "i" } }, // partial name match
      { email: search.toLowerCase() }, // exact email only, so emails can't be browsed
    ],
  })
    .select("name avatar lastSeen") // never expose email or anything private
    .limit(limit);

  res.json({ success: true, users });
});
