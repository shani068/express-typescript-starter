import rateLimit from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

// 100 requests per IP per 15 minutes, with standard RateLimit-* headers.
export const apiRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: { message: "Too many requests, please try again later." },
    });
  },
});
