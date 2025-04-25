import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationAPI } from "../api/organization";

/**
 * Organization service with React Query hooks
 * Direct approach without useEffect or Context
 */
export const organizationService = {
  /**
   * Get profile data for organization
   * @param {string} orgType - Organization type (school or company)
   * @returns {Object} Query result object
   */
  useProfileData: (orgType = "organization") => {
    return useQuery({
      queryKey: [`${orgType}-profile`],
      queryFn: () => organizationAPI.getProfile(),
      staleTime: 60000, // 1 minute
    });
  },

  /**
   * Update organization profile
   * @returns {Object} Mutation result object
   */
  useUpdateProfile: () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (profileData) => organizationAPI.updateProfile(profileData),
      onSuccess: (data) => {
        // Invalidate all profile queries to ensure data consistency
        queryClient.invalidateQueries({ queryKey: ["school-profile"] });
        queryClient.invalidateQueries({ queryKey: ["company-profile"] });
        queryClient.invalidateQueries({ queryKey: ["organization-profile"] });
        
        return data;
      }
    });
  },

  /**
   * Update profile picture
   * @returns {Object} Mutation result object
   */
  useUpdateProfilePicture: () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (file) => organizationAPI.updateProfilePicture(file),
      onSuccess: (data) => {
        // Invalidate all profile queries to ensure data consistency
        queryClient.invalidateQueries({ queryKey: ["school-profile"] });
        queryClient.invalidateQueries({ queryKey: ["company-profile"] });
        queryClient.invalidateQueries({ queryKey: ["organization-profile"] });
        
        return data;
      }
    });
  },

  // School-specific services
  school: {
    /**
     * Get student list with filtering and pagination
     * @param {Object} params - Query parameters
     * @returns {Object} Query result object
     */
    useStudents: (params = {}) => {
      return useQuery({
        queryKey: ['students', params],
        queryFn: () => organizationAPI.school.getStudents(params),
      });
    }
  },

  // Company-specific services
  company: {
    /**
     * Get employee list with filtering and pagination
     * @param {Object} params - Query parameters
     * @returns {Object} Query result object
     */
    useEmployees: (params = {}) => {
      return useQuery({
        queryKey: ['employees', params],
        queryFn: () => organizationAPI.company.getEmployees(params),
      });
    }
  }
};

export default organizationService;