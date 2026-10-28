import dotenv from "dotenv";

// Load variables from .env into process.env
dotenv.config();

// Fail fast: stop the app at startup if something important is missing
const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  console.error("Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  PORT: Number(process.env.PORT) || 8080,

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Vite's default dev port is 5173
  CLIENT_URLS: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim()),
};

export default env;
