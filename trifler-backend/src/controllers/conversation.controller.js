import asyncHandler from "../utils/asyncHandler.js";
import * as conversationService from "../services/conversation.service.js";
import * as messageService from "../services/message.service.js";
import { sendToUsers } from "../websocket/connectionStore.js";

// GET /api/conversations
export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await conversationService.listForUser(req.user._id);
  res.json({ success: true, conversations });
});

// POST /api/conversations/direct   body: { userId }
export const createDirect = asyncHandler(async (req, res) => {
  const { conversation, created } =
    await conversationService.findOrCreateDirect(req.user._id, req.body.userId);
  sendToUsers(
    conversation.members.map((member) => member.id || member._id || member),
    { type: "conversation.created", conversationId: conversation.id },
  );
  // 201 = new chat, 200 = it already existed (the frontend just opens it)
  res.status(created ? 201 : 200).json({ success: true, conversation });
});

// GET /api/conversations/:id/messages?limit=30&before=<date>
export const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { limit, before } = req.validated.query;

  const { messages, hasMore } = await messageService.getMessages(
    id,
    req.user._id,
    {
      limit,
      before,
    },
  );

  res.json({ success: true, messages, hasMore });
});
