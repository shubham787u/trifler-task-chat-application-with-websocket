import { z } from "zod";

// A MongoDB ObjectId as a string: 24 hex characters
export const objectIdSchema = z
  .string({ error: "Id is required" })
  .regex(/^[a-f\d]{24}$/i, "Invalid id");

// For routes like /conversations/:id/messages
export const idParamSchema = z.object({ id: objectIdSchema });
