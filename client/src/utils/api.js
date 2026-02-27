import axios from 'axios';

// Create a pre-configured Axios instance.
// All API calls in the app import this instead of raw axios.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor — runs before EVERY request made with this instance.
// It reads the JWT from localStorage and attaches it as a Bearer token.
// This means protected routes automatically get the auth header without
// you having to think about it on each individual API call.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
