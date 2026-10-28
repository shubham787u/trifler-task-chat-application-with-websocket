import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { getForMember } from "./conversation.service.js";

//! Older-to-newer page of messages. Pass `before` (a date) to load the page
//! that comes before the messages you already have.
export const getMessages = async (
  conversationId,
  userId,
  { limit, before },
) => {
  await getForMember(conversationId, userId); // 404 / 403 checks

  const filter = { conversation: conversationId };
  if (before) filter.createdAt = { $lt: before };

  // Fetch one extra to know if there is another page
  const found = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate("sender", "name avatar");

  const hasMore = found.length > limit;
  const messages = found.slice(0, limit).reverse(); // oldest first, ready to display

  return { messages, hasMore };
};

// Saves a message and bumps the conversation to the top of everyone's list.
// Used by the WebSocket "message.send" handler in a later step.
export const createMessage = async ({ conversationId, senderId, text }) => {
  const conversation = await getForMember(conversationId, senderId);

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text,
    readBy: [senderId],
  });

  // findByIdAndUpdate also refreshes updatedAt, which drives the sort order
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
  });

  return {
    message: await message.populate("sender", "name avatar"),
    memberIds: conversation.members,
  };
};
