import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  // Log connection events so problems after startup are visible too
  mongoose.connection.on("disconnected", () =>
    logger.warn("MongoDB disconnected"),
  );
  mongoose.connection.on("reconnected", () =>
    logger.info("MongoDB reconnected"),
  );
  mongoose.connection.on("error", (err) =>
    logger.error("MongoDB connection error:", err.message),
  );

  try {
    await mongoose.connect(env.MONGO_URI, {
      // Give up after 5s instead of hanging for 30s if MongoDB is unreachable
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(
      `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
    );
  } catch (err) {
    logger.error("MongoDB initial connection failed:", err.message);
    // Re-throw so server.js catches it and exits - the app is useless without a DB
    throw err;
  }
};

export default connectDB;
