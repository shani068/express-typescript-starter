import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { auth } from "@/lib/auth";

import { json, request } from "./http";

type Select = Record<string, boolean>;

const { findUnique, update } = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  auth: { handler: vi.fn(), api: { getSession: vi.fn() } },
}));
vi.mock("@/lib/db", () => ({
  db: { user: { findUnique, update } },
}));

const getSession = vi.mocked(auth.api.getSession);

// Includes fields that must never reach the client.
const storedUser: Record<string, unknown> = {
  id: "user_1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: true,
  image: null,
  password: "hash-that-must-not-leak",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
};

// Applies a Prisma `select` the way the database would.
const pick = (record: Record<string, unknown>, select: Select = {}) =>
  Object.fromEntries(Object.keys(select).map((key) => [key, record[key]]));

const signIn = () =>
  getSession.mockResolvedValue({ user: storedUser, session: {} } as unknown as Awaited<
    ReturnType<typeof auth.api.getSession>
  >);

beforeEach(() => {
  getSession.mockReset();
  findUnique.mockReset();
  update.mockReset();

  findUnique.mockImplementation(({ select }: { select: Select }) =>
    Promise.resolve(pick(storedUser, select))
  );
  update.mockImplementation(({ data, select }: { data: Record<string, unknown>; select: Select }) =>
    Promise.resolve(pick({ ...storedUser, ...data }, select))
  );
});

describe("GET /api/v1/users/me", () => {
  it("returns 200 with only id, name, email, and createdAt", async () => {
    signIn();

    const res = await request("/api/v1/users/me");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "user_1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns 401 with the standard error body without a session", async () => {
    getSession.mockResolvedValue(null);

    const res = await request("/api/v1/users/me");

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { message: "Unauthorized" } });
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("PUT /api/v1/users/me", () => {
  it("returns 200 with the updated profile for a valid name", async () => {
    signIn();

    const res = await request("/api/v1/users/me", json("PUT", { name: "Ada King" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "user_1",
      name: "Ada King",
      email: "ada@example.com",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user_1" }, data: { name: "Ada King" } })
    );
  });

  it("returns 400 for { email } and never updates the database", async () => {
    signIn();

    const res = await request("/api/v1/users/me", json("PUT", { email: "other@example.com" }));

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string; details: unknown[] } };
    expect(body.error.message).toEqual(expect.any(String));
    expect(body.error.details.length).toBeGreaterThan(0);
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 400 naming the name field for a 1-character name", async () => {
    signIn();

    const res = await request("/api/v1/users/me", json("PUT", { name: "A" }));

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { details: { path: string }[] } };
    expect(body.error.details).toEqual([expect.objectContaining({ path: "name" })]);
    expect(update).not.toHaveBeenCalled();
  });
});
