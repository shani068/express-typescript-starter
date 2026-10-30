# Proposal

## Why

This repository is cloned as the starting point for every new backend and agentic-AI project, but its layout gives no clear answer to "where does this file go?": `config/` mixes real configuration with service clients, feature modules sit beside layer folders, there is no home for agent code, and several parts are broken or dead (an auth schema Better Auth cannot use, an unvalidated profile update, unmounted rate limiting, commented-out JWT code). The Vite+ migration just landed and made lint and type-checking work again, so now is the moment to lock in a simple, enforceable structure before more projects are cloned from it.

## What Changes

- **Layer-based layout with one rule per folder**: `routes/` (HTTP), `controllers/` (business logic as plain functions — no `req`/`res`), `schemas/` (zod), `agents/` (created on demand), `lib/` (one client per external system), `middleware/`, `utils/`, `types/`, plus a top-level `tests/`. Each feature uses the same name in every folder (`users.routes.ts`, `users.controller.ts`, `users.schema.ts`, `tests/users.test.ts`).
- **Replace `config/`**: environment parsing moves to `src/env.ts`; Prisma, Better Auth, Winston and Redis clients move to `src/lib/`; API docs become `routes/docs.routes.ts`.
- **Upgrade Express 4 → 5** so async errors reach the error handler natively; remove `asyncHandler`, `ApiResponse`, and handler `try/catch` boilerplate.
- **Fix authentication**: regenerate the Prisma schema for Better Auth (User/Session/Account/Verification) and enable email-and-password sign-in.
- **Fix profile update**: `PUT /api/v1/users/me` accepts only validated fields; unknown fields are rejected.
- **BREAKING (template API shape)**: success responses return the resource JSON directly instead of the `{ statusCode, data, message, success }` envelope; errors use `{ "error": { "message", "details"? } }`. Unknown routes return a JSON 404.
- **Mount rate limiting** on `/api` (it is currently defined but unused).
- **Make Redis optional**: connect on first use; `REDIS_URL` no longer required to boot.
- **Remove dead code and empty folders**: commented-out `modules/auth/*`, JWT types, `utils/index.ts`/`types/index.ts` barrels, unused `app.config.ts`, empty `jobs/`, `models/`, `tests/unit`, `tests/integration`.
- **Add a test suite** on Vitest via `vp test` (`tests/**/*.test.ts`) covering health, errors, auth protection, and user profile.
- **Graceful shutdown** in `server.ts` (close HTTP server, disconnect Prisma and Redis).
- **Enforce conventions with lint**: `@/` imports instead of `../`, and controllers may not import `express`.
- **Docs**: rewrite `README.md`; add structure rules to `AGENTS.md` (alongside the Vite+ block) and a `CLAUDE.md` that points to it; add `.gitattributes` to keep LF line endings on Windows.
- **Trim vendored agent skills** in `.agents/` to those matching this stack, and update `skills-lock.json` accordingly.

## Capabilities

### New Capabilities

- `project-layout`: Where each kind of code lives, file naming, import style, and the setup/validation commands a freshly cloned template must pass.
- `authentication`: Better Auth email-and-password sign-up/sign-in and session-based protection of API routes.
- `user-profile`: Reading and updating the signed-in user's own profile.
- `api-errors`: The JSON error format, validation errors, not-found handling, and database error mapping.
- `service-health`: The unauthenticated health-check endpoint.
- `rate-limiting`: Request limits on the `/api` surface.

### Modified Capabilities

<!-- None: the project has no existing specs. -->

## Impact

- **Code**: every file under `src/` moves, is rewritten, or is deleted; new `tests/` suite; `vite.config.ts` gains `test`, `resolve.alias`, and import-restriction rules.
- **Dependencies**: `express` ^5 and `@types/express` ^5; remove `@types/winston` (winston ships its own types). Zod stays on v3 and Prisma on v5 (upgrades are out of scope).
- **Database**: `prisma/schema.prisma` is regenerated; projects need a fresh migration (`User.password` is dropped; credentials live in `Account`).
- **API**: response envelope and error body change (see BREAKING above); Better Auth routes stay at `/api/auth/*`; profile routes stay at `/api/v1/users/me`.
- **Tooling**: builds still use `bun build`; dev still uses `bun --watch` via `vp run dev`; validation is `vp check` + `vp test`.
- **Assumptions (defaults accepted during exploration)**: Redis kept but optional; Scalar API docs kept; no `lib/llm.ts` in the base template (SDK chosen per project); `agents/` documented but not pre-created.
- **Out of scope**: frontend apps (use framework scaffolders), Prisma 7 and Zod 4 upgrades, replacing the dropped `naming-convention` lint rule, `.cursor/`/`.claude/` tool folders.
