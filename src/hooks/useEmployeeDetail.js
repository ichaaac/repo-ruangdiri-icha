// src/hooks/useEmployeeDetail.js - Updated hook with new API structure

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../lib/api"

/**
 * Hook to fetch employee detail data with new API structure
 * @param {string} employeeId - The ID of the employee to fetch
 */
export const useEmployeeDetail = (employeeId) => {
  const queryClient = useQueryClient()

  // Fetch employee detail
  const {
    data: employeeData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/employees/${employeeId}`)
        console.log("📊 Employee detail response:", response.data)
        return response.data
      } catch (error) {
        console.error(`Error fetching employee ${employeeId}:`, error)
        throw error
      }
    },
    enabled: !!employeeId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Update employee detail mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      try {
        console.log("📝 Updating employee with data:", data)
        const response = await apiClient.patch(`/organizations/employees/${employeeId}`, data)
        return response.data
      } catch (error) {
        console.error(`Error updating employee ${employeeId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employee", employeeId])
      queryClient.invalidateQueries(["infiniteEmployees"])
      queryClient.invalidateQueries(["dashboardMetrics"])
    },
  })

  // Update employee progress notes
  const updateProgressMutation = useMutation({
    mutationFn: async (progress) => {
      try {
        const response = await apiClient.patch(`/employees/${employeeId}/progress`, { notes: progress })
        return response.data
      } catch (error) {
        console.error(`Error updating progress for employee ${employeeId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employee", employeeId])
    },
  })

  // Update mental health status
  const updateScreeningStatusMutation = useMutation({
    mutationFn: async ({ status, notes }) => {
      try {
        const response = await apiClient.patch(`/employees/${employeeId}/screening-status`, { 
          screeningStatus: status, 
          notes 
        })
        return response.data
      } catch (error) {
        console.error(`Error updating screening status for employee ${employeeId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employee", employeeId])
      queryClient.invalidateQueries(["infiniteEmployees"])
      queryClient.invalidateQueries(["dashboardMetrics"])
    },
  })

  // Extract data from new API structure
  const employee = employeeData?.data || null
  const mentalHealthHistory = employee?.mentalHealthHistories || []

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
    updateScreeningStatus: updateScreeningStatusMutation,
  }
}