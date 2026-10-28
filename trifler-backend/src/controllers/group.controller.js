import asyncHandler from "../utils/asyncHandler.js";
import * as groupService from "../services/group.service.js";
import { sendToUsers } from "../websocket/connectionStore.js";

const notifyMembers = (group) => {
  sendToUsers(
    group.members.map((member) => member.id || member._id || member),
    { type: "conversation.created", conversationId: group.id },
  );
};

// GET /api/groups
export const listGroups = asyncHandler(async (req, res) => {
  const groups = await groupService.listGroups(req.user._id);
  res.json({ success: true, groups });
});

// POST /api/groups   body: { name, description?, memberIds: [...] }
export const createGroup = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup(req.user._id, req.body);
  notifyMembers(group);
  res.status(201).json({ success: true, group });
});

// GET /api/groups/:groupId
export const getGroup = asyncHandler(async (req, res) => {
  const group = await groupService.getGroup(
    req.validated.params.groupId,
    req.user._id,
  );
  res.json({ success: true, group });
});

// POST /api/groups/:groupId/members   body: { userId }
export const addMember = asyncHandler(async (req, res) => {
  const group = await groupService.addMember(
    req.validated.params.groupId,
    req.user._id,
    req.body.userId,
  );
  notifyMembers(group);
  res.status(201).json({ success: true, group });
});

// DELETE /api/groups/:groupId/members/:userId
export const removeMember = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.validated.params;
  const { deleted } = await groupService.removeMember(
    groupId,
    req.user._id,
    userId,
  );
  res.json({ success: true, groupDeleted: deleted });
});
