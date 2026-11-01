import { describe, expect, it } from "vite-plus/test";

import { request } from "./http";

const LIMIT = 100;

describe("API rate limit", () => {
  it("allows 100 /api requests, rejects the 101st with 429, and leaves /health and /docs alone", async () => {
    // Any /api path counts; an unknown one avoids touching auth or the database.
    for (let i = 1; i < LIMIT; i++) {
      await request("/api/rate-limit-probe");
    }

    const last = await request("/api/rate-limit-probe");
    expect(last.status).toBe(404);
    expect(last.headers.get("ratelimit-limit")).toBe(String(LIMIT));
    expect(last.headers.get("ratelimit-remaining")).toBe("0");

    const limited = await request("/api/rate-limit-probe");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("ratelimit-limit")).toBe(String(LIMIT));
    expect(limited.headers.get("ratelimit-reset")).not.toBeNull();
    expect(await limited.json()).toEqual({ error: { message: expect.any(String) as string } });

    expect((await request("/health")).status).toBe(200);
    expect((await request("/docs")).status).toBe(200);
  });
});
