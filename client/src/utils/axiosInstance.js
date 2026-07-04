import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const url = error.config?.url || '';
    // Only force-logout on 401 for protected routes, not for auth endpoints themselves
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot') || url.includes('/auth/reset');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.response?.status >= 500) {
      console.error('Server error, try again later');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
