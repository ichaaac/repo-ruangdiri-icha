// src/hooks/useEmployeeData.js
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export const useEmployeeData = (searchTerm, sortConfig, filters) => {
  const queryClient = useQueryClient();
  
  const buildFilterParams = () => {
    const params = {
      page: 1,
      limit: 10
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    // Only add sort params if there's a direction (not default state)
    if (sortConfig.key && sortConfig.direction) {
      params.sortBy = sortConfig.key;
      params.sortOrder = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
    }

    if (filters.department) {
      params.department = filters.department;
    }

    if (filters.position) {
      params.position = filters.position;
    }

    if (filters.gender) {
      params.gender = filters.gender === 'L' ? 'male' : 'female';
    }

    if (filters.screeningStatus) {
      params.screening = filters.screeningStatus;
    }

    if (filters.counselingStatus !== null) {
      params.hasCounseled = filters.counselingStatus ? '1' : '0';
    }

    return params;
  };

  // Initial data fetch for total count only
  const { data: totalData } = useQuery({
    queryKey: ['employeeTotalData'],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/organizations/employees", { 
          params: { 
            page: 1,
            limit: 1
          } 
        });
        
        return {
          totalData: response.data?.metadata?.totalData || 0
        };
      } catch (error) {
        console.error('Employee total count error:', error);
        return { totalData: 0 };
      }
    },
  });

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['infiniteEmployees', searchTerm, sortConfig, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { ...buildFilterParams(), page: pageParam };

      try {
        const response = await apiClient.get("/organizations/employees", { params });
        
        const employeesData = response.data?.data?.employees || [];
        const metadata = response.data?.metadata || {
          totalPage: 1,
          totalData: 0,
          page: pageParam,
          limit: 10,
          hasNextPage: false,
          byGender: { male: 0, female: 0 }
        };
        
        return {
          data: employeesData,
          metadata: metadata,
          pageParam
        };
      } catch (error) {
        console.error('Employees API error:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.metadata.page;
      const totalPages = lastPage.metadata.totalPage;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  // Update employee mutation - only send changed fields
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Remove employeeId as it's not used now
      const { employeeId, ...dataToSend } = data;
      return apiClient.patch(`/organizations/employees/${id}`, dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infiniteEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeTotalData'] });
    }
  });
  
  // Process all loaded pages into flat array
  const allEmployees = infiniteQuery.data
    ? infiniteQuery.data.pages.flatMap(page => page.data)
    : [];

  const latestMetadata = infiniteQuery.data?.pages[0]?.metadata;
  const genderCounts = latestMetadata?.byGender || { male: 0, female: 0 };

  return {
    employees: allEmployees,
    totalData: totalData?.totalData || 0,  // Fixed: changed from totalCountData?.totalCount
    genderCounts: genderCounts,
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

// User profile data hook
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/users/me");
        const userData = response?.data?.data;
        return userData || { fullName: "Pengguna" };
      } catch (error) {
        console.error('User profile API error:', error);
        return { fullName: "Pengguna" };
      }
    },
    staleTime: 1000 * 60 * 5
  });
};

// Departments data hook
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const response = await api.organization.company.getDepartments();
        return response?.data || [];
      } catch (error) {
        console.error('Departments API error:', error);
        // Fallback data
        return [
          { department: "Human Resources", positions: ["Head", "Manager", "Staff", "Recruiter"] },
          { department: "Finance", positions: ["Head", "Manager", "Accountant", "Analyst"] },
          { department: "Marketing", positions: ["Head", "Manager", "Specialist", "Coordinator"] },
          { department: "Operations", positions: ["Head", "Lead", "Manager", "Staff"] },
          { department: "Information Technology", positions: ["Head", "Lead", "Developer", "Designer", "Support"] },
          { department: "Product Development", positions: ["Head", "Lead", "Manager", "Engineer"] },
          { department: "Legal", positions: ["Head", "Counsel", "Specialist"] }
        ];
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};