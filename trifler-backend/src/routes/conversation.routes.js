import { Router } from "express";
import {
  listConversations,
  createDirect,
  getMessages,
} from "../controllers/conversation.controller.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.schema.js";
import {
  createDirectSchema,
  messagesQuerySchema,
} from "../validators/conversation.schema.js";

const router = Router();

router.use(protect);

router.get("/", listConversations);
router.post("/direct", validate(createDirectSchema), createDirect);
router.get(
  "/:id/messages",
  validate(idParamSchema, "params"),
  validate(messagesQuerySchema, "query"),
  getMessages,
);

export default router;
