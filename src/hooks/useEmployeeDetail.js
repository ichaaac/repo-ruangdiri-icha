// src/hooks/useEmployeeDetail.js - Updated hook with dummy data for development
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "../lib/api"
import { useDummyData } from "./useDummyData"

/**
 * Hook to fetch employee detail data
 * @param {string} employeeId - The ID of the employee to fetch
 */
export const useEmployeeDetail = (employeeId) => {
  const queryClient = useQueryClient()
  const { generateMentalHealthHistory } = useDummyData()

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
        const response = await api.organization.company.getEmployeeById(employeeId)
        console.log("📊 Employee detail response:", response)

        // DEVELOPMENT ONLY: Add dummy mental health history if missing or incomplete
        if (!response.data.mentalHealthHistories || response.data.mentalHealthHistories.length < 12) {
          response.data.mentalHealthHistories = generateMentalHealthHistory()
        }

        return response
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
        const response = await api.organization.company.updateEmployee(employeeId, data)
        return response
      } catch (error) {
        console.error(`Error updating employee ${employeeId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employee", employeeId])
      queryClient.invalidateQueries(["infiniteEmployees"])
    },
  })

  // Update employee progress notes
  const updateProgressMutation = useMutation({
    mutationFn: async (progress) => {
      try {
        const response = await api.employees.updateProgress(employeeId, progress)
        return response
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
        const response = await api.employees.updateScreeningStatus(employeeId, status, notes)
        return response
      } catch (error) {
        console.error(`Error updating screening status for employee ${employeeId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employee", employeeId])
      queryClient.invalidateQueries(["infiniteEmployees"])
    },
  })

  // Extract data from API structure
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
