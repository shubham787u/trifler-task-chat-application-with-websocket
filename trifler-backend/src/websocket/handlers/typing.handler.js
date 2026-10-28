// # drives the TypeIndicator component

import { typingSchema } from "../../validators/message.schema.js";
import { getForMember } from "../../services/conversation.service.js";
import { sendToUsers } from "../connectionStore.js";

// { type: "typing", conversationId, isTyping: true | false }
// Tells the OTHER members that this user is typing (drives TypeIndicator).
// The frontend should send isTyping:true at most every ~2 seconds while
// typing, and isTyping:false when the box is emptied or the message is sent.
export const handleTyping = async (ws, event) => {
  const { conversationId, isTyping } = typingSchema.parse(event);

  // Also checks the user really belongs to this conversation
  const conversation = await getForMember(conversationId, ws.user._id);

  sendToUsers(
    conversation.members,
    {
      type: "typing",
      conversationId,
      user: { id: ws.user.id, name: ws.user.name },
      isTyping,
    },
    [ws.user.id], // don't echo it back to the person typing
  );
};
