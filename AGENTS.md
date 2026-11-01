<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Project structure

This repository is a starter template. Every file has one obvious home; keep it that way when adding code.

## Folders

| Folder             | What belongs here                                                                 | Example                                     |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------- |
| `src/routes/`      | HTTP only: paths, `schema.parse(req.body)`, calling a controller, `res.json(...)` | `users.routes.ts`                           |
| `src/controllers/` | Business logic as plain functions with typed arguments; return data or throw      | `users.controller.ts`                       |
| `src/schemas/`     | Zod schemas for input/output and the types inferred from them                     | `users.schema.ts`                           |
| `src/lib/`         | One client per external system (database, auth, logger, cache, LLM)               | `db.ts`, `auth.ts`, `logger.ts`, `redis.ts` |
| `src/middleware/`  | Request handling shared across routes                                             | `require-auth.ts`, `error-handler.ts`       |
| `src/utils/`       | Small pure helpers with no external dependencies                                  | `http-error.ts`                             |
| `src/types/`       | Global type augmentation only                                                     | `express.d.ts`                              |
| `src/agents/`      | Agent definitions and their tools — **create when needed**                        | `support.agent.ts`, `support.tools.ts`      |
| `tests/`           | All automated tests (`*.test.ts`), plus shared test helpers                       | `users.test.ts`, `users.controller.test.ts` |

Top-level files in `src/`: `server.ts` (listen + graceful shutdown), `app.ts` (middleware order, routers, error handling), and `env.ts` (Zod-validated environment — the only module that reads `process.env`). Routers are mounted in `src/routes/index.ts`.

Do not create empty placeholder folders; add a folder together with its first file.

## Naming

A feature uses the same kebab-case name in every folder, followed by its role: `users.routes.ts`, `users.controller.ts`, `users.schema.ts`, `tests/users.test.ts`. Searching for `users.` finds the whole feature. Other files use kebab-case (`require-auth.ts`, `http-error.ts`).

## Where does this file go?

1. Does it read `req`/`res` or define a URL path? → `routes/` (or `middleware/` if several routes share it).
2. Is it a rule about the domain — reading, writing, or deciding something? → `controllers/`.
3. Is it a Zod schema or a type derived from one? → `schemas/`.
4. Does it create or wrap a client for something outside this process (database, API, queue, model provider)? → `lib/`.
5. Is it an agent's prompt, model loop, or tools? → `agents/`.
6. Is it a pure helper used in several places? → `utils/`.
7. Does it augment a global or third-party type? → `types/`.
8. Is it a test? → `tests/`.

## Rules

- **Controllers never depend on HTTP.** They do not import `express` and never see `req`, `res`, or the session object; routes pass plain values such as `sessionUser(req).id`. Lint enforces the `express` ban in `src/controllers/**`. This keeps the same logic callable from routes, agent tools, jobs, and tests.
- **Imports use the `@/` alias** (`@/lib/db`), never `../`. Lint enforces this in `src/`.
- **Validate in the route** with `schema.parse(...)`; use `.strict()` when unknown fields must be rejected. A `ZodError` becomes a `400` automatically.
- **Errors**: throw `HttpError(status, message, details?)` from `@/utils/http-error`. The error handler returns `{ "error": { "message", "details"? } }` and maps Prisma `P2002` → 409 and `P2025` → 404. Do not catch errors in handlers just to forward them — Express 5 does that.
- **Success responses** send the resource directly: `res.json(user)`, no envelope.
- **Protected routes** add the `requireAuth` middleware and read the user with `sessionUser(req)`.
- **Tests** import from `vite-plus/test`, mock `@/lib/db` and `@/lib/auth` with `vi.mock`, and use `request()` from `tests/http.ts` for HTTP tests. No test may need a running PostgreSQL or Redis.

## Agents

When a project adds an agent, create:

- `src/agents/<name>.agent.ts` — the system prompt, model choice, and agent loop.
- `src/agents/<name>.tools.ts` — the tools the agent can call. Tools validate their input with a schema from `schemas/` and call controllers; they never call `db` directly or make HTTP requests to this API.
- `src/lib/llm.ts` — the model provider client (**create when needed**; the SDK is chosen per project).

Expose an agent over HTTP with a normal route file (for example `routes/support.routes.ts`) that calls the agent.
