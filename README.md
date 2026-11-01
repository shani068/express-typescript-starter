# My Backend Template

Express 5 + TypeScript starter for backend and agentic-AI projects: email-and-password auth, validated input, a uniform JSON error format, API docs, and a test suite that runs without a database.

## Stack

| Technology                | Version | Purpose                                        |
| ------------------------- | ------- | ---------------------------------------------- |
| Bun                       | 1.x     | Runtime, package manager, production build     |
| Vite+ (`vp`)              | 1.4     | Format, lint, type-check, and test (Vitest)    |
| Express                   | 5       | HTTP framework (async errors handled natively) |
| TypeScript                | 5       | Type safety                                    |
| Prisma + PostgreSQL       | 5       | ORM and migrations                             |
| Better Auth               | 1.6     | Email-and-password sign-up/sign-in, sessions   |
| Zod                       | 3       | Input validation                               |
| Winston                   | 3       | Logging (pretty in development, JSON in prod)  |
| ioredis                   | 5       | Optional cache — connects only when first used |
| Scalar + swagger-jsdoc    | —       | API docs at `/docs`                            |
| Helmet, CORS, rate limits | —       | HTTP hardening                                 |

## Getting Started

Prerequisites: [Bun](https://bun.sh), the [Vite+ CLI](https://viteplus.dev/guide/) (`vp`), Node.js 22.18+ (used by `vp test`), and a PostgreSQL database.

```bash
git clone https://github.com/shani068/my-backend
cd my-backend
vp install
cp .env.example .env
# edit .env: set DATABASE_URL, and BETTER_AUTH_SECRET (openssl rand -base64 32)
vp run db:migrate   # creates the tables and generates the Prisma client
vp run dev
```

The server starts on `http://localhost:3000`. Open `/docs` for the API reference.

Before committing, run:

```bash
vp check   # format, lint, type-check
vp test    # tests — no database or Redis needed
```

### Database and auth schema

The Prisma schema in `prisma/schema.prisma` holds the Better Auth models (`User`, `Session`, `Account`, `Verification`). Passwords are stored as hashes in `Account`, never on `User`.

- Change your own models → edit `prisma/schema.prisma`, then `vp run db:migrate`.
- Change Better Auth's config or add a plugin in `src/lib/auth.ts` → `vp run auth:generate` to update the schema, then `vp run db:migrate`.

> Upgrading a project created from an earlier version of this template? The schema changed (`User.password` was removed), so create a fresh migration.

## Environment Variables

| Variable             | Required | Description                                             |
| -------------------- | -------- | ------------------------------------------------------- |
| `NODE_ENV`           | No       | `development` (default), `production`, or `test`        |
| `PORT`               | No       | HTTP port, default `3000`                               |
| `DATABASE_URL`       | Yes      | PostgreSQL connection URL                               |
| `BETTER_AUTH_SECRET` | Yes      | At least 32 characters (`openssl rand -base64 32`)      |
| `BETTER_AUTH_URL`    | Yes      | Public base URL of this server                          |
| `REDIS_URL`          | No       | Needed only if you use the cache helpers in `lib/redis` |

## Scripts

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `vp run dev`           | Start with hot reload (`bun --watch`)               |
| `vp run build`         | Bundle to `dist/` with `bun build`                  |
| `vp run start`         | Run the production bundle                           |
| `vp check`             | Format, lint, and type-check                        |
| `vp check --fix`       | Same, applying fixes                                |
| `vp test`              | Run the test suite (`tests/**/*.test.ts`)           |
| `vp run db:generate`   | Generate the Prisma client                          |
| `vp run db:migrate`    | Create and apply a migration (`prisma migrate dev`) |
| `vp run auth:generate` | Regenerate the Better Auth models in the schema     |

## API Endpoints

| Method | Route                     | Auth | Description           |
| ------ | ------------------------- | ---- | --------------------- |
| GET    | `/health`                 | No   | Health check          |
| GET    | `/docs`                   | No   | Scalar API reference  |
| GET    | `/openapi.json`           | No   | OpenAPI spec          |
| POST   | `/api/auth/sign-up/email` | No   | Register              |
| POST   | `/api/auth/sign-in/email` | No   | Sign in (sets cookie) |
| GET    | `/api/v1/users/me`        | Yes  | Get own profile       |
| PUT    | `/api/v1/users/me`        | Yes  | Update own name       |

`/api/auth/*` is handled by Better Auth. Protected routes use the session cookie it sets. Everything under `/api` is limited to 100 requests per IP per 15 minutes; `/health` and `/docs` are not limited.

### Responses

Success responses return the resource itself:

```json
{
  "id": "…",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

Every error uses one shape; `details` appears on validation errors:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [{ "path": "name", "message": "Name must be at least 2 characters" }]
  }
}
```

| Status | When                                                        |
| ------ | ----------------------------------------------------------- |
| 400    | Invalid input, including unknown fields and malformed JSON  |
| 401    | Missing or invalid session                                  |
| 404    | Unknown route, or record not found                          |
| 409    | Unique constraint violated (e.g. duplicate value)           |
| 413    | Request body too large                                      |
| 429    | Rate limit exceeded                                         |
| 500    | Unexpected error (stack trace included only in development) |

## Project Structure

```
src/
├── server.ts      listen + graceful shutdown
├── app.ts         middleware order, routers, error handling
├── env.ts         validated environment variables
├── routes/        HTTP paths → validation → controller → response
├── controllers/   business logic as plain functions (no req/res)
├── schemas/       Zod schemas and inferred types
├── lib/           db, auth, logger, redis clients
├── middleware/    require-auth, rate-limit, request-logger, not-found, error-handler
├── utils/         http-error
└── types/         express.d.ts
tests/             Vitest suite and helpers
```

Where each kind of file goes, naming rules, and the pattern for adding agents are in [AGENTS.md → Project structure](./AGENTS.md#project-structure).

## License

MIT
