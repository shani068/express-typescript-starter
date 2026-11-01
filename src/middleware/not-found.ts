import { HttpError } from "@/utils/http-error";

import type { Request, Response } from "express";

// Mounted after all routes: anything that reaches it matched no route.
export const notFound = (req: Request, _res: Response): void => {
  throw new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`);
};
