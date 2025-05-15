// src/hooks/useStudentData.js
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { useMemo } from "react";

export const useStudentData = (searchTerm, sortConfig, filters) => {
  const queryClient = useQueryClient();
  
  const buildFilterParams = () => {
    const params = { page: 1, limit: 10 };
    
    // Only send filters, not search (we'll filter search client-side)
    if (filters.grade && filters.classNumber) {
      params.classroom = `${filters.grade}-${filters.classNumber}`;
    }
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
      
      if (config.key === 'nis') {
        aValue = String(aValue);
        bValue = String(bValue);
        return aValue.localeCompare(bValue, undefined, { numeric: true });
      }
      
      if (config.key === 'iqScore') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return aValue - bValue;
      }
      
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    });
    
    return config.direction === 'descending' ? sorted.reverse() : sorted;
  };

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['infiniteStudents', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { ...buildFilterParams(), page: pageParam };
      
      try {
        const response = await apiClient.get("/organizations/students", { params });
        const data = response.data?.data?.students || [];
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
        console.error("Error fetching students:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPage } = lastPage.metadata;
      return page < totalPage ? page + 1 : undefined;
    },
    refetchOnWindowFocus: false,
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }) => apiClient.patch(`/organizations/students/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries(['infiniteStudents'])
  });
  
  // Process data with client-side search and sort
  const processedData = useMemo(() => {
    const allStudents = infiniteQuery.data?.pages.flatMap(page => page.data) || [];
    
    // Client-side search filtering
    let filteredStudents = allStudents;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredStudents = allStudents.filter(student => {
        const fullName = student.fullName?.toLowerCase() || '';
        const nis = student.nis?.toLowerCase() || '';
        return fullName.includes(searchLower) || nis.includes(searchLower);
      });
    }
    
    // Apply sorting
    const sortedStudents = sortData(filteredStudents, sortConfig);
    
    return sortedStudents;
  }, [infiniteQuery.data, searchTerm, sortConfig]);
  
  const metadata = infiniteQuery.data?.pages[0]?.metadata;

  return {
    students: processedData,
    totalData: metadata?.totalData || 0,
    genderCounts: metadata?.byGender || { male: 0, female: 0 },
    isLoading: infiniteQuery.isLoading,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    refetch: infiniteQuery.refetch,
    updateStudent: updateStudentMutation
  };
};

export const useClassrooms = () => {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/students/academic-info");
        const data = response?.data?.data;
        
        if (data?.classroomsResult && data?.gradesResult) {
          // Process the data to extract unique grades and class numbers
          const uniqueGrades = new Set();
          const uniqueClassNumbers = new Set();
          
          // Process grades
          data.gradesResult.forEach(grade => {
            let normalizedGrade = grade.toUpperCase();
            if (normalizedGrade === "10") normalizedGrade = "X";
            else if (normalizedGrade === "11") normalizedGrade = "XI";
            else if (normalizedGrade === "12") normalizedGrade = "XII";
            
            if (/^[XVI]+$/.test(normalizedGrade)) {
              uniqueGrades.add(normalizedGrade);
            }
          });
          
          // Process classrooms
          data.classroomsResult.forEach(classroom => {
            const parts = classroom.split("-");
            if (parts.length >= 2) {
              const classNum = parts[1];
              if (classNum && classNum.trim() !== '') {
                uniqueClassNumbers.add(classNum);
              }
            }
          });
          
          // Sort and return
          const gradeOrder = ["X", "XI", "XII"];
          const sortedGrades = Array.from(uniqueGrades).sort((a, b) => {
            const indexA = gradeOrder.indexOf(a);
            const indexB = gradeOrder.indexOf(b);
            return indexA - indexB;
          });
          
          const sortedClassNumbers = Array.from(uniqueClassNumbers).sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            if (numA && numB) return numA - numB;
            return a.localeCompare(b);
          });
          
          return {
            grades: sortedGrades.length > 0 ? sortedGrades : ["X", "XI", "XII"],
            classNumbers: sortedClassNumbers.length > 0 ? sortedClassNumbers : ["1", "2", "3"],
            classrooms: data.classroomsResult || []
          };
        }
        
        // Fallback
        return {
          grades: ["X", "XI", "XII"],
          classNumbers: ["1", "2", "3"],
          classrooms: []
        };
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        return {
          grades: ["X", "XI", "XII"],
          classNumbers: ["1", "2", "3"],
          classrooms: []
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