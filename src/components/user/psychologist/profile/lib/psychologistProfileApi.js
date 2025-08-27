// src/components/user/psychologist/profile/lib/psychologistProfileApi.js
import api, { apiClient } from "@/lib/api";

/**
 * API module untuk operasi psychologist profile
 */
const psychologistProfileApi = {
  /**
   * Get current user/psychologist profile
   * Menggunakan endpoint yang sudah ada di api.user.getMe
   */
  getProfile: async () => {
    try {
      const response = await api.user.getMe();
      return response;
    } catch (error) {
      console.error("Error fetching psychologist profile:", error);
      throw error;
    }
  },

  /**
   * Update psychologist profile
   * PATCH /users/profile - dengan form-data
   */
  updateProfile: async (profileData) => {
    try {
      const formData = new FormData();
      
      // Add basic fields
      if (profileData.fullName) {
        formData.append("fullName", profileData.fullName);
      }
      
      if (profileData.email) {
        formData.append("email", profileData.email);
      }
      
      if (profileData.phone) {
        formData.append("phone", profileData.phone);
      }

      // Add profile picture jika berupa base64, convert ke blob
      if (profileData.profilePicture && profileData.profilePicture.startsWith('data:')) {
        const response = await fetch(profileData.profilePicture);
        const blob = await response.blob();
        formData.append("profilePicture", blob, "profile.jpg");
      }

      // Add psychologist profile fields (flatten)
      if (profileData.psychologistProfile) {
        const profile = profileData.psychologistProfile;
        
        if (profile.sippNumber) {
          formData.append("sippNumber", profile.sippNumber);
        }
        
        if (profile.registrationNumber) {
          formData.append("registrationNumber", profile.registrationNumber);
        }
        
        if (profile.fieldOfExpertise) {
          formData.append("fieldOfExpertise", profile.fieldOfExpertise);
        }
        
        if (profile.specialization) {
          formData.append("specialization", profile.specialization);
        }
        
        if (profile.typeOfPractice) {
          formData.append("typeOfPractice", profile.typeOfPractice);
        }
        
        if (profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) {
          formData.append("yearsOfExperience", profile.yearsOfExperience.toString());
        }
      }

      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await apiClient.patch("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating psychologist profile:", error);
      throw error;
    }
  }
};

export default psychologistProfileApi;