# Tasks

## 1. Tooling foundation

- [ ] 1.1 Add `.gitattributes` with `* text=auto eol=lf` and run `git add --renormalize .`; verify `git ls-files --eol src` shows `i/lf` for every file
- [ ] 1.2 Update `tsconfig.json` per design (ESNext/bundler, `noEmit`, `@/*` paths, include `src`, `tests`, `vite.config.ts`; drop emit options); verify `vp check` passes
- [ ] 1.3 Add `resolve.alias` (`@` → `src`) and `test: { include: ["tests/**/*.test.ts"], setupFiles: ["tests/setup.ts"] }` to `vite.config.ts`, and create `tests/setup.ts` setting the env vars `env` validation requires; verify `vp check` passes
- [ ] 1.4 Update `package.json` scripts (`check`, `test`, `db:generate`, `db:migrate`, `auth:generate`; remove `lint`, `lint:fix`, `format`) and remove `@types/winston`; verify `vp install` and `vp run build` succeed

## 2. Environment and service clients

- [ ] 2.1 Move `src/config/env.config.ts` to `src/env.ts` and make `REDIS_URL` optional; update `.env.example` to mark it optional; verify `vp check` passes
- [ ] 2.2 Create `src/lib/db.ts` and `src/lib/logger.ts` from the old config files (drop `morganStream`) and update all importers; verify `vp check` passes
- [ ] 2.3 Create `src/lib/redis.ts` with lazy `getRedis()`, `closeRedis()`, logger-based connection events, the cache helpers from `utils/cache.ts`, and `SCAN`-based pattern delete; remove the side-effect Redis import from `app.ts`; delete `src/utils/cache.ts`
- [ ] 2.4 Add `tests/redis.test.ts` covering: importing the module does not connect, and `getRedis()` throws a clear error when `REDIS_URL` is unset; verify `vp test` passes
- [ ] 2.5 Delete `src/config/app.config.ts` and the now-empty `src/config/` folder; verify `vp check` and `vp run build` pass

## 3. HTTP foundation (Express 5, errors, health, rate limit, docs)

- [ ] 3.1 Upgrade `express` to ^5 and `@types/express` to ^5; verify `vp install` succeeds and `vp check` reports only errors caused by Express 5 type changes, which 3.2–3.7 resolve
- [ ] 3.2 Create `src/utils/http-error.ts` (`HttpError(status, message, details?)`) and `src/middleware/error-handler.ts` mapping HttpError, ZodError (400 + details), Prisma P2002 (409) / P2025 (404), and other errors (500, stack only in development); delete `utils/ApiError.ts`, `utils/ApiResponse.ts`, `utils/asyncHandler.ts`, `utils/index.ts`, and the old `error.middleware.ts`
- [ ] 3.3 Create `src/middleware/not-found.ts`, `src/middleware/request-logger.ts` (moved from inline code in `app.ts`), and `src/middleware/rate-limit.ts` (100 / 15 min / IP, standard headers, 429 with standard error body); delete `rateLimiter.middleware.ts`
- [ ] 3.4 Create `src/routes/health.routes.ts`, `src/routes/docs.routes.ts` (scan `./src/routes/*.routes.ts`, keep Scalar CSP and the no-secrets suppression, replace JWT scheme with `cookieAuth`), and rewrite `src/routes/index.ts` to mount them; delete `src/config/swagger.config.ts`
- [ ] 3.5 Rewrite `src/app.ts` with the design's middleware order (rate limit on `/api` before Better Auth at `/api/auth/*splat`, before `express.json`), and `src/server.ts` with graceful shutdown on SIGINT/SIGTERM (close server, `db.$disconnect()`, `closeRedis()`); verify `vp check` passes
- [ ] 3.6 Create `tests/http.ts` (start `app.listen(0)`, `fetch`-based request helper) and `tests/health.test.ts`; verify `vp test` shows `GET /health` returns 200 `{ status: "ok" }`
- [ ] 3.7 Add `tests/errors.test.ts` covering unknown route → JSON 404, HttpError status, ZodError → 400 with `details[].path`, P2002 → 409, P2025 → 404, and 500 without stack in production / with stack in development; verify `vp test` passes
- [ ] 3.8 Add `tests/rate-limit.test.ts`: 101st `/api` request returns 429 with standard error body and rate-limit headers, while `/health` still returns 200; verify `vp test` passes
- [ ] 3.9 Verify graceful shutdown manually: start with `vp run dev`, press Ctrl+C, confirm the shutdown log line appears and the process exits with code 0

## 4. Authentication

- [ ] 4.1 Create `src/lib/auth.ts` (Prisma adapter, `emailAndPassword: { enabled: true }`, exported `Session`/`User` types) and delete `src/config/auth.config.ts` and `src/config/database.config.ts` remnants; verify `vp check` passes
- [ ] 4.2 Regenerate `prisma/schema.prisma` with `bunx @better-auth/cli generate --config src/lib/auth.ts` (User/Session/Account/Verification, no `User.password`); verify `bunx prisma validate` and `bunx prisma generate` succeed
- [ ] 4.3 Create `src/middleware/require-auth.ts` (throws `HttpError(401)` without session, sets `req.user`) and update `src/types/express.d.ts` to import `User` from `@/lib/auth`; delete `src/middleware/auth.middleware.ts`, `src/types/jwt.types.ts`, `src/types/index.ts`, and `src/modules/auth/`
- [ ] 4.4 Add `tests/auth.test.ts` with `@/lib/auth` mocked: a protected route returns 401 with the standard error body when no session, and exposes the session user when present; verify `vp test` passes

## 5. Users feature

- [ ] 5.1 Create `src/schemas/users.schema.ts` with a `.strict()` update schema (`name` 2–100 chars) and inferred `UpdateUserInput` type
- [ ] 5.2 Create `src/controllers/users.controller.ts` with plain functions `getUser(userId)` (selects `id`, `name`, `email`, `createdAt`; `HttpError(404)` if missing) and `updateUser(userId, input)`; no `express` import
- [ ] 5.3 Create `src/routes/users.routes.ts` (`GET`/`PUT /me` behind `requireAuth`, inline `schema.parse`, `res.json(result)`, `@openapi` JSDoc) mounted at `/api/v1/users`; delete `src/modules/` entirely; verify `vp check` passes
- [ ] 5.4 Add `tests/users.controller.test.ts` (mock `@/lib/db`; call controllers with plain arguments, including the not-found case); verify `vp test` passes
- [ ] 5.5 Add `tests/users.test.ts` (HTTP): GET 200 with only safe fields, GET 401 without session, PUT 200 with valid name, PUT 400 for `{ email }` with the db update never called, PUT 400 for a 1-char name naming `name`; verify `vp test` passes

## 6. Convention enforcement

- [ ] 6.1 Convert every remaining `../` import under `src/` to `@/`; verify `grep -rn "from \"\.\./" src` returns nothing
- [ ] 6.2 Add `no-restricted-imports` overrides to `vite.config.ts`: `../*` pattern for `src/**/*.ts`, and `express` for `src/controllers/**`; verify with throwaway files that each violation makes `vp lint` fail, then delete them (if Oxlint rejects `patterns`, keep the controller rule and record the fallback in AGENTS.md)
- [ ] 6.3 Confirm no empty folders remain under `src/` or `tests/` (`find src tests -type d -empty` returns nothing) and that `src/jobs`, `src/models`, `tests/unit`, `tests/integration` are gone

## 7. Developer and agent documentation

- [ ] 7.1 Add a "Project structure" section to `AGENTS.md` outside the `VITE PLUS` markers: folder table with examples, feature naming rule, "where does this file go" decision flow, controller rule, agent pattern (`agents/<name>.agent.ts`, `agents/<name>.tools.ts`, `lib/llm.ts`); verify every folder named exists in `src/` or is marked "create when needed"
- [ ] 7.2 Create `CLAUDE.md` containing `@AGENTS.md`; verify the file resolves to the AGENTS.md content in Claude Code
- [ ] 7.3 Rewrite `README.md`: stack (correct versions: Express 5, Zod 3), getting started with `vp` commands and Prisma/Better Auth migration steps, scripts table, endpoints table with new response/error shapes, and a link to the AGENTS.md structure section; verify each command in Getting Started runs as written
- [ ] 7.4 Remove the unused skills listed in design (`create-auth-skill`, `organization-best-practices`, `two-factor-authentication-best-practices`, `prisma-postgres`, `prisma-postgres-setup`, `prisma-upgrade-v7`, `redis-development`, `improve-codebase-architecture`, `zoom-out`) from `.agents/skills/` and `skills-lock.json`; verify `skills-lock.json` is valid JSON and lists only directories that exist

## 8. Integration verification

- [ ] 8.1 Fresh-clone check: clone the working branch into a temp directory, `vp install`, copy `.env.example` to `.env` with test values, then run `vp check`, `vp test`, and `vp run build`; verify all exit 0 and `vp check` reports no line-ending issues
- [ ] 8.2 End-to-end smoke against local PostgreSQL: `bunx prisma migrate dev`, `vp run dev`, then sign up, sign in, `GET /api/v1/users/me`, `PUT /api/v1/users/me` with a valid name and with `{ email }`; verify responses match the `authentication` and `user-profile` specs
- [ ] 8.3 Confirm the server boots and serves `/health` and `/docs` with `REDIS_URL` unset and no Redis running
