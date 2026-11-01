import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { getUser, updateUser } from "@/controllers/users.controller";
import { HttpError } from "@/utils/http-error";

const { findUnique, update } = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { user: { findUnique, update } },
}));

const publicFields = { id: true, name: true, email: true, createdAt: true };
const profile = {
  id: "user_1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => {
  findUnique.mockReset();
  update.mockReset();
});

describe("getUser", () => {
  it("returns the user's public fields", async () => {
    findUnique.mockResolvedValue(profile);

    await expect(getUser("user_1")).resolves.toEqual(profile);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: "user_1" }, select: publicFields });
  });

  it("throws HttpError(404) when the user does not exist", async () => {
    findUnique.mockResolvedValue(null);

    const error = await getUser("missing").catch((err: unknown) => err);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 404 });
  });
});

describe("updateUser", () => {
  it("updates only the given input and returns the public fields", async () => {
    const updated = { ...profile, name: "Ada King" };
    update.mockResolvedValue(updated);

    await expect(updateUser("user_1", { name: "Ada King" })).resolves.toEqual(updated);
    expect(update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { name: "Ada King" },
      select: publicFields,
    });
  });
});
