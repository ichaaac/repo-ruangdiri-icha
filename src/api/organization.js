import apiClient from "./auth";

// Organization API functions
export const organizationAPI = {
  /**
   * Get organization profile
   * @returns {Promise} API response with organization profile data
   */
  getProfile: async () => {
    try {
      const response = await apiClient.get("/organizations/profile");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update organization profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} API response
   */
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.patch("/organizations/profile", profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update organization profile picture
   * @param {File} file - Profile picture file
   * @returns {Promise} API response
   */
  updateProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await apiClient.put("/organizations/profile-picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // School-specific endpoints
  school: {
    /**
     * Get school student list
     * @param {Object} params - Query parameters (pagination, filters, etc.)
     * @returns {Promise} API response with students data
     */
    getStudents: async (params = {}) => {
      try {
        const response = await apiClient.get("/organizations/school/students", { params });
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },

  // Company-specific endpoints
  company: {
    /**
     * Get company employee list
     * @param {Object} params - Query parameters (pagination, filters, etc.) 
     * @returns {Promise} API response with employees data
     */
    getEmployees: async (params = {}) => {
      try {
        const response = await apiClient.get("/organizations/company/employees", { params });
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },
};

export default organizationAPI;