//!All the conversation means - one to one conversation and group conversation schema here,
//!Zod is a TypeScript-first schema declaration and validation library.

import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";

//! POST /conversations/direct
export const createDirectSchema = z.object({
  userId: objectIdSchema,
});

//! GET /conversations/:id/messages?limit=30&before=2026-10-28T10:00:00.000Z
// "before" loads OLDER messages than that time (for scroll-up pagination)
export const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  before: z.coerce.date({ error: "before must be a valid date" }).optional(),
});
