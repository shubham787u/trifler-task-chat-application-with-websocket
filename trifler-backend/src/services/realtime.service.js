import Conversation from "../models/Conversation.js";
import logger from "../utils/logger.js";
import { withDetails } from "./conversation.service.js";
import { sendToUser, sendToUsers } from "../websocket/connectionStore.js";

// Pushes changes made through the REST API to people who are online, so the
//! sidebar updates without a refresh.  Events sent:
//   conversation.new      -> you now have a new chat/group (payload: full conversation)
//   conversation.updated  -> members of a group changed   (payload: full conversation)
//   conversation.removed  -> you no longer have this chat (payload: conversationId)
//
// None of these functions ever throw: the REST request has already succeeded,
// so a failed notification must never turn it into an error.

const idOf = (member) => String(member._id ?? member);
const memberIdsOf = (conversation) => conversation.members.map(idOf);

const safely =
  (label, fn) =>
  async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      logger.warn(`Realtime "${label}" failed:`, err.message);
    }
  };

//! A chat or group was created -> tell every member except the one who made it
export const notifyNewConversation = safely(
  "conversation.new",
  async (conversation, actorId) => {
    sendToUsers(
      memberIdsOf(conversation),
      { type: "conversation.new", conversation },
      [actorId],
    );
  },
);

// Someone was added to a group
export const notifyMemberAdded = safely(
  "member added",
  async (group, newUserId, actorId) => {
    sendToUser(newUserId, { type: "conversation.new", conversation: group });
    sendToUsers(
      memberIdsOf(group),
      { type: "conversation.updated", conversation: group },
      [actorId, newUserId],
    );
  },
);

// A group changed (someone joined / left / was removed) -> send everyone the fresh version
export const notifyConversationUpdated = safely(
  "conversation.updated",
  async (conversationId) => {
    const conversation = await withDetails(
      Conversation.findById(conversationId),
    );
    if (!conversation) return; // group was deleted in the meantime
    sendToUsers(memberIdsOf(conversation), {
      type: "conversation.updated",
      conversation,
    });
  },
);

// These users lost access to a conversation
export const notifyConversationRemoved = safely(
  "conversation.removed",
  async (conversationId, userIds) => {
    sendToUsers(userIds, {
      type: "conversation.removed",
      conversationId: String(conversationId),
    });
  },
);
