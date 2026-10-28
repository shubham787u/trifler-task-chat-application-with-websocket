import { z } from "zod";

// PATCH /users/me - every field optional, but at least one must be sent
export const updateMeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters")
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email")
      .optional(),
    avatar: z.string().trim().max(500, "Avatar URL is too long").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Send at least one field to update",
  });

// GET /users?search=john&limit=10
export const searchUsersSchema = z.object({
  search: z
    .string({ error: "Search text is required" })
    .trim()
    .min(2, "Search must be at least 2 characters")
    .max(50, "Search must be at most 50 characters"),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
