// src/hooks/useStudentDetail.js - CORRECTED for new API structure

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../lib/api"

/**
 * Hook to fetch student detail data with new API structure
 * @param {string} studentId - The ID of the student to fetch
 */
export const useStudentDetail = (studentId) => {
  const queryClient = useQueryClient()

  const {
    data: studentData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/students/${studentId}`)
        console.log("📊 Student detail response:", response.data)
        return response.data
      } catch (error) {
        console.error(`Error fetching student ${studentId}:`, error)
        throw error
      }
    },
    enabled: !!studentId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Update student detail mutation using organization endpoint
  const updateStudentMutation = useMutation({
    mutationFn: async (data) => {
      try {
        console.log("📝 Updating student with data:", data)
        // Use the organization endpoint as specified
        const response = await apiClient.patch(`/organizations/students/${studentId}`, data)
        return response.data
      } catch (error) {
        console.error(`Error updating student ${studentId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate the student detail query to refetch
      queryClient.invalidateQueries(["student", studentId])
      // Also invalidate the student list if it exists
      queryClient.invalidateQueries(["infiniteStudents"])
      queryClient.invalidateQueries(["dashboardMetrics"])
    },
  })

  // Update student progress notes
  const updateProgressMutation = useMutation({
    mutationFn: async (progress) => {
      try {
        const response = await apiClient.patch(`/students/${studentId}/progress`, { notes: progress })
        return response.data
      } catch (error) {
        console.error(`Error updating progress for student ${studentId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["student", studentId])
    },
  })

  // Update mental health status
  const updateScreeningStatusMutation = useMutation({
    mutationFn: async ({ status, notes }) => {
      try {
        const response = await apiClient.patch(`/students/${studentId}/screening-status`, { 
          screeningStatus: status, 
          notes 
        })
        return response.data
      } catch (error) {
        console.error(`Error updating screening status for student ${studentId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["student", studentId])
      queryClient.invalidateQueries(["infiniteStudents"])
      queryClient.invalidateQueries(["dashboardMetrics"])
    },
  })

  // Extract data from new API structure - NO MORE mentalHealthHistories
  const student = studentData?.data || null

  console.log("📋 useStudentDetail processed data:", {
    student: student,
    screenings: student?.screenings || [],
    counselings: student?.counselings || [],
    isLoading,
    isError,
  })

  // REMOVED: mentalHealthHistory from return - no longer needed
  return {
    student,
    isLoading,
    isLoadingHistory: false, // Since data is included in main response
    isError,
    error,
    refetch,
    updateStudent: updateStudentMutation,
    updateProgress: updateProgressMutation,
    updateScreeningStatus: updateScreeningStatusMutation,
  }
}