import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationAPI } from "../api/organization";
import { useAuth } from "./useAuth";

/**
 * Custom hook for organization-related operations
 * Adapts behavior based on organization type (school/company)
 */
export const useOrganization = () => {
  const queryClient = useQueryClient();
  const { getOrganizationType } = useAuth();
  const orgType = getOrganizationType();

  /**
   * Fetch organization profile data
   */
  const useProfileData = () => {
    return useQuery({
      queryKey: [`${orgType || 'organization'}-profile`],
      queryFn: () => organizationAPI.getProfile(),
      // Skip query if no organization type available
      enabled: !!orgType,
      staleTime: 60000, // 1 minute
    });
  };

  /**
   * Update organization profile
   */
  const useUpdateProfile = () => {
    return useMutation({
      mutationFn: (profileData) => organizationAPI.updateProfile(profileData),
      onSuccess: () => {
        // Invalidate profile query to trigger refetch
        queryClient.invalidateQueries([`${orgType || 'organization'}-profile`]);
      }
    });
  };

  /**
   * Update organization profile picture
   */
  const useUpdateProfilePicture = () => {
    return useMutation({
      mutationFn: (file) => organizationAPI.updateProfilePicture(file),
      onSuccess: () => {
        // Invalidate profile query to trigger refetch with new picture
        queryClient.invalidateQueries([`${orgType || 'organization'}-profile`]);
      }
    });
  };

  /**
   * Fetch students (school-specific)
   */
  const useStudents = (params = {}) => {
    return useQuery({
      queryKey: ['students', params],
      queryFn: () => organizationAPI.school.getStudents(params),
      // Only enable this query for school organizations
      enabled: orgType === 'school',
    });
  };

  /**
   * Fetch employees (company-specific)
   */
  const useEmployees = (params = {}) => {
    return useQuery({
      queryKey: ['employees', params],
      queryFn: () => organizationAPI.company.getEmployees(params),
      // Only enable this query for company organizations
      enabled: orgType === 'company',
    });
  };

  return {
    useProfileData,
    useUpdateProfile,
    useUpdateProfilePicture,
    useStudents,
    useEmployees,
    orgType
  };
};

export default useOrganization;