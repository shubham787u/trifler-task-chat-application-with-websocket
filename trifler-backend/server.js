import http from "http";
import mongoose from "mongoose";

import app from "./src/app.js";
import env from "./src/config/env.js";
import connectDB from "./src/config/db.js";
import { initWebSocket } from "./src/websocket/index.js";
import logger from "./src/utils/logger.js";

const startServer = async () => {
  // 1. Connect to MongoDB first - no point starting the server without a DB
  await connectDB();

  // 2. Create one HTTP server that Express AND WebSocket will share
  const server = http.createServer(app);

  // 3. Attach the WebSocket server (path: /ws) to the same HTTP server
  const wss = initWebSocket(server);

  // 4. Start listening
  server.listen(env.PORT, () => {
    logger.info(`REST API  -> http://localhost:${env.PORT}/api`);
    logger.info(`WebSocket -> ws://localhost:${env.PORT}/ws`);
  });

  // 5. Graceful shutdown (Ctrl+C or when a host like Render stops the app)
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down...`);

    // Close open WebSocket connections politely, then stop accepting new ones
    wss.clients.forEach((client) => client.close(1001, "Server shutting down"));
    wss.close();
    server.close(async () => {
      await mongoose.connection.close();
      logger.info("HTTP server and MongoDB connection closed.");
      process.exit(0);
    });

    // Force exit if something hangs for more than 10 seconds
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

// Crash loudly on errors nobody handled, instead of failing silently
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

startServer().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
