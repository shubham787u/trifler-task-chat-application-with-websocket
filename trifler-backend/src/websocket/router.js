//!  # routes incoming events to handlers by "type"import { ZodError } from "zod";
//!Zod is a TypeScript-first schema declaration and validation library.
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { sendToSocket } from "./connectionStore.js";
import { handleMessageSend } from "./handlers/message.handler.js";
import { handleTyping } from "./handlers/typing.handler.js";

// event "type" -> handler. A Map (not a plain object) so a client can never
// reach inherited names like "constructor" or "__proto__".
const handlers = new Map([
  ["ping", (ws) => sendToSocket(ws, { type: "pong" })],
  ["message.send", handleMessageSend],
  ["typing", handleTyping],
]);

//! Flood protection: at most 30 events per 10 seconds per connection
const RATE_WINDOW_MS = 10000;
const RATE_MAX_EVENTS = 30;

const isRateLimited = (ws) => {
  const now = Date.now();
  if (!ws.rateWindowStart || now - ws.rateWindowStart > RATE_WINDOW_MS) {
    ws.rateWindowStart = now;
    ws.rateCount = 0;
  }
  ws.rateCount += 1;
  return ws.rateCount > RATE_MAX_EVENTS;
};

//! Every error reaches the client in one shape:
//   { type: "error", event: "<the event that failed>", clientId?, message }
const sendError = (ws, event, message) =>
  sendToSocket(ws, { type: "error", event: event?.type, clientId: event?.clientId, message });

export const routeEvent = async (ws, raw) => {
  if (isRateLimited(ws)) {
    return sendToSocket(ws, { type: "error", message: "Too many events, slow down" });
  }

  let event;
  try {
    event = JSON.parse(raw.toString());
  } catch {
    return sendToSocket(ws, { type: "error", message: "Invalid JSON" });
  }

  if (!event || typeof event !== "object" || typeof event.type !== "string") {
    return sendToSocket(ws, { type: "error", message: "Event must be an object with a type" });
  }

  const handler = handlers.get(event.type);
  if (!handler) return sendError(ws, event, "Unknown event type");

  try {
    await handler(ws, event);
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(ws, event, err.issues[0]?.message || "Invalid event");
    } else if (err instanceof ApiError) {
      sendError(ws, event, err.message); // e.g. "You are not a member of this conversation"
    } else {
      logger.error(`WebSocket handler "${event.type}" failed:`, err);
      sendError(ws, event, "Something went wrong");
    }
  }
};