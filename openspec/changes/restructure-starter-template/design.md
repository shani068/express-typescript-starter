# Design

## Context

See `proposal.md` (Why) for motivation and `specs/` for required behavior.

Current state that shapes the approach:

- Runtime and package manager are Bun (`bun --watch src/server.ts`, `bun build --target=bun`). Validation runs through Vite+ 1.4.0: `vp check` (Oxfmt + Oxlint with type-aware rules + type-check) and `vp test` (Vitest 5, running on Node). Source must therefore stay runtime-neutral (no `Bun.*` APIs) so tests and the server run the same code.
- Express 4.19, Better Auth 1.6.9 with the Prisma adapter (Prisma 5, PostgreSQL), Zod 3, ioredis 5, Winston, swagger-jsdoc + Scalar.
- `vite.config.ts` already holds lint/fmt config, including the `vite-plus/prefer-vite-plus-imports` rule, which requires test imports from `vite-plus/test`.
- The Vite+ migration left `src/` with `asyncHandler` wrappers added to satisfy `no-misused-promises`; this design removes them again via Express 5.

## Goals / Non-Goals

**Goals:**

- One obvious location for every file type, enforced by lint where practical.
- Business logic callable identically from HTTP routes, agent tools, and tests.
- Fewest files and abstractions that satisfy the specs.

**Non-Goals:**

- A dependency-injection container, repository layer, or service/controller split beyond what is described here.
- A generic agent framework; the template only documents where agent code goes.
- Changing the runtime (Bun) or build tool (`bun build`).

## Decisions

### Target layout

```
src/
  server.ts            listen + graceful shutdown
  app.ts               middleware order, routers, error handling
  env.ts               zod-validated env; only reader of process.env
  routes/
    index.ts           mounts routers under their prefixes
    health.routes.ts   GET /health
    docs.routes.ts     GET /openapi.json, /docs
    users.routes.ts    /api/v1/users
  controllers/
    users.controller.ts
  schemas/
    users.schema.ts
  lib/
    db.ts  auth.ts  logger.ts  redis.ts
  middleware/
    require-auth.ts  rate-limit.ts  request-logger.ts  not-found.ts  error-handler.ts
  utils/
    http-error.ts
  types/
    express.d.ts
tests/
  setup.ts  http.ts  health.test.ts  errors.test.ts  users.test.ts  users.controller.test.ts
```

`agents/` is not pre-created (empty folders vanish in Git); AGENTS.md documents the pattern: `agents/<name>.agent.ts` (prompt, model, loop) and `agents/<name>.tools.ts` (tools that call controllers), with the model client in `lib/llm.ts`.

### Controllers are plain functions; routes own HTTP

A route handler parses input with the feature's schema, calls a controller with typed arguments, and sends the result. Controllers import from `lib/`, `schemas/` (types), and `utils/` only.

- _Alternative_: controllers as `(req, res)` handlers. Rejected during exploration — agent tools could not reuse them without fake requests.
- _Alternative_: separate `services/` layer under controllers. Rejected — with plain-function controllers it would be an empty pass-through.

### Validation inline in routes, not a middleware

Routes call `schema.parse(req.body)`; a `ZodError` propagates to the error handler, which maps it to `400` with `details: [{ path, message }]`. Schemas that must reject unknown keys use `.strict()` (profile update).

- _Alternative_: a `validate({ body, query, params })` middleware. Rejected — Express 5 makes `req.query` a read-only getter, and the middleware hides the parsed type from the handler; inline parsing is one line and fully typed.

### Express 5

Upgrade `express` to ^5 and `@types/express` to ^5. Express 5 forwards rejected promises from handlers to the error handler, and its types allow `Promise<void>` returns, so `no-misused-promises` no longer fires. This removes `asyncHandler`, every handler `try/catch`, and `ApiResponse`.

- Better Auth catch-all must use the new path syntax: `app.all("/api/auth/*splat", toNodeHandler(auth))`.
- _Alternative_: stay on Express 4 with `asyncHandler`. Rejected — boilerplate on every route is exactly what the template should remove.

### Errors

`utils/http-error.ts` exports `HttpError(status, message, details?)`. `middleware/error-handler.ts` maps, in order: `HttpError` → its status; `ZodError` → 400 with details; Prisma `P2002` → 409, `P2025` → 404; anything else → 500 with a generic message. It logs 5xx with stack via the logger and adds `stack` to the body only when `NODE_ENV=development`. `middleware/not-found.ts` throws `HttpError(404)` for unmatched routes. Success responses send the resource directly (`res.json(user)`).

- _Alternative_: keep the `{ success, data, message }` envelope. Rejected — status codes already carry success/failure; the envelope adds a class and a convention to every route.

### `lib/` clients

- `db.ts`: one `PrismaClient` (query logging in development).
- `auth.ts`: `betterAuth({ database: prismaAdapter(db, { provider: "postgresql" }), emailAndPassword: { enabled: true } })`; exports `Session` and `User` types. Secret and base URL come from `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`.
- `logger.ts`: current Winston setup minus the unused `morganStream`.
- `redis.ts`: `getRedis()` creates the ioredis client on first call (and throws a clear error if `REDIS_URL` is unset), logs connection events through the logger, and `closeRedis()` quits only if a client was created. Cache helpers (`getCache`/`setCache`/`deleteCache`) live in the same file; `deleteCacheByPattern` switches from `KEYS` to `SCAN` so it is safe on large databases.
- _Alternative_: drop Redis entirely. Rejected (default accepted in exploration): kept but zero-cost when unused.

### Middleware order in `app.ts`

`helmet → cors → request-logger → rate-limit (on /api) → Better Auth (/api/auth/*splat) → express.json → routes → not-found → error-handler`. Rate limiting sits before Better Auth so sign-in attempts are limited; Better Auth sits before `express.json` because it reads the raw body. `/health` and `/docs` are outside `/api` and therefore unlimited.

`rate-limit.ts` uses `express-rate-limit` (100 requests / 15 min / IP, standard headers) with a `handler` that sends the standard error body with `429`.

### Auth middleware

`middleware/require-auth.ts` calls `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`, throws `HttpError(401)` when absent, and sets `req.user`. Routes read `req.user` (typed in `types/express.d.ts` from `lib/auth`) and pass `req.user.id` to controllers — controllers never see the session object.

### API docs

`routes/docs.routes.ts` exports a router serving `/openapi.json` and `/docs` with the existing Scalar CSP. swagger-jsdoc scans `./src/routes/*.routes.ts`; route files keep `@openapi` JSDoc blocks. The JWT `bearerAuth` scheme is replaced by a `cookieAuth` scheme (`better-auth.session_token`).

### Tests

- Vitest via `vp test`; `vite.config.ts` gains `test: { include: ["tests/**/*.test.ts"], setupFiles: ["tests/setup.ts"] }` and `resolve.alias: { "@": <abs path to src> }`. Test imports use `vite-plus/test` (enforced by the existing lint rule).
- `tests/setup.ts` sets the env vars `env.ts` requires (test DB URL placeholder, 32-char secret) so importing the app never exits the process.
- `tests/http.ts` starts `app.listen(0)` and exposes a `request(path, init)` helper using `fetch` — no supertest dependency.
- Auth is mocked with `vi.mock("@/lib/auth")` returning a fixed session; the database with `vi.mock("@/lib/db")`. No test needs PostgreSQL or Redis.
- _Alternative_: `bun test`. Rejected — Vite+ already ships Vitest and `vp test` is the template's single test command.

### Lint enforcement of conventions

Add to `vite.config.ts` lint overrides:

- `src/**/*.ts`: `no-restricted-imports` with pattern `../*` → "use the @/ alias".
- `src/controllers/**`: `no-restricted-imports` for `express` → "controllers must not depend on HTTP".
  If Oxlint's `no-restricted-imports` does not support `patterns`, keep the controller rule (path-based) and document the alias rule in AGENTS.md instead; the task verifies this.

### Tooling and docs

- `tsconfig.json`: `module: "ESNext"`, `moduleResolution: "bundler"`, `noEmit: true`, `paths: { "@/*": ["./src/*"] }`, include `src`, `tests`, `vite.config.ts`; drop `outDir`, `rootDir`, `declaration*`, `sourceMap`.
- `package.json` scripts: `dev`, `build`, `start` unchanged; `check: "vp check"`, `test: "vp test"`, `db:generate`, `db:migrate`, `auth:generate`; remove `lint`, `lint:fix`, `format` (duplicates of `vp lint`/`vp fmt`).
- `.gitattributes`: `* text=auto eol=lf`.
- `AGENTS.md`: add a "Project structure" section (folder table, naming rule, decision flow, agent pattern) outside the `VITE PLUS` markers so `vp` updates do not overwrite it. `CLAUDE.md` contains `@AGENTS.md`.
- `.agents/skills/`: keep `better-auth-best-practices`, `better-auth-security-best-practices`, `email-and-password-best-practices`, `prisma-cli`, `prisma-client-api`, `prisma-database-setup`, `typescript-best-practices`, `zod`, `tdd`; remove `create-auth-skill`, `organization-best-practices`, `two-factor-authentication-best-practices`, `prisma-postgres`, `prisma-postgres-setup`, `prisma-upgrade-v7`, `redis-development`, `improve-codebase-architecture`, `zoom-out`, and their `skills-lock.json` entries.

## Risks / Trade-offs

- [Express 5 path syntax breaks wildcard routes] → Only the Better Auth catch-all uses one; changed to `*splat` and covered by an auth route smoke check.
- [Better Auth CLI needs to load `lib/auth.ts`, which imports `env.ts` and exits on missing env] → Run it with a populated `.env`; pass `--config src/lib/auth.ts` explicitly.
- [Regenerated schema drops `User.password`] → Template has no production data; README tells cloned projects to run a fresh migration.
- [Response envelope removal is breaking for any client built on the old shape] → Template-only; recorded as BREAKING in the proposal.
- [Vitest (Node) and server (Bun) could diverge] → No `Bun.*` APIs in `src/`; `vp run build` remains part of validation.
- [Oxlint `no-restricted-imports` option coverage] → Verified during implementation with a documented fallback (see Lint enforcement).
- [Pruning `.agents/` removes skills the user may want] → Exact list recorded here for review before apply; removal is reversible from Git.
- [`no-magic-numbers` warnings on HTTP status codes] → Warnings do not fail `vp check`; left as-is.

## Migration Plan

1. Implement on a branch in the order given by `tasks.md`; run `vp check` after each group and `vp test` once tests exist.
2. Final validation: `vp install`, `vp check`, `vp test`, `vp run build`, and a manual smoke run (`vp run dev`, sign up, `GET /api/v1/users/me`) against a local PostgreSQL.
3. Rollback: revert the branch; nothing is deployed from the template itself.
4. Projects already cloned from the old template are unaffected; they can copy individual pieces (error handler, Express 5 upgrade, auth schema) as needed.
