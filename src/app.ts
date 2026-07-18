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
app.use(helmet());

const allowedOrigins = [
  env.CLIENT_URL,
  "https://nobroker-frontend.vercel.app",
  "http://localhost:3000",
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
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

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.enable("trust proxy");
app.use(morgan(isProd ? "combined" : "dev"));
app.use("/api", generalLimiter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Routes -----------------------------------------------------------------
app.use("/api", apiRoutes);

// --- 404 + global error handler (must be registered last) -------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
