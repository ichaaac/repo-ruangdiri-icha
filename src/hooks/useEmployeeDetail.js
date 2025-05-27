// src/hooks/useEmployeeDetail.js - Employee detail hook
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

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
    queryFn: async () => {
      try {
        const response = await api.employees.getEmployeeById(employeeId);
        console.log('📊 Employee detail response:', response);
        return response;
      } catch (error) {
        console.error(`Error fetching employee ${employeeId}:`, error);
        throw error;
      }
    },
    enabled: !!employeeId,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Update employee detail mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      try {
        console.log('📝 Updating employee with data:', data);
        const response = await api.organization.company.updateEmployee(employeeId, data);
        return response;
      } catch (error) {
        console.error(`Error updating employee ${employeeId}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the employee detail query to refetch
      queryClient.invalidateQueries(['employee', employeeId]);
      
      // Also invalidate the employee list if it exists
      queryClient.invalidateQueries(['infiniteEmployees']);
    }
  });

  // Update employee progress notes
  const updateProgressMutation = useMutation({
    mutationFn: async (progress) => {
      try {
        const response = await api.employees.updateProgress(employeeId, progress);
        return response;
      } catch (error) {
        console.error(`Error updating progress for employee ${employeeId}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
    }
  });

  // Update mental health status
  const updateScreeningStatusMutation = useMutation({
    mutationFn: async ({ status, notes }) => {
      try {
        const response = await api.employees.updateScreeningStatus(employeeId, status, notes);
        return response;
      } catch (error) {
        console.error(`Error updating screening status for employee ${employeeId}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', employeeId]);
      queryClient.invalidateQueries(['infiniteEmployees']);
    }
  });

  // Extract data from API structure
  const employee = employeeData?.data || null;
  const mentalHealthHistory = employee?.mentalHealthHistories || [];

  console.log('📋 useEmployeeDetail processed data:', { 
    employee, 
    mentalHealthHistory,
    isLoading,
    isError 
  });

  return {
    employee,
    mentalHealthHistory,
    isLoading,
    isLoadingHistory: false,
    isError,
    error,
    refetch,
    updateEmployee: updateEmployeeMutation,
    updateProgress: updateProgressMutation,
    updateScreeningStatus: updateScreeningStatusMutation
  };
};