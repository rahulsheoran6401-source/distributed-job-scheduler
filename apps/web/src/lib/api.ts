import axios from 'axios';
import { toast } from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Ignore 401 on /me or /login to prevent spamming toasts
    const isAuthEndpoint = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/auth/login');
    if (!isAuthEndpoint && error.response?.status !== 401) {
      toast.error(message);
    }
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
