import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { getForMember, withDetails } from "./conversation.service.js";

export const MAX_GROUP_MEMBERS = 50;

// --- helpers -----------------------------------------------------------------

//! Loads a conversation the user belongs to AND makes sure it is a group
const getGroupForMember = async (groupId, userId) => {
  const conversation = await getForMember(groupId, userId);
  if (conversation.type !== "group") throw ApiError.notFound("Group not found");
  return conversation;
};

const assertAdmin = (group, userId) => {
  if (!group.admins.some((id) => id.equals(userId))) {
    throw ApiError.forbidden("Only group admins can do this");
  }
};

const loadWithDetails = (groupId) => withDetails(Conversation.findById(groupId));

// --- used by this service AND by user.service (account deletion) ---------------

// Removes one person from a group and keeps the group healthy:
//  - nobody left            -> the group and its messages are deleted
//  - last admin leaves      -> the next member becomes admin
export const removeMemberFromGroup = async (group, userId) => {
  const members = group.members.filter((id) => !id.equals(userId));

  if (members.length === 0) {
    await Message.deleteMany({ conversation: group._id });
    await group.deleteOne();
    return { deleted: true };
  }

  const admins = group.admins.filter((id) => !id.equals(userId));
  group.members = members;
  group.admins = admins.length > 0 ? admins : [members[0]];
  await group.save();

  return { deleted: false };
};

// --- group operations -----------------------------------------------------------

export const createGroup = async (creatorId, { name, description, memberIds }) => {
  // de-duplicate, and never list the creator twice
  const otherIds = [...new Set(memberIds)].filter((id) => id !== String(creatorId));

  if (otherIds.length === 0) throw ApiError.badRequest("Add at least one other member");
  if (otherIds.length + 1 > MAX_GROUP_MEMBERS) {
    throw ApiError.badRequest(`A group can have at most ${MAX_GROUP_MEMBERS} members`);
  }

  const found = await User.countDocuments({ _id: { $in: otherIds } });
  if (found !== otherIds.length) throw ApiError.notFound("One or more users were not found");

  const group = await Conversation.create({
    type: "group",
    name,
    description,
    members: [creatorId, ...otherIds],
    admins: [creatorId],
    createdBy: creatorId,
  });

  return loadWithDetails(group._id);
};

export const listGroups = (userId) =>
  withDetails(
    Conversation.find({ type: "group", members: userId }).sort({ updatedAt: -1 }).limit(100)
  );

export const getGroup = async (groupId, userId) => {
  await getGroupForMember(groupId, userId);
  return loadWithDetails(groupId);
};

export const addMember = async (groupId, actorId, userId) => {
  const group = await getGroupForMember(groupId, actorId);
  assertAdmin(group, actorId);

  if (group.members.some((id) => id.equals(userId))) {
    throw ApiError.conflict("User is already a member of this group");
  }
  if (group.members.length >= MAX_GROUP_MEMBERS) {
    throw ApiError.badRequest(`A group can have at most ${MAX_GROUP_MEMBERS} members`);
  }
  if (!(await User.exists({ _id: userId }))) throw ApiError.notFound("User not found");

  group.members.push(userId);
  await group.save();

  return loadWithDetails(groupId);
};

// Admin removes someone, or a member removes THEMSELVES (= leave the group)
export const removeMember = async (groupId, actorId, targetUserId) => {
  const group = await getGroupForMember(groupId, actorId);

  const isSelf = String(actorId) === String(targetUserId);
  if (!isSelf) assertAdmin(group, actorId);

  if (!group.members.some((id) => id.equals(targetUserId))) {
    throw ApiError.notFound("User is not a member of this group");
  }

  return removeMemberFromGroup(group, targetUserId);
};