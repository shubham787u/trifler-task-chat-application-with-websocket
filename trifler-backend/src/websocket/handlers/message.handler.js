//!# save the message, then broadcast it
import { messageSendSchema } from "../../validators/message.schema.js";
import { createMessage } from "../../services/message.service.js";
import { sendToUsers } from "../connectionStore.js";

// { type: "message.send", conversationId, text, clientId? }
//! Saves the message, then pushes it to EVERY online member of the conversation
// (the sender's own devices included, so all their tabs stay in sync).
export const handleMessageSend = async (ws, event) => {
  const { conversationId, text, clientId } = messageSendSchema.parse(event);

  const { message, memberIds } = await createMessage({
    conversationId,
    senderId: ws.user._id,
    text,
  });

  sendToUsers(memberIds, { type: "message.new", clientId, message });
};
