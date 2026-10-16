import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Uniform error shape for UI: e.userMessage
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const e = error;
    e.userMessage =
      error?.response?.data?.message ||
      (error?.code === "ERR_NETWORK" ? "Cannot reach server. Is the backend running?" : error.message) ||
      "Something went wrong";
    delete e.userMessage.stack;
    return Promise.reject(e);
  }
);

export const getError = (e) => e.userMessage || e.message || "Something went wrong";

export default api;
