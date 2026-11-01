import { describe, expect, it, vi } from "vite-plus/test";

import { getRedis } from "@/lib/redis";

const RedisMock = vi.hoisted(() => vi.fn());

vi.mock("ioredis", () => ({ default: RedisMock }));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test", REDIS_URL: undefined } }));

describe("lib/redis", () => {
  it("does not connect when the module is imported", () => {
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("throws a clear error from getRedis() when REDIS_URL is unset", () => {
    expect(() => getRedis()).toThrow("REDIS_URL is not set");
    expect(RedisMock).not.toHaveBeenCalled();
  });
});
