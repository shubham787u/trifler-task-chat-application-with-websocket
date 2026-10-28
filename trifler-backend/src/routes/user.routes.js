import { Router } from "express";
import {
  getMe,
  updateMe,
  deleteMe,
  searchUsers,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  updateMeSchema,
  searchUsersSchema,
} from "../validators/user.schema.js";

const router = Router();

// Every user route needs a logged-in user
router.use(protect);

router.get("/me", getMe);
router.patch("/me", validate(updateMeSchema), updateMe);
router.delete("/me", deleteMe);

router.get("/", validate(searchUsersSchema, "query"), searchUsers);

export default router;
