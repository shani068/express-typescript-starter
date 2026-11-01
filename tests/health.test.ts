import { describe, expect, it } from "vite-plus/test";

import { request } from "./http";

describe("GET /health", () => {
  it("responds 200 with { status: 'ok' }", async () => {
    const res = await request("/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
