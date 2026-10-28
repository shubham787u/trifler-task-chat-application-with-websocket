import env from "../config/env.js";

// Tiny logger - no extra package needed.
// Usage: logger.info("message"), logger.error("message", errorObject)
const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[${timestamp()}] INFO `, ...args),
  warn: (...args) => console.warn(`[${timestamp()}] WARN `, ...args),
  error: (...args) => console.error(`[${timestamp()}] ERROR`, ...args),

  // Only prints in development, silent in production
  debug: (...args) => {
    if (!env.isProd) console.log(`[${timestamp()}] DEBUG`, ...args);
  },
};

export default logger;
