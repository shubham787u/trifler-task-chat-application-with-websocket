import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";

// POST /groups
// memberIds = the people to add. The creator is added automatically as admin.
export const createGroupSchema = z.object({
  name: z
    .string({ error: "Group name is required" })
    .trim()
    .min(2, "Group name must be at least 2 characters")
    .max(60, "Group name must be at most 60 characters"),
  description: z
    .string()
    .trim()
    .max(200, "Description must be at most 200 characters")
    .default(""),
  memberIds: z
    .array(objectIdSchema, { error: "memberIds must be a list of user ids" })
    .min(1, "Add at least one member")
    .max(49, "A group can have at most 50 members"),
});

// POST /groups/:groupId/members
export const addMemberSchema = z.object({
  userId: objectIdSchema,
});

// Route params
export const groupIdParamSchema = z.object({ groupId: objectIdSchema });
export const memberParamSchema = z.object({
  groupId: objectIdSchema,
  userId: objectIdSchema,
});
