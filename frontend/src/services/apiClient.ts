import axios from 'axios';

// Create an Axios instance using the base URL from environment variables
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Request interceptor to attach the JWT token if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // authService saves JWT under 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for global error handling or token refreshing
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Implement token refresh logic here if needed handling 401s
    return Promise.reject(error);
  }
);
