import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

import * as UserService from "./user.service";

import type { Request, Response } from "express";

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await UserService.getById(userId);
  res.status(200).json(new ApiResponse(200, user));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await UserService.update(userId, req.body);
  res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});
