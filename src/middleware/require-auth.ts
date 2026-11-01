import { fromNodeHeaders } from "better-auth/node";

import { auth } from "@/lib/auth";
import { HttpError } from "@/utils/http-error";

import type { User } from "@/lib/auth";
import type { NextFunction, Request, Response } from "express";

// Rejects requests without a Better Auth session; otherwise exposes the user as `req.user`.
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) throw new HttpError(401, "Unauthorized");

  req.user = session.user;
  next();
};

// For handlers behind requireAuth: returns req.user, typed as present.
export const sessionUser = (req: Request): User => {
  if (!req.user) throw new HttpError(401, "Unauthorized");
  return req.user;
};
