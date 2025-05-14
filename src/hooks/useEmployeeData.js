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
  
    // Fix field mapping for sorting
    if (sortConfig.key && sortConfig.direction) {
      const sortKeyMap = {
        'fullName': 'name',
        'age': 'age',
        'yearsOfService': 'yearsOfService' // Use the correct field name
      };
      
      params.sortBy = sortKeyMap[sortConfig.key] || sortConfig.key;
      params.sortOrder = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
    }
    
    // Filters
    if (filters.department) params.department = filters.department;
    if (filters.position) params.position = filters.position;
    if (filters.gender) params.gender = filters.gender === 'L' ? 'male' : 'female';
    if (filters.screeningStatus) params.screening = filters.screeningStatus;
    if (filters.counselingStatus !== null) params.hasCounseled = filters.counselingStatus ? '1' : '0';

    return params;
  };

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['infiniteEmployees', searchTerm, sortConfig, filters],
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
  
  // Flatten all pages into single array
  const allEmployees = infiniteQuery.data?.pages.flatMap(page => page.data) || [];
  const metadata = infiniteQuery.data?.pages[0]?.metadata;

  return {
    employees: allEmployees,
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