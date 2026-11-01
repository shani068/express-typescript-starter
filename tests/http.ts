import { afterAll, beforeAll } from "vite-plus/test";

import app from "@/app";

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// Importing this file starts the app on a random port for the importing test file.
let server: Server | undefined;
let baseUrl = "";

beforeAll(async () => {
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  server?.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    server?.close((err) => (err ? reject(err) : resolve()));
  });
});

export const request = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${baseUrl}${path}`, init);

// Shorthand for a JSON body with the matching content type.
export const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
