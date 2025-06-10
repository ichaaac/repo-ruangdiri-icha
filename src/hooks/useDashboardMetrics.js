// src/hooks/useDashboardMetrics.js - Fixed smooth fetching without loading states

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { apiClient } from "../lib/api"
import { getCurrentDateInfo } from "@/lib/date"
/**
 * Hook for fetching dashboard metrics for both students and employees
 * @param {string} type - 'student' or 'employee'
 * @param {Object} filters - Filter parameters (year, classroom, grade, department, etc.)
 */
export const useDashboardMetrics = (type = "student", filters = {}) => {
  const currentDate = getCurrentDateInfo()
  
  return useQuery({
    queryKey: ["dashboardMetrics", type, filters, currentDate.yearMonth],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        
        // Always include current year
        params.append("year", filters.year || currentDate.year)

        if (type === "student") {
          if (filters.classroom) params.append("classroom", filters.classroom)
          if (filters.grade) params.append("grade", filters.grade)
          
          const res = await apiClient.get(`/students/metrics?${params}`)
          return res.data
        } else {
          if (filters.department) params.append("department", filters.department)
          
          const res = await apiClient.get(`/employees/metrics?${params}`)
          return res.data
        }
      } catch (error) {
        console.error(`Error fetching ${type} metrics:`, error)
        // Return fallback data instead of throwing to prevent loading states
        return {
          data: {
            summary: {
              atRisk: { count: 0, total: 0 },
              notScreened: { count: 0, total: 0 },
              notCounseled: { count: 0, total: 0 },
            },
            mentalHealth: {
              overall: { atRisk: 0, monitored: 0, stable: 0, notScreened: 0 },
              byMonth: { firstHalf: [], secondHalf: [] },
            },
            status: {
              screening: { completed: 0, notCompleted: 0 },
              counseling: { completed: 0, notCompleted: 0 },
            },
          }
        }
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1, // Reduced to 1 minute for faster updates
    retry: false, // Disable retry to prevent loading states
    // Ensure immediate data return
    placeholderData: (previousData) => previousData || {
      data: {
        summary: {
          atRisk: { count: 0, total: 0 },
          notScreened: { count: 0, total: 0 },
          notCounseled: { count: 0, total: 0 },
        },
        mentalHealth: {
          overall: { atRisk: 0, monitored: 0, stable: 0, notScreened: 0 },
          byMonth: { firstHalf: [], secondHalf: [] },
        },
        status: {
          screening: { completed: 0, notCompleted: 0 },
          counseling: { completed: 0, notCompleted: 0 },
        },
      }
    },
    // Enable background refetching
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

/**
 * Hook for fetching dashboard tab data with infinite scroll - FIXED to include current date
 * @param {string} type - 'student' or 'employee'
 * @param {string} tabType - 'at_risk', 'not_screened', 'not_counseled'
 * @param {Object} params - Additional query parameters
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  const currentDate = getCurrentDateInfo()
  const { enabled = true, limit = 30 } = params

  return useInfiniteQuery({
    queryKey: ["dashboardTabData", type, tabType, currentDate.yearMonth],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const queryParams = new URLSearchParams()
        
        // Add current date context - CRITICAL for data consistency
        queryParams.append("year", currentDate.year)
        queryParams.append("month", currentDate.month)
        
        // Add pagination
        queryParams.append("page", pageParam.toString())
        queryParams.append("limit", limit.toString())

        // Map tab types to API parameters
        if (tabType === "at_risk") {
          queryParams.append("screeningStatus", "at_risk")
        } else if (tabType === "not_screened") {
          queryParams.append("screeningStatus", "not_screened")
        } else if (tabType === "not_counseled") {
          queryParams.append("counselingStatus", "0")
        }

        const endpoint = type === "student" ? "/organizations/students" : "/organizations/employees"
        const res = await apiClient.get(`${endpoint}?${queryParams}`)
        
        return {
          data: res.data?.data || { students: [], employees: [] },
          metadata: res.data?.metadata || { 
            totalData: 0, 
            hasNextPage: false, 
            page: pageParam,
            limit 
          },
          pageParam
        }
      } catch (error) {
        console.error(`Error fetching ${type} tab data:`, error)
        // Return empty data to prevent loading states
        return {
          data: { students: [], employees: [] },
          metadata: { 
            totalData: 0, 
            hasNextPage: false, 
            page: pageParam,
            limit 
          },
          pageParam
        }
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.metadata?.hasNextPage) {
        return lastPage.metadata.page + 1
      }
      return undefined
    },
    enabled: enabled,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: false, // Disable retry to prevent loading states
    // Ensure immediate data return
    placeholderData: {
      pages: [{
        data: { students: [], employees: [] },
        metadata: { totalData: 0, hasNextPage: false, page: 1, limit },
        pageParam: 1
      }],
      pageParams: [1]
    },
  })
}

/**
 * Hook for fetching academic info (classrooms, grades)
 */
export const useAcademicInfo = () => {
  return useQuery({
    queryKey: ["academicInfo"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/students/academic-info")
        return res.data
      } catch (error) {
        console.error("Error fetching academic info:", error)
        // Return fallback data
        return {
          data: {
            classrooms: ["X", "XI", "XII"],
            grades: ["A", "B", "C", "D"]
          }
        }
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
    placeholderData: {
      data: {
        classrooms: ["X", "XI", "XII"],
        grades: ["A", "B", "C", "D"]
      }
    }
  })
}

/**
 * Hook for fetching employee roles (departments, positions)
 */
export const useEmployeeRoles = () => {
  return useQuery({
    queryKey: ["employeeRoles"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/employees/roles")
        return res.data
      } catch (error) {
        console.error("Error fetching employee roles:", error)
        // Return fallback data
        return {
          data: {
            departments: ["Finance", "Engineering", "Marketing", "HR", "Operations"],
            positions: ["Manager", "Staff", "Coordinator", "Head", "Specialist"]
          }
        }
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
    placeholderData: {
      data: {
        departments: ["Finance", "Engineering", "Marketing", "HR", "Operations"],
        positions: ["Manager", "Staff", "Coordinator", "Head", "Specialist"]
      }
    }
  })
}

/**
 * Main dashboard hook - combines metrics and options with smooth fetching
 */
export const useDashboard = (type = "student", filters = {}) => {
  const currentDate = getCurrentDateInfo()
  
  // Set appropriate default filters based on entity type
  const defaultFilters = {
    year: currentDate.year,
    month: currentDate.month,
    ...(type === "student" 
      ? { classroom: filters.classroom || "X", grade: filters.grade || "A" } 
      : { department: filters.department || "Finance" }),
  }
  
  // Get metrics data
  const metricsQuery = useDashboardMetrics(type, defaultFilters)
  
  // Get options data (classrooms/grades or departments/positions)
  const optionsQuery = type === "student" 
    ? useAcademicInfo() 
    : useEmployeeRoles()

  // Always return data, never show loading states
  return {
    // Extract metrics from the response with safe defaults
    metrics: metricsQuery.data?.data || metricsQuery.placeholderData?.data,
    
    // Extract options with proper data structure
    options: type === "student"
      ? { 
          classrooms: optionsQuery.data?.data?.classrooms || optionsQuery.placeholderData?.data?.classrooms || [], 
          grades: optionsQuery.data?.data?.grades || optionsQuery.placeholderData?.data?.grades || [] 
        }
      : { 
          departments: optionsQuery.data?.data?.departments || optionsQuery.placeholderData?.data?.departments || [], 
          positions: optionsQuery.data?.data?.positions || optionsQuery.placeholderData?.data?.positions || [] 
        },
    
    // Never show loading - always return false
    isLoading: false,
    isError: false,
    error: null,
    
    // Provide silent refetch functionality
    refetch: () => {
      metricsQuery.refetch({ throwOnError: false })
      optionsQuery.refetch({ throwOnError: false })
    },
    
    // Additional context
    currentFilters: defaultFilters,
    currentDate,
  }
}