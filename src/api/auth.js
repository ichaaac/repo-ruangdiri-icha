import axios from "axios";

// Base API URL from environment variable or default
const BASE_URL = import.meta.env.VITE_API_URL || "";

// Create axios instance with common configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API functions
export const authAPI = {
  /**
   * Login with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {boolean} credentials.rememberMe - Remember me flag
   * @returns {Promise} API response
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post("/auth/login", credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Send forgot password email
   * @param {string} email - User email
   * @returns {Promise} API response
   */
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset password token
   * @param {string} newPassword - New password
   * @returns {Promise} API response
   */
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Change password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} API response
   */
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiClient.patch("/auth/password", {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout user (clear token)
   * @returns {Promise} API response
   */
  logout: async () => {
    try {
      const response = await apiClient.post("/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return response.data;
    } catch (error) {
      // Still remove token on error
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw error;
    }
  },
};

export default apiClient;