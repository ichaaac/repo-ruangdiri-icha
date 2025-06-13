// src/hooks/useStudentData.js - Fixed to properly handle API response structure and refetch
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

/**
 * Hook for fetching user profile data
 */
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await api.user.getMe();
        return response.data;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }
    },
  });
};

export const useStudentData = (searchTerm, sortConfig, filters) => {
  const queryClient = useQueryClient();
  
  const buildFilterParams = () => {
    const params = { 
      page: 1, 
      limit: 30
    };
  
    if (searchTerm) params.search = searchTerm;
    
    // Filters - using EXACT API parameter names
    if (filters.classroom) params.classroom = filters.classroom;
    if (filters.grade) params.grade = filters.grade;
    if (filters.gender) {
      if (filters.gender === 'L') params.gender = 'male';
      else if (filters.gender === 'P') params.gender = 'female';
      else params.gender = filters.gender;
    }
    if (filters.screeningStatus) params.screening = filters.screeningStatus;
    if (filters.counselingStatus !== null) params.counselingStatus = filters.counselingStatus ? '1' : '0';
    
    return params;
  };

  // Helper function to sort data on frontend
  const sortData = (data, config) => {
    if (!config.key || !config.direction) return data;
    
    const sorted = [...data].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Convert to string for name comparison with natural sort
      if (config.key === 'fullName') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        
        // Natural sort for alphanumeric strings
        return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      }
      
      // Numeric comparison for IQ score
      if (config.key === 'iqScore') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return aValue - bValue;
      }
      
      // Default string comparison
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });
    
    // Reverse for descending
    if (config.direction === 'descending') {
      sorted.reverse();
    }
    
    return sorted;
  };

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['infiniteStudents', searchTerm, filters],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const params = { 
          ...buildFilterParams(), 
          page: pageParam 
        };
        
        // Use the organization endpoint for student lists
        const response = await api.organization.school.getStudents(params);
        
        // The API response structure has metadata in a specific format
        return { 
          data: response.data?.students || [], 
          metadata: response.metadata || {
            totalData: 0,
            totalPage: 1,
            page: pageParam,
            limit: 30, // Match the increased limit
            hasNextPage: false,
            byGender: { male: 0, female: 0 }
          },
          pageParam 
        };
      } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      // Check if there are more pages based on metadata
      if (lastPage.metadata && lastPage.metadata.hasNextPage) {
        return lastPage.metadata.page + 1;
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return api.organization.school.updateStudent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['infiniteStudents']);
    },
    onError: (error) => {
      console.error("Error updating student:", error);
    }
  });
  
  // Flatten all pages into single array and sort on frontend
  const allStudents = infiniteQuery.data?.pages.flatMap(page => page.data) || [];
  const sortedStudents = sortData(allStudents, sortConfig);
  
  // Get metadata from the first page (should be the same for all pages)
  const metadata = infiniteQuery.data?.pages[0]?.metadata;

  // Get gender counts from metadata if available
  const genderCounts = metadata?.byGender || { male: 0, female: 0 };

  return {
    students: sortedStudents,
    totalData: metadata?.totalData || 0,
    genderCounts,
    isLoading: infiniteQuery.isLoading,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    refetch: infiniteQuery.refetch,
    updateStudent: updateStudentMutation
  };
};

/**
 * Hook to fetch classrooms data from API
 */
export const useClassrooms = () => {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      try {
        const response = await api.students.getAcademicInfo();
        
        // Parse the classroom data exactly as returned from API
        const classrooms = response?.data?.classrooms || [];
        const gradesResult = response?.data?.grades || [];
        
        // Extract class numbers from classroom strings
        const classNumbers = new Set();
        classrooms.forEach(classroom => {
          const parts = classroom.split('-');
          if (parts.length > 1) {
            // Get everything after the first dash
            const classNumber = parts.slice(1).join('-');
            if (classNumber) {
              classNumbers.add(classNumber);
            }
          }
        });
        
        return {
          gradesResult,
          classNumbers: Array.from(classNumbers),
          classrooms
        };
      } catch (error) {
        console.error("Error in useClassrooms:", error);
        throw error;
      }
    },
    retry: 2
  });
};