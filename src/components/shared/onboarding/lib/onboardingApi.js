// src/components/shared/onboarding/lib/onboardingApi.js - UPDATED FOR NEW BACKEND (SINGLE ENDPOINT)
import { apiClient } from '../../../../lib/api'; // Mengimpor apiClient dari api.js

const onboardingApi = {
  /**
   * Complete onboarding for any user type (student, employee, psychologist, organization)
   * All profile updates go to /users/profile
   */
  completeProfileOnboarding: async (onboardingData) => { // ✅ FIXED: Unified function name
    try {
      const response = await apiClient.patch('/users/profile', { // ✅ FIXED: Unified endpoint
        isOnboarded: "1",
        ...onboardingData
      });
      return response.data;
    } catch (error) {
      console.error('Profile onboarding error:', error);
      throw error;
    }
  },

  /**
   * Skip onboarding for any user type
   * All skip requests go to /users/profile
   */
  skipOnboarding: async () => { // ✅ FIXED: Unified function name
    try {
      const response = await apiClient.patch('/users/profile', { // ✅ FIXED: Unified endpoint
        isOnboarded: "1"
      });
      return response.data;
    } catch (error) {
      console.error('Skip onboarding error:', error);
      throw error;
    }
  },

  /**
   * Upload profile picture for any user type
   * All profile picture uploads go to /users/profile
   */
  uploadProfilePicture: async (file) => { // ✅ FIXED: Unified function name
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await apiClient.patch('/users/profile', formData, { // ✅ FIXED: Unified endpoint
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Profile picture upload error:', error);
      throw error;
    }
  },

  /**
   * Get current user data
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
};

export default onboardingApi;