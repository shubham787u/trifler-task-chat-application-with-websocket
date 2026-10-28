import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";

const router = Router();

// Stricter rate limit -> then validate input -> then the controller
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);

export default router;
