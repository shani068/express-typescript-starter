// Values that satisfy src/env.ts validation, so importing the app never exits the process.
// dotenv does not override variables that are already set, so these win over a local .env.
// No test connects to PostgreSQL or Redis: `@/lib/db` and `@/lib/auth` are mocked where used.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
