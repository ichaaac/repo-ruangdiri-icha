// src/hooks/useEmployeeData.js
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export const useEmployeeData = (searchTerm, sortConfig, filters) => {
  const queryClient = useQueryClient();
  
  const buildFilterParams = () => {
    const params = { 
      page: 1, 
      limit: 10 // Ensure we're requesting only 10 items per page
    };
  
    if (searchTerm) params.search = searchTerm;
  
    // Don't send sort parameters since backend returns 400
    // We'll sort on frontend instead
    
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
      
      // Numeric comparison for age and yearsOfService
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
    queryKey: ['infiniteEmployees', searchTerm, filters], // Remove sortConfig from key
    queryFn: async ({ pageParam = 1 }) => {
      const params = { 
        ...buildFilterParams(), 
        page: pageParam 
      };
      
      try {
        const response = await apiClient.get("/organizations/employees", { params });
        
        const data = response.data?.data?.employees || [];
        const metadata = response.data?.metadata || {
          totalPage: 1,
          totalData: 0,
          page: pageParam,
          limit: 10,
          hasNextPage: false,
          byGender: { male: 0, female: 0 }
        };
        
        return { 
          data, 
          metadata, 
          pageParam 
        };
      } catch (error) {
        console.error("Error fetching employees:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPage } = lastPage.metadata;
      // Return next page number if there are more pages
      return page < totalPage ? page + 1 : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch(`/organizations/employees/${id}`, data);
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

// Hook for departments - fix endpoint
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        // Use the correct endpoint
        const response = await apiClient.get("/employees/departments");
        
        // Process data to get unique departments and positions
        const rawData = response?.data?.data || [];
        const departmentMap = {};
        
        rawData.forEach(item => {
          if (item.department) {
            if (!departmentMap[item.department]) {
              departmentMap[item.department] = new Set();
            }
            // Add position if available
            if (item.position) {
              departmentMap[item.department].add(item.position);
            }
          }
        });
        
        // Convert to array format
        const departments = Object.entries(departmentMap).map(([dept, positions]) => ({
          department: dept,
          positions: positions.size > 0 ? Array.from(positions) : 
            ["Head", "Manager", "Staff", "Specialist"] // Default positions
        }));
        
        return departments;
      } catch (error) {
        console.error("Error fetching departments:", error);
        // Fallback data
        return [
          { department: "Human Resources", positions: ["Head", "Manager", "Staff", "Recruiter", "Specialist"] },
          { department: "Finance", positions: ["Head", "Accountant", "Analyst", "Manager"] },
          { department: "Marketing", positions: ["Head", "Specialist", "Manager", "Coordinator", "Assistant"] },
          { department: "IT", positions: ["Lead", "Developer", "Designer", "Support"] },
          { department: "Engineering", positions: ["Head", "Engineer", "Specialist", "Lead"] },
          { department: "Operations", positions: ["Head", "Manager", "Specialist", "Lead", "Staff"] },
          { department: "Sales", positions: ["Head", "Manager", "Staff"] }
        ];
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await apiClient.get("/users/me");
      return response?.data?.data || { fullName: "Pengguna" };
    },
  });
};