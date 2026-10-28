import { Router } from "express";
import {
  listGroups,
  createGroup,
  getGroup,
  addMember,
  removeMember,
} from "../controllers/group.controller.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createGroupSchema,
  addMemberSchema,
  groupIdParamSchema,
  memberParamSchema,
} from "../validators/group.schema.js";

const router = Router();

router.use(protect);

router.get("/", listGroups);
router.post("/", validate(createGroupSchema), createGroup);
router.get("/:groupId", validate(groupIdParamSchema, "params"), getGroup);
router.post(
  "/:groupId/members",
  validate(groupIdParamSchema, "params"),
  validate(addMemberSchema),
  addMember,
);
router.delete(
  "/:groupId/members/:userId",
  validate(memberParamSchema, "params"),
  removeMember,
);

export default router;
