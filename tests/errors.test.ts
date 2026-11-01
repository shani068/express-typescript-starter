import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";

import { env } from "@/env";
import { logger } from "@/lib/logger";
import { errorHandler } from "@/middleware/error-handler";
import { HttpError } from "@/utils/http-error";

import { request } from "./http";

import type { Request, Response } from "express";

// Runs the error handler with a minimal response object and returns what it sent.
const handle = (err: unknown) => {
  const sent: { status?: number; body?: { error: Record<string, unknown> } } = {};
  const res = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: { error: Record<string, unknown> }) {
      sent.body = body;
      return this;
    },
  };
  errorHandler(err, {} as Request, res as unknown as Response, () => {});
  return sent;
};

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("Prisma failure", {
    code,
    clientVersion: Prisma.prismaVersion.client,
  });

const originalNodeEnv = env.NODE_ENV;

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
  vi.restoreAllMocks();
});

describe("unknown routes", () => {
  it("respond 404 with the standard JSON error body", async () => {
    const res = await request("/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await res.json()) as { error: { message: unknown } };
    expect(typeof body.error.message).toBe("string");
  });
});

describe("request body parser errors", () => {
  it("respond 400 with the standard error body for malformed JSON", async () => {
    const res = await request("/does-not-exist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"name": ',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: unknown } };
    expect(typeof body.error.message).toBe("string");
  });

  it("respond 413 for a JSON body over the size limit", async () => {
    const res = await request("/does-not-exist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(200 * 1024) }),
    });

    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: { message: expect.any(String) as string } });
  });

  it("do not cover other errors that merely carry a 4xx status", () => {
    vi.spyOn(logger, "error").mockImplementation(() => logger);
    const err = Object.assign(new Error("upstream said 404"), { status: 404 });

    expect(handle(err).status).toBe(500);
  });
});

describe("errorHandler", () => {
  it("uses the status and message of an HttpError", () => {
    const { status, body } = handle(new HttpError(403, "Forbidden"));

    expect(status).toBe(403);
    expect(body).toEqual({ error: { message: "Forbidden" } });
  });

  it("maps a ZodError to 400 with one detail per failing field", () => {
    const schema = z.object({ name: z.string(), profile: z.object({ age: z.number() }) });
    const result = schema.safeParse({ profile: { age: "old" } });
    if (result.success) throw new Error("expected validation to fail");

    const { status, body } = handle(result.error);

    expect(status).toBe(400);
    expect(body?.error.details).toEqual([
      { path: "name", message: expect.any(String) as string },
      { path: "profile.age", message: expect.any(String) as string },
    ]);
  });

  it("maps Prisma P2002 (unique constraint) to 409", () => {
    const { status, body } = handle(prismaError("P2002"));

    expect(status).toBe(409);
    expect(body?.error.message).toEqual(expect.any(String));
  });

  it("maps Prisma P2025 (record not found) to 404", () => {
    const { status, body } = handle(prismaError("P2025"));

    expect(status).toBe(404);
    expect(body?.error.message).toEqual(expect.any(String));
  });

  it("returns a generic 500 without a stack in production, and logs the stack", () => {
    env.NODE_ENV = "production";
    const logSpy = vi.spyOn(logger, "error").mockImplementation(() => logger);
    const err = new Error("database password is hunter2");

    const { status, body } = handle(err);

    expect(status).toBe(500);
    expect(body).toEqual({ error: { message: "Internal server error" } });
    expect(logSpy).toHaveBeenCalledWith(err.message, { stack: err.stack });
  });

  it("includes the stack in development", () => {
    env.NODE_ENV = "development";
    vi.spyOn(logger, "error").mockImplementation(() => logger);
    const err = new Error("boom");

    const { status, body } = handle(err);

    expect(status).toBe(500);
    expect(body?.error.message).toBe("Internal server error");
    expect(body?.error.stack).toBe(err.stack);
  });
});
