import axios from "axios";

export const isBackendEnabled = import.meta.env.VITE_ENABLE_BACKEND !== "false";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:9000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    //! Attach the locally stored access token only when a backend request is made.
    const token = localStorage.getItem("chatconnect_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

//! Keep backend failures explicit; service callers decide how to present them.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[Trifler API] Request failed", {
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  },
);

export default api;
