import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { auth } from "@/lib/auth";
import { requireAuth } from "@/middleware/require-auth";

import { request } from "./http";

import type { Request, Response } from "express";

vi.mock("@/lib/auth", () => ({
  auth: { handler: vi.fn(), api: { getSession: vi.fn() } },
}));

const getSession = vi.mocked(auth.api.getSession);

const sessionUser = {
  id: "user_1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => {
  getSession.mockReset();
});

describe("requireAuth", () => {
  it("responds 401 with the standard error body when there is no session", async () => {
    getSession.mockResolvedValue(null);

    const res = await request("/api/v1/users/me");

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { message: "Unauthorized" } });
  });

  it("exposes the session user as req.user when a session exists", async () => {
    getSession.mockResolvedValue({ user: sessionUser, session: {} } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    const req = { headers: { cookie: "better-auth.session_token=abc" } } as unknown as Request;
    const next = vi.fn();

    await requireAuth(req, {} as Response, next);

    expect(req.user).toEqual(sessionUser);
    expect(next).toHaveBeenCalledWith();
  });
});
