import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import env from "./config/env.js";
import routes from "./routes/index.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

//! Behind a proxy (Render, Railway, etc.) so rate limiting sees the real client IP
if (env.isProd) app.set("trust proxy", 1);

// --- Security & parsing ---
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      //! Allow tools with no Origin header (Postman, curl) and listed frontends
      if (!origin || env.CLIENT_URLS.includes(origin)) {
        return callback(null, true);
      }
      callback(null, false); // browser will block it
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// --- Logging ---
app.use(morgan(env.isProd ? "combined" : "dev"));

//! --- Health check (before the limiter so uptime monitors never get blocked) ---
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// --- API routes ---
app.use("/api", apiLimiter, routes);

//! --- 404 + error handling (always last, in this order) ---
app.use(notFound);
app.use(errorHandler);

export default app;
