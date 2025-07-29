// src/components/shared/onboarding/lib/onboardingApi.js
import { apiClient } from '../../../../lib/api'; // Mengimpor apiClient dari api.js

const onboardingApi = {
  /**
   * Complete onboarding for users (student, employee, psychologist)
   */
  completeUserOnboarding: async (onboardingData) => {
    try {
      const response = await apiClient.patch('/users/me/profile', {
        onboarded: true,
        ...onboardingData
      });
      return response.data;
    } catch (error) {
      console.error('User onboarding error:', error);
      throw error;
    }
  },

  /**
   * Complete onboarding for organizations (school, company)
   */
  completeOrganizationOnboarding: async (onboardingData) => {
    try {
      const response = await apiClient.patch('/organizations/profile', {
        onboarded: true,
        ...onboardingData
      });
      return response.data;
    } catch (error) {
      console.error('Organization onboarding error:', error);
      throw error;
    }
  },

  /**
   * Skip onboarding for users
   */
  skipUserOnboarding: async () => {
    try {
      const response = await apiClient.patch('/users/me/profile', {
        onboarded: true
      });
      return response.data;
    } catch (error) {
      console.error('Skip user onboarding error:', error);
      throw error;
    }
  },

  /**
   * Skip onboarding for organizations
   */
  skipOrganizationOnboarding: async () => {
    try {
      const response = await apiClient.patch('/organizations/profile', {
        onboarded: true
      });
      return response.data;
    } catch (error) {
      console.error('Skip organization onboarding error:', error);
      throw error;
    }
  },

  /**
   * Upload profile picture for users
   */
  uploadUserProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await apiClient.patch('/users/me/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('User profile picture upload error:', error);
      throw error;
    }
  },

  /**
   * Upload profile picture for organizations
   */
  uploadOrganizationProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await apiClient.patch('/organizations/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Organization profile picture upload error:', error);
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