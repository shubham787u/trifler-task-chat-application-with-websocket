import api, { isBackendEnabled } from "./api";

// Group endpoints are placeholders until matching backend routes are implemented.
export async function getGroups() {
  if (!isBackendEnabled) return null;

  const response = await api.get("/groups");
  return response.data;
}

export async function createGroup(group) {
  if (!isBackendEnabled) {
    console.info("[Trifler groups] Local group (not sent to a server)", group);
    return group;
  }

  const response = await api.post("/groups", { name: group.name });
  return response.data;
}

export async function addGroupMember(groupId, member) {
  if (!isBackendEnabled) {
    console.info("[Trifler groups] Local member addition (not sent to a server)", {
      groupId,
      member,
    });
    return { groupId, member };
  }

  const response = await api.post(
    `/groups/${encodeURIComponent(groupId)}/members`,
    { member },
  );
  return response.data;
}