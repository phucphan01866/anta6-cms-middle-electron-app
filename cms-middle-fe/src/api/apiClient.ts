import axios from 'axios';

const getBeHost = () => localStorage.getItem('BE_HOST') || import.meta.env.VITE_BE_HOST || 'localhost';
const getBePort = () => localStorage.getItem('BE_PORT') || import.meta.env.VITE_BE_PORT || '5050';

export const getBeUrl = () => `http://${getBeHost()}:${getBePort()}`;

const apiClient = axios.create({
  baseURL: getBeUrl(),
});

export const updateApiClientBaseUrl = () => {
  apiClient.defaults.baseURL = getBeUrl();
};


// Interceptor to add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API_CLIENT] Unauthorized access, redirecting to login...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
