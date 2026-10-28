import api from "./api";

export async function updateUserProfile(profile) {
  const response = await api.patch("/users/me", profile);
  return response.data.user;
}

export async function getCurrentUser() {
  const response = await api.get("/users/me");
  return response.data.user;
}

export async function searchUsers(search) {
  const response = await api.get("/users", {
    params: { search, limit: 10 },
  });
  return response.data.users;
}

export async function deleteCurrentUser() {
  const response = await api.delete("/users/me");
  return response.data;
}