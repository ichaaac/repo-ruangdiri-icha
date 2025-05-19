// src/hooks/useStudentData.js - Fixed getStudentById function call
// Just updating the useStudentDetail hook portion for brevity

/**
 * Hook to fetch student detail data
 * @param {string} studentId - The ID of the student to fetch
 */
export const useStudentDetail = (studentId) => {
  const queryClient = useQueryClient();
  
  // Fetch student detail
  const {
    data: studentData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.students.getStudentById(studentId), // Fixed function name here
    enabled: !!studentId,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Update student detail mutation
  const updateStudentMutation = useMutation({
    mutationFn: (data) => api.students.update(studentId, data),
    onSuccess: () => {
      // Invalidate the student detail query to refetch
      queryClient.invalidateQueries(['student', studentId]);
      
      // Also invalidate the student list if it exists
      queryClient.invalidateQueries(['infiniteStudents']);
    }
  });

  // Update student progress notes
  const updateProgressMutation = useMutation({
    mutationFn: (progress) => api.students.updateProgress(studentId, progress),
    onSuccess: () => {
      queryClient.invalidateQueries(['student', studentId]);
    }
  });

  // Update mental health status
  const updateScreeningStatusMutation = useMutation({
    mutationFn: ({ status, notes }) => api.students.updateScreeningStatus(studentId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['student', studentId]);
      queryClient.invalidateQueries(['infiniteStudents']);
    }
  });

  // Get student mental health history
  const {
    data: mentalHealthHistory,
    isLoading: isLoadingHistory
  } = useQuery({
    queryKey: ['student', studentId, 'mentalHealthHistory'],
    queryFn: () => api.students.getMentalHealthHistory(studentId),
    enabled: !!studentId && !!studentData,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return {
    student: studentData?.data || null,
    mentalHealthHistory: mentalHealthHistory?.data || null,
    isLoading,
    isLoadingHistory,
    isError,
    error,
    refetch,
    updateStudent: updateStudentMutation,
    updateProgress: updateProgressMutation,
    updateScreeningStatus: updateScreeningStatusMutation
  };
};