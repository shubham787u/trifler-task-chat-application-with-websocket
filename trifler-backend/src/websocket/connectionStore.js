// # maps userId to sockets and conversationId to subscribersimport { WebSocket } from "ws";

// Who is connected right now.  userId (string) -> Set of sockets
// One user can have several sockets at once (phone + laptop + two tabs).
// This lives in memory, so it works for ONE server process. To run several
// servers you would need something like Redis pub/sub on top of it.
const connections = new Map();

// Returns true if this is the user's FIRST open socket (= they just came online)
export const addConnection = (userId, ws) => {
  const key = String(userId);
  const isFirst = !connections.has(key);
  if (isFirst) connections.set(key, new Set());
  connections.get(key).add(ws);
  return isFirst;
};

// Returns true if that was the user's LAST open socket (= they just went offline)
export const removeConnection = (userId, ws) => {
  const key = String(userId);
  const sockets = connections.get(key);
  if (!sockets || !sockets.delete(ws)) return false;
  if (sockets.size === 0) {
    connections.delete(key);
    return true;
  }
  return false;
};

export const isOnline = (userId) => connections.has(String(userId));

export const getOnlineUserIds = (userIds) =>
  userIds.map(String).filter((id) => connections.has(id));

// Send one event to one socket (ignored if the socket is already closing)
export const sendToSocket = (ws, event) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(typeof event === "string" ? event : JSON.stringify(event));
  }
};

// Send an event to every socket of every listed user, except `exceptUserIds`.
// The JSON is built once, not once per socket.
export const sendToUsers = (userIds, event, exceptUserIds = []) => {
  const skip = new Set(exceptUserIds.map(String));
  const data = JSON.stringify(event);

  for (const id of new Set(userIds.map(String))) {
    if (skip.has(id)) continue;
    connections.get(id)?.forEach((ws) => sendToSocket(ws, data));
  }
};

export const sendToUser = (userId, event) => sendToUsers([userId], event);

// Closes all of a user's sockets (used when their account is deleted)
export const disconnectUser = (userId, reason = "Disconnected") => {
  const sockets = connections.get(String(userId));
  if (sockets) [...sockets].forEach((ws) => ws.close(4001, reason));
};
