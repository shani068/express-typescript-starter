import { db } from "@/lib/db";
import { HttpError } from "@/utils/http-error";

import type { UpdateUserInput } from "@/schemas/users.schema";
import type { Prisma } from "@prisma/client";

// The only user fields the API exposes; credentials live in Account and are never selected.
const publicUserFields = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const getUser = async (userId: string) => {
  const user = await db.user.findUnique({ where: { id: userId }, select: publicUserFields });
  if (!user) throw new HttpError(404, "User not found");
  return user;
};

// A missing user surfaces as Prisma P2025, which the error handler maps to 404.
export const updateUser = (userId: string, input: UpdateUserInput) =>
  db.user.update({ where: { id: userId }, data: input, select: publicUserFields });
