// src/hooks/useStudentData.js - Fixed API parameters and counseling filter

import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await api.user.getMe();
        return response.data;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }
    },
  });
};

export const useStudentData = (searchTerm, sortConfig, filters) => {
  const queryClient = useQueryClient();
  
  const buildFilterParams = () => {
    const params = { 
      page: 1, 
      limit: 30
    };
  
    if (searchTerm) params.search = searchTerm;
    
    // FIXED: Accurate filter parameters for API
    if (filters.classroom) params.classroom = filters.classroom;
    if (filters.grade) params.grade = filters.grade;
    if (filters.gender) {
      if (filters.gender === 'L') params.gender = 'male';
      else if (filters.gender === 'P') params.gender = 'female';
      else params.gender = filters.gender;
    }
    if (filters.screeningStatus) params.screeningStatus = filters.screeningStatus;
    
    // FIXED: Counseling status - accurate mapping
    if (filters.counselingStatus !== null) {
      // filters.counselingStatus: true = sudah konseling, false = belum konseling
      // API expects: "1" = sudah konseling, "0" = belum konseling
      params.counselingStatus = filters.counselingStatus ? '1' : '0';
    }
    
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
      
      if (config.key === 'iqScore') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return aValue - bValue;
      }
      
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });
    
    if (config.direction === 'descending') {
      sorted.reverse();
    }
    
    return sorted;
  };

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['infiniteStudents', searchTerm, filters],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const params = { 
          ...buildFilterParams(), 
          page: pageParam 
        };
        
        const response = await api.organization.school.getStudents(params);
        
        return { 
          data: response.data?.students || [], 
          metadata: response.metadata || {
            totalData: 0,
            totalPage: 1,
            page: pageParam,
            limit: 30,
            hasNextPage: false,
            byGender: { male: 0, female: 0 }
          },
          pageParam 
        };
      } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.metadata && lastPage.metadata.hasNextPage) {
        return lastPage.metadata.page + 1;
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return api.organization.school.updateStudent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['infiniteStudents']);
    },
    onError: (error) => {
      console.error("Error updating student:", error);
    }
  });
  
  const allStudents = infiniteQuery.data?.pages.flatMap(page => page.data) || [];
  const sortedStudents = sortData(allStudents, sortConfig);
  const metadata = infiniteQuery.data?.pages[0]?.metadata;
  const genderCounts = metadata?.byGender || { male: 0, female: 0 };

  return {
    students: sortedStudents,
    totalData: metadata?.totalData || 0,
    genderCounts,
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
        const response = await api.students.getAcademicInfo();
        
        const classrooms = response?.data?.classrooms || [];
        const gradesResult = response?.data?.grades || [];
        
        const classNumbers = new Set();
        classrooms.forEach(classroom => {
          const parts = classroom.split('-');
          if (parts.length > 1) {
            const classNumber = parts.slice(1).join('-');
            if (classNumber) {
              classNumbers.add(classNumber);
            }
          }
        });
        
        return {
          gradesResult,
          classNumbers: Array.from(classNumbers),
          classrooms
        };
      } catch (error) {
        console.error("Error in useClassrooms:", error);
        throw error;
      }
    },
    retry: 2
  });
};
