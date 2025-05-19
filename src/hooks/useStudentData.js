// src/hooks/useStudentData.js
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

/**
 * Hook for fetching and managing student data in a list context
 */
export const useStudentData = (searchTerm, sortConfig, filters) => {
  const queryClient = useQueryClient();
  
  const buildFilterParams = () => {
    const params = { 
      page: 1, 
      limit: 10
    };
  
    if (searchTerm) params.search = searchTerm;
    
    // Filters
    if (filters.grade) params.grade = filters.grade;
    if (filters.classroom) params.classroom = filters.classroom;
    if (filters.gender) params.gender = filters.gender;
    if (filters.screeningStatus) params.screening = filters.screeningStatus;
    if (filters.counselingStatus !== null) params.hasCounseled = filters.counselingStatus ? '1' : '0';
    if (filters.iqScore) params.iqScore = filters.iqScore;

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
        const data = await api.organization.school.getStudents(params);
        
        return { 
          data: data?.data?.students || [], 
          metadata: data?.metadata || {
            totalPage: 1,
            totalData: 0,
            page: pageParam,
            limit: 10,
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
      const { page, totalPage } = lastPage.metadata;
      return page < totalPage ? page + 1 : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Use the new direct student API endpoint
      return api.students.updateStudent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['infiniteStudents']);
    }
  });
  
  // Flatten all pages into single array and sort on frontend
  const allStudents = infiniteQuery.data?.pages.flatMap(page => page.data) || [];
  const sortedStudents = sortData(allStudents, sortConfig);
  const metadata = infiniteQuery.data?.pages[0]?.metadata;

  return {
    students: sortedStudents,
    totalData: metadata?.totalData || 0,
    genderCounts: metadata?.byGender || { male: 0, female: 0 },
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
 * Hook to fetch student detail data
 * @param {string} studentId - The ID of the student to fetch
 */
export const useStudentDetail = (studentId) => {
  const queryClient = useQueryClient();
  
  // Fetch student detail
  const {
    data: student,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.students.getStudentById(studentId),
    enabled: !!studentId,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Update student detail mutation
  const updateStudentMutation = useMutation({
    mutationFn: (data) => api.students.updateStudent(studentId, data),
    onSuccess: () => {
      // Invalidate the student detail query to refetch
      queryClient.invalidateQueries(['student', studentId]);
      
      // Also invalidate the student list if it exists
      queryClient.invalidateQueries(['infiniteStudents']);
    }
  });

  // Update student progress notes
  const updateProgressMutation = useMutation({
    mutationFn: (progress) => api.students.updateProgress(studentId, progress),
    onSuccess: () => {
      queryClient.invalidateQueries(['student', studentId]);
    }
  });

  // Update mental health status
  const updateScreeningStatusMutation = useMutation({
    mutationFn: ({ status, notes }) => api.students.updateScreeningStatus(studentId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['student', studentId]);
      queryClient.invalidateQueries(['infiniteStudents']);
    }
  });

  return {
    student: student?.data,
    isLoading,
    isError,
    error,
    refetch,
    updateStudent: updateStudentMutation,
    updateProgress: updateProgressMutation,
    updateScreeningStatus: updateScreeningStatusMutation
  };
};

/**
 * Hook to fetch classrooms data
 */
export const useClassrooms = () => {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      try {
        const response = await api.students.getAcademicInfo();
        return response?.data || {
          grades: ["X", "XI", "XII"],
          classNumbers: ["1", "2", "3", "4", "5", "IPA-1", "IPA-2", "IPS-1", "IPS-2"],
          classrooms: [
            "X-1", "X-2", "X-3", "X-4", "X-5", 
            "XI-IPA-1", "XI-IPA-2", "XI-IPS-1", "XI-IPS-2",
            "XII-IPA-1", "XII-IPA-2", "XII-IPS-1", "XII-IPS-2",
            "x-ayam bakar"
          ]
        };
      } catch (error) {
        console.error("Error in useClassrooms:", error);
        // Return fallback data
        return {
          grades: ["X", "XI", "XII"],
          classNumbers: ["1", "2", "3", "4", "5", "IPA-1", "IPA-2", "IPS-1", "IPS-2"],
          classrooms: [
            "X-1", "X-2", "X-3", "X-4", "X-5", 
            "XI-IPA-1", "XI-IPA-2", "XI-IPS-1", "XI-IPS-2",
            "XII-IPA-1", "XII-IPA-2", "XII-IPS-1", "XII-IPS-2",
            "x-ayam bakar"
          ]
        };
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false
  });
};

/**
 * Hook to fetch user profile data
 */
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await api.user.getMe();
        return response?.data?.data || { fullName: "Pengguna" };
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return { fullName: "Pengguna" };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });
};