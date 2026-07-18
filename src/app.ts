import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env, isProd } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { generalLimiter } from "./middlewares/rateLimiters";

const app = express();

// --- Security headers -------------------------------------------------
// Sets X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security,
// a conservative Content-Security-Policy, and more, in one call.
app.use(helmet());

// --- CORS ---------------------------------------------------------------
// `credentials: true` is required because the refresh token travels as an
// httpOnly cookie — the frontend origin must be explicitly whitelisted
// (wildcard "*" is rejected by browsers whenever credentials are involved).

const allowedOrigins = [
  env.CLIENT_URL,
  "https://nobroker-frontend.vercel.app",
  "http://localhost:3000",
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (Postman, curl, server-to-server requests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// --- Body parsing & compression -----------------------------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// --- Logging --------------------------------------------------------------
app.use(morgan(isProd ? "combined" : "dev"));

// --- Rate limiting (general backstop; stricter limiters on specific routes) -
app.use("/api", generalLimiter);

// --- API docs -------------------------------------------------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Health check (for load balancers / uptime monitors / Docker healthcheck)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Routes -----------------------------------------------------------------
app.use("/api", apiRoutes);

// --- 404 + global error handler (must be registered last) -------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
