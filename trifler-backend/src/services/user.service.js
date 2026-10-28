import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { removeMemberFromGroup } from "./group.service.js";

//! Deletes an account and cleans up everything that depends on it:
//  - private chats with this user are deleted (with their messages)
//  - in groups the user is removed (see removeMemberFromGroup: empty groups are
//    deleted, and the next member becomes admin if the last admin leaves)
//  - messages the user sent in groups stay, so other people's history is intact
// (No DB transaction: standalone MongoDB doesn't support them, so the user
//  document is deleted last - a failure halfway can simply be retried.)
export const deleteAccount = async (userId) => {
  const conversations = await Conversation.find({ members: userId });
  const directChatIds = [];

  for (const conversation of conversations) {
    if (conversation.type === "direct") {
      directChatIds.push(conversation._id);
    } else {
      await removeMemberFromGroup(conversation, userId);
    }
  }

  if (directChatIds.length > 0) {
    await Message.deleteMany({ conversation: { $in: directChatIds } });
    await Conversation.deleteMany({ _id: { $in: directChatIds } });
  }

  await User.findByIdAndDelete(userId);
};
