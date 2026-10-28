import { isBackendEnabled } from "./api";

let socket = null;
let reconnectTimer = null;
let shouldReconnect = false;
let statusHandler = null;
const subscriptions = new Map();
const eventSubscribers = new Set();

function getConversationId(message) {
  const conversation = message?.conversation;
  if (typeof conversation === "string") return conversation;
  return conversation?.id || conversation?._id;
}

function handleMessage(event) {
  let payload;
  try {
    payload = JSON.parse(event.data);
  } catch (error) {
    console.error("[Trifler WebSocket] Received invalid message JSON.", error);
    return;
  }

  eventSubscribers.forEach((onEvent) => onEvent(payload));
  if (payload?.type !== "message.new" || !payload.message) return;

  const conversationId = getConversationId(payload.message);
  subscriptions.get(String(conversationId))?.forEach((onMessage) => {
    onMessage(payload);
  });
}

export function connectWebSocket({ onStatus } = {}) {
  statusHandler = onStatus || statusHandler;
  if (!isBackendEnabled) {
    statusHandler?.("offline");
    return null;
  }
  if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
    return socket;
  }

  const token = localStorage.getItem("chatconnect_token");
  if (!token) {
    statusHandler?.("offline");
    return null;
  }

  shouldReconnect = true;
  const configuredURL = import.meta.env.VITE_WS_URL || "ws://localhost:9000/ws";
  const websocketURL = configuredURL
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");
  const url = new URL(websocketURL);

  statusHandler?.("connecting");
  socket = new WebSocket(url.toString(), [
    "trifler-chat",
    `trifler-auth.${token}`,
  ]);
  socket.onopen = () => statusHandler?.("connected");
  socket.onmessage = handleMessage;
  socket.onerror = () => statusHandler?.("error");
  socket.onclose = () => {
    socket = null;
    statusHandler?.("offline");
    if (shouldReconnect) {
      reconnectTimer = window.setTimeout(
        () => connectWebSocket({ onStatus: statusHandler }),
        5000,
      );
    }
  };
  return socket;
}

export function subscribeToConversation(conversationId, onMessage) {
  if (!isBackendEnabled || !conversationId || !onMessage) return () => {};

  const key = String(conversationId);
  const callbacks = subscriptions.get(key) || new Set();
  callbacks.add(onMessage);
  subscriptions.set(key, callbacks);

  return () => {
    callbacks.delete(onMessage);
    if (callbacks.size === 0) subscriptions.delete(key);
  };
}

export function subscribeToEvents(onEvent) {
  eventSubscribers.add(onEvent);
  return () => eventSubscribers.delete(onEvent);
}

export function publishMessage(conversationId, message) {
  if (!isBackendEnabled) return false;
  if (socket?.readyState !== WebSocket.OPEN) {
    console.error("[Trifler WebSocket] Cannot send: connection is not open.");
    return false;
  }

  socket.send(
    JSON.stringify({
      type: "message.send",
      conversationId,
      text: message.text,
      clientId: message.id,
    }),
  );
  return true;
}

export async function disconnectWebSocket() {
  shouldReconnect = false;
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  subscriptions.clear();
  if (!socket) return;

  const currentSocket = socket;
  socket = null;
  currentSocket.onclose = null;
  currentSocket.close();
}
