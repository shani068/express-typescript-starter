import { fromNodeHeaders } from "better-auth/node";

import { auth } from "@/config/auth.config";

import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

import type { Request, Response, NextFunction } from "express";

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return next(new ApiError(401, "Unauthorized: Please log in to access this resource"));
    }

    req.user = session.user;
    next();
  }
);
