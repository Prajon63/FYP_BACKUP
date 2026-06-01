import axios, { AxiosInstance, AxiosError, AxiosHeaders } from 'axios';
import { resolveApiBaseUrl } from '../config/apiConfig';
import { authService } from './authService';

const SESSION_INVALID_MESSAGES = [
  'user not found',
  'not authorized',
  'token expired',
  'invalid token',
  'no token provided',
];

function isSessionInvalid(status: number | undefined, message: string): boolean {
  if (status !== 401) return false;
  return SESSION_INVALID_MESSAGES.some((m) => message.toLowerCase().includes(m));
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
      const message = (error.response.data as any)?.error || 'An error occurred';
      if (isSessionInvalid(error.response.status, message)) {
        authService.clearAuthSession();
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.replace('/');
        }
      }
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



