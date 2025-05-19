// src/hooks/useEmployeeData.js
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

/**
 * Hook for fetching and managing employee data in a list context
 */
export const useEmployeeData = (searchTerm, sortConfig, filters) => {
  const queryClient = useQueryClient();
  
  const buildFilterParams = () => {
    const params = { 
      page: 1, 
      limit: 10
    };
  
    if (searchTerm) params.search = searchTerm;
    
    // Filters
    if (filters.department) params.department = filters.department;
    if (filters.position) params.position = filters.position;
    if (filters.gender) params.gender = filters.gender === 'L' ? 'male' : 'female';
    if (filters.screeningStatus) params.screening = filters.screeningStatus;
    if (filters.counselingStatus !== null) params.hasCounseled = filters.counselingStatus ? '1' : '0';

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
      
      // Numeric comparison
      if (config.key === 'age' || config.key === 'yearsOfService') {
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
    queryKey: ['infiniteEmployees', searchTerm, filters],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const params = { 
          ...buildFilterParams(), 
          page: pageParam 
        };
        
        // Use the organization endpoint for employee lists
        const data = await api.organization.company.getEmployees(params);
        
        return { 
          data: data?.data?.employees || [], 
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
        console.error("Error fetching employees:", error);
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

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return api.organization.company.updateEmployee(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['infiniteEmployees']);
    }
  });
  
  // Flatten all pages into single array and sort on frontend
  const allEmployees = infiniteQuery.data?.pages.flatMap(page => page.data) || [];
  const sortedEmployees = sortData(allEmployees, sortConfig);
  const metadata = infiniteQuery.data?.pages[0]?.metadata;

  return {
    employees: sortedEmployees,
    totalData: metadata?.totalData || 0,
    genderCounts: metadata?.byGender || { male: 0, female: 0 },
    isLoading: infiniteQuery.isLoading,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    refetch: infiniteQuery.refetch,
    updateEmployee: updateEmployeeMutation
  };
};

/**
 * Hook to fetch employee detail data
 * @param {string} employeeId - The ID of the employee to fetch
 */
export const useEmployeeDetail = (employeeId) => {
  const queryClient = useQueryClient();
  
  // Fetch employee detail
  const {
    data: employeeData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => api.organization.company.getEmployeeById(employeeId),
    enabled: !!employeeId,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Update employee detail mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: (data) => api.organization.company.updateEmployee(employeeId, data),
    onSuccess: () => {
      // Invalidate the employee detail query to refetch
      queryClient.invalidateQueries(['employee', employeeId]);
      
      // Also invalidate the employee list if it exists
      queryClient.invalidateQueries(['infiniteEmployees']);
    }
  });

  // Update mental health status
  const updateScreeningStatusMutation = useMutation({
    mutationFn: ({ status, notes }) => api.organization.company.updateEmployeeScreeningStatus(employeeId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
      queryClient.invalidateQueries(['infiniteEmployees']);
    }
  });

  // Get employee mental health history
  const {
    data: mentalHealthHistory,
    isLoading: isLoadingHistory
  } = useQuery({
    queryKey: ['employee', employeeId, 'mentalHealthHistory'],
    queryFn: () => api.organization.company.getEmployeeMentalHealthHistory(employeeId),
    enabled: !!employeeId && !!employeeData,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return {
    employee: employeeData?.data || null,
    mentalHealthHistory: mentalHealthHistory?.data || null,
    isLoading,
    isLoadingHistory,
    isError,
    error,
    refetch,
    updateEmployee: updateEmployeeMutation,
    updateScreeningStatus: updateScreeningStatusMutation
  };
};

/**
 * Hook to fetch departments data using the centralized API
 */
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api.organization.company.getDepartments(),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false,
    select: (data) => data?.data || [
      { department: "Human Resources", positions: ["Head", "Manager", "Staff", "Recruiter"] },
      { department: "Finance", positions: ["Head", "Manager", "Accountant", "Analyst"] },
      { department: "Marketing", positions: ["Head", "Manager", "Specialist", "Coordinator"] },
      { department: "Operations", positions: ["Head", "Lead", "Manager", "Staff"] },
      { department: "Information Technology", positions: ["Head", "Lead", "Developer", "Designer", "Support"] },
      { department: "Product Development", positions: ["Head", "Lead", "Manager", "Engineer"] },
      { department: "Legal", positions: ["Head", "Counsel", "Specialist"] }
    ]
  });
};

/**
 * Hook to fetch dashboard metrics for employees
 */
export const useEmployeeDashboardMetrics = () => {
  return useQuery({
    queryKey: ['employeeDashboardMetrics'],
    queryFn: () => api.organization.company.getDashboardMetrics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    select: (data) => data?.data || {
      summary: {
        atRisk: { count: 0, total: 0 },
        notScreened: { count: 0, total: 0 },
        notCounseled: { count: 0, total: 0 }
      },
      mentalHealth: {
        overall: { atRisk: 0, monitored: 0, stable: 0 },
        byMonth: []
      },
      status: {
        screening: { completed: 0, notCompleted: 0 },
        counseling: { completed: 0, notCompleted: 0 }
      }
    }
  });
};

/**
 * Hook to fetch user profile data (reused from useStudentData)
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