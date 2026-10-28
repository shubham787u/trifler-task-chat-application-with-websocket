import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";

// WebSocket event:  { type: "message.send", conversationId, text, clientId? }
// clientId is optional: the frontend can put a temporary id on a message it
// shows instantly ("optimistic UI") and match it to the saved message later.
export const messageSendSchema = z.object({
  conversationId: objectIdSchema,
  text: z
    .string({ error: "Message text is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be at most 2000 characters"),
  clientId: z.string().max(64).optional(),
});

// WebSocket event:  { type: "typing", conversationId, isTyping? }
export const typingSchema = z.object({
  conversationId: objectIdSchema,
  isTyping: z.boolean().default(true),
});
