import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { auth } from "@/lib/auth";
import { errorHandler } from "@/middleware/error-handler";
import { notFound } from "@/middleware/not-found";
import { apiRateLimit } from "@/middleware/rate-limit";
import { requestLogger } from "@/middleware/request-logger";
import routes from "@/routes";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(requestLogger);

// Before Better Auth so sign-in attempts are limited too. /health and /docs are outside /api.
app.use("/api", apiRateLimit);

// Better Auth reads the raw request body, so it must come before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

// Must be last: unmatched routes, then every error.
app.use(notFound);
app.use(errorHandler);

export default app;
