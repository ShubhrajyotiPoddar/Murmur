import axios from 'axios';

/**
 * Central Axios instance.
 * Reads base URL from Vite env — falls back to localhost for local dev.
 * The request interceptor automatically attaches the JWT from localStorage
 * to every outgoing request's Authorization header.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
