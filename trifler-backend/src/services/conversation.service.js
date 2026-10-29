import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

//! Only these user fields are ever sent to other people
const MEMBER_FIELDS = "name avatar lastSeen";

// Fills in member names/avatars and the last message preview
export const withDetails = (query) =>
  query
    .populate("members", MEMBER_FIELDS)
    .populate({ path: "lastMessage", select: "text sender createdAt" });

// All conversations of a user, most recent activity first
export const listForUser = (userId) =>
  withDetails(
    Conversation.find({ members: userId }).sort({ updatedAt: -1 }).limit(100),
  );

//! Loads a conversation and makes sure this user belongs to it.
// ! Used by the REST message routes AND the WebSocket handlers.
export const getForMember = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const isMember = conversation.members.some((id) => id.equals(userId));
  if (!isMember)
    throw ApiError.forbidden("You are not a member of this conversation");

  return conversation;
};

// Returns the private chat between two people, creating it if needed.
export const findOrCreateDirect = async (userId, otherUserId) => {
  if (String(userId) === String(otherUserId)) {
    throw ApiError.badRequest("You cannot start a chat with yourself");
  }

  const otherExists = await User.exists({ _id: otherUserId });
  if (!otherExists) throw ApiError.notFound("User not found");

  const directKey = Conversation.buildDirectKey(userId, otherUserId);
  const find = () => withDetails(Conversation.findOne({ directKey }));

  let conversation = await find();
  if (conversation) return { conversation, created: false };

  let created = true;
  try {
    await Conversation.create({
      type: "direct",
      members: [userId, otherUserId],
      directKey,
      createdBy: userId,
    });
  } catch (err) {
    // 11000 = duplicate key: the other person created this chat a split second ago
    if (err.code !== 11000) throw err;
    created = false;
  }

  conversation = await find();
  return { conversation, created };
};
