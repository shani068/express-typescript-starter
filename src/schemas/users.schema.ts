import { z } from "zod";

// .strict() rejects unknown keys, so fields like `email` cannot be changed through this schema.
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
  })
  .strict();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
