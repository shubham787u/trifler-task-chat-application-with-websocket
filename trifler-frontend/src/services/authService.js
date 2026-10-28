import api from "./api";

// Credentials are sent to the backend over the configured API connection.
export async function registerUser(userData) {
  const { name, email, password } = userData;
  const response = await api.post("/auth/register", { name, email, password });
  return response.data;
}

export async function loginUser(loginData) {
  const { email, password } = loginData;
  const response = await api.post("/auth/login", { email, password });
  return response.data;
}
