import { apiReference } from "@scalar/express-api-reference";
import { Router } from "express";
import helmet from "helmet";
import swaggerJsdoc from "swagger-jsdoc";

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "My API", version: "1.0.0" },
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "better-auth.session_token" },
      },
    },
  },
  apis: ["./src/routes/*.routes.ts"],
});

// Hashes reported by the browser for Scalar's bootstrapping inline scripts.
// These are deterministic for a given Scalar version — update when upgrading.
// CSP hashes are public, not secrets.
/* oxlint-disable no-secrets/no-secrets */
const SCALAR_SCRIPT_HASHES = [
  "'sha256-ieoeWczDHkReVBsRBqaal5AFMlBtNjMzgwKvLqi/tSU='",
  "'sha256-wymiosKG2k+87jnwoXk0Hbgi4oH+QmIIUkSfzBhi5Zs='",
];
/* oxlint-enable no-secrets/no-secrets */

const docsHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", ...SCALAR_SCRIPT_HASHES],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      workerSrc: ["'self'", "blob:"],
    },
  },
});

const router = Router();

router.get("/openapi.json", (_req, res) => {
  res.json(spec);
});

router.use(
  "/docs",
  docsHelmet,
  apiReference({
    url: "/openapi.json",
    theme: "purple",
  })
);

export default router;
