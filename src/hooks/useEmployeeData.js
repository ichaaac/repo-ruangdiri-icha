// src/hooks/useEmployeeData.js
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { useMemo } from "react";

export const useEmployeeData = (searchTerm, sortConfig, filters) => {
  const queryClient = useQueryClient();
  
  const buildFilterParams = () => {
    const params = { page: 1, limit: 10 };
    
    // Only send filters, not search (we'll filter search client-side)
    if (filters.department) params.department = filters.department;
    if (filters.position) params.position = filters.position;
    if (filters.gender) params.gender = filters.gender === 'L' ? 'male' : 'female';
    if (filters.screeningStatus) params.screening = filters.screeningStatus;
    if (filters.counselingStatus !== null) params.hasCounseled = filters.counselingStatus ? '1' : '0';

    return params;
  };

  const sortData = (data, config) => {
    if (!config.key || !config.direction) return data;
    
    const sorted = [...data].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];
      
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      if (config.key === 'fullName') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      }
      
      if (config.key === 'age' || config.key === 'yearsOfService') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return aValue - bValue;
      }
      
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    });
    
    return config.direction === 'descending' ? sorted.reverse() : sorted;
  };

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['infiniteEmployees', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { ...buildFilterParams(), page: pageParam };
      
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
        
        return { data, metadata, pageParam };
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
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => apiClient.patch(`/organizations/employees/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries(['infiniteEmployees'])
  });
  
  // Process data with client-side search and sort
  const processedData = useMemo(() => {
    const allEmployees = infiniteQuery.data?.pages.flatMap(page => page.data) || [];
    
    // Client-side search filtering
    let filteredEmployees = allEmployees;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredEmployees = allEmployees.filter(employee => {
        const fullName = employee.fullName?.toLowerCase() || '';
        const employeeId = employee.employeeId?.toLowerCase() || '';
        return fullName.includes(searchLower) || employeeId.includes(searchLower);
      });
    }
    
    // Apply sorting
    const sortedEmployees = sortData(filteredEmployees, sortConfig);
    
    return sortedEmployees;
  }, [infiniteQuery.data, searchTerm, sortConfig]);
  
  const metadata = infiniteQuery.data?.pages[0]?.metadata;

  return {
    employees: processedData,
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

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/employees/roles");
        const data = response?.data?.data;
        
        // Handle new API format
        if (data?.departments && data?.positions) {
          return {
            departments: data.departments || [],
            positions: data.positions || []
          };
        }
        
        // Fallback if API returns unexpected format
        console.error("Unexpected data format from /employees/roles");
        return {
          departments: ["Human Resources", "Finance", "Marketing", "IT", "Operations"],
          positions: ["Head", "Manager", "Staff", "Specialist", "Developer", "Analyst"]
        };
      } catch (error) {
        console.error("Error fetching departments:", error);
        return {
          departments: ["Human Resources", "Finance", "Marketing", "IT", "Operations"],
          positions: ["Head", "Manager", "Staff", "Specialist", "Developer", "Analyst"]
        };
      }
    },
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