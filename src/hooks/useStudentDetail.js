// src/hooks/useStudentDetail.js - Updated hook with correct API endpoint and only send changed fields
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

/**
 * Hook to fetch student detail data with correct API structure
 * @param {string} studentId - The ID of the student to fetch
 */
export const useStudentDetail = (studentId) => {
  const queryClient = useQueryClient();
  
  // Fetch student detail with correct structure
  const {
    data: studentData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      try {
        const response = await api.students.getStudentById(studentId);
        console.log('📊 Student detail response:', response);
        return response;
      } catch (error) {
        console.error(`Error fetching student ${studentId}:`, error);
        throw error;
      }
    },
    enabled: !!studentId,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Update student detail mutation using organization endpoint
  const updateStudentMutation = useMutation({
    mutationFn: async (data) => {
      try {
        console.log('📝 Updating student with data:', data);
        // Use the organization endpoint as specified
        const response = await api.organization.school.updateStudent(studentId, data);
        return response;
      } catch (error) {
        console.error(`Error updating student ${studentId}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the student detail query to refetch
      queryClient.invalidateQueries(['student', studentId]);
      
      // Also invalidate the student list if it exists
      queryClient.invalidateQueries(['infiniteStudents']);
    }
  });

  // Update student progress notes
  const updateProgressMutation = useMutation({
    mutationFn: async (progress) => {
      try {
        const response = await api.students.updateProgress(studentId, progress);
        return response;
      } catch (error) {
        console.error(`Error updating progress for student ${studentId}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['student', studentId]);
    }
  });

  // Update mental health status
  const updateScreeningStatusMutation = useMutation({
    mutationFn: async ({ status, notes }) => {
      try {
        const response = await api.students.updateScreeningStatus(studentId, status, notes);
        return response;
      } catch (error) {
        console.error(`Error updating screening status for student ${studentId}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['student', studentId]);
      queryClient.invalidateQueries(['infiniteStudents']);
    }
  });

  // Extract data from API structure
  const student = studentData?.data || null;
  const mentalHealthHistory = student?.mentalHealthHistories || [];

  console.log('📋 useStudentDetail processed data:', { 
    student, 
    mentalHealthHistory,
    isLoading,
    isError 
  });

  return {
    student,
    mentalHealthHistory,
    isLoading,
    isLoadingHistory: false, // Since history is included in main response
    isError,
    error,
    refetch,
    updateStudent: updateStudentMutation,
    updateProgress: updateProgressMutation,
    updateScreeningStatus: updateScreeningStatusMutation
  };
};