import axios from "axios";

const DEPLOYED_API_URL = "https://campuscartapi.onrender.com/api";

// The deployed Render API is the safe default. Vite mode files can override it,
// for example `npm run dev:local` loads `.env.local-api`.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || DEPLOYED_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("campuscart_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
