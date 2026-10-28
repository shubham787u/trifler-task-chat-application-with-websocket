//  # online and offline status
import Conversation from "../../models/Conversation.js";
import User from "../../models/User.js";
import {
  addConnection,
  removeConnection,
  getOnlineUserIds,
  sendToSocket,
  sendToUsers,
} from "../connectionStore.js";

// "Contacts" = everyone who shares at least one conversation with this user
const getContactIds = async (userId) => {
  const ids = await Conversation.find({ members: userId }).distinct("members");
  return ids.map(String).filter((id) => id !== String(userId));
};

// Called when a socket connects:
//  - the user gets the list of contacts that are online right now
//  - if this is their first socket, their contacts are told they came online
export const onConnect = async (ws) => {
  const userId = ws.user.id;
  const isFirstSocket = addConnection(userId, ws); // runs before the first await

  const contacts = await getContactIds(userId);
  sendToSocket(ws, {
    type: "presence.list",
    onlineUserIds: getOnlineUserIds(contacts),
  });

  if (isFirstSocket) {
    sendToUsers(contacts, { type: "presence", userId, online: true });
  }
};

// Called when a socket closes. Only when the LAST socket closes does the user
// count as offline (closing one of two tabs must not show them offline).
export const onDisconnect = async (ws) => {
  const userId = ws.user.id;
  if (!removeConnection(userId, ws)) return;

  const lastSeen = new Date();
  await User.findByIdAndUpdate(userId, { lastSeen });

  const contacts = await getContactIds(userId);
  sendToUsers(contacts, { type: "presence", userId, online: false, lastSeen });
};
