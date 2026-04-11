import apiClient from './apiClient';

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post(`/api/v1/login`, { email, password });
      if (response.data.data.accessToken) {
        const { accessToken, refreshToken, user } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: any) {
      console.error('[AUTH_API_ERROR]', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Server error'
      };
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
  },

  getToken: () => localStorage.getItem('accessToken'),

  isAuthenticated: () => !!localStorage.getItem('accessToken'),
};
