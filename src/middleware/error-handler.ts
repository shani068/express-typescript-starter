import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { env } from "@/env";
import { logger } from "@/lib/logger";
import { type ErrorDetail, HttpError } from "@/utils/http-error";

import type { NextFunction, Request, Response } from "express";

const PRISMA_STATUS: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "Resource already exists" },
  P2025: { status: 404, message: "Record not found" },
};

// Errors from Express's body parsers (malformed JSON, body too large, unsupported charset) are
// http-errors with a `type` such as "entity.parse.failed", a 4xx `status`, and `expose: true`.
const isBodyParserError = (err: unknown): err is Error & { status: number } =>
  err instanceof Error &&
  "type" in err &&
  typeof err.type === "string" &&
  "expose" in err &&
  err.expose === true &&
  "status" in err &&
  typeof err.status === "number" &&
  err.status >= 400 &&
  err.status < 500;

const toHttpError = (err: unknown): HttpError | undefined => {
  if (err instanceof HttpError) return err;

  if (isBodyParserError(err)) return new HttpError(err.status, err.message);

  if (err instanceof ZodError) {
    const details: ErrorDetail[] = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return new HttpError(400, "Validation failed", details);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_STATUS[err.code];
    if (mapped) return new HttpError(mapped.status, mapped.message);
  }

  return undefined;
};

// Express recognises error handlers by their four parameters, so `_next` must stay.
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const httpError = toHttpError(err);

  if (httpError) {
    if (httpError.status >= 500) logger.error(httpError.message, { stack: httpError.stack });
    res.status(httpError.status).json({
      error: { message: httpError.message, details: httpError.details },
    });
    return;
  }

  const stack = err instanceof Error ? err.stack : undefined;
  logger.error(err instanceof Error ? err.message : "Unknown error", { stack });

  res.status(500).json({
    error: {
      message: "Internal server error",
      ...(env.NODE_ENV === "development" && { stack }),
    },
  });
};
