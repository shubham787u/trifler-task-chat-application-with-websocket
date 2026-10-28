import api from "./api";

export async function createGroup(group) {
  const response = await api.post("/groups", {
    name: group.name,
    description: group.description || "",
    memberIds: group.memberIds,
  });
  return response.data.group;
}

export async function addGroupMember(groupId, userId) {
  const response = await api.post(
    `/groups/${encodeURIComponent(groupId)}/members`,
    { userId },
  );
  return response.data.group;
}
