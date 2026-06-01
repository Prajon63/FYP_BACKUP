import axios, { AxiosInstance, AxiosError, AxiosHeaders } from 'axios';

/** Dev: Vite proxy `/api` → localhost:5000. Prod: set VITE_API_URL to your backend origin. */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return '/api';
  const base = raw.replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

const api: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 60000,
});

// Request interceptor (add token, etc.)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Ensure headers is AxiosHeaders
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

        if (config.data instanceof FormData) {
      delete config.headers['Content-Type']; 
      // let browser set multipart/form-data + boundary
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle errors globally)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common errors here
    if (error.response) {
      // Server responded with error status
      const message = (error.response.data as any)?.error || 'An error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Something else happened
      return Promise.reject(new Error(error.message || 'An unexpected error occurred'));
    }
  }
);

export default api;



