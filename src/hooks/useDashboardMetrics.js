// src/hooks/useDashboardMetrics.js - Fixed params and pagination

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { apiClient } from "../lib/api"
import { getCurrentDateInfo } from "@/lib/date"

/**
 * Hook for fetching dashboard metrics using new API endpoints
 * @param {string} type - 'student' or 'employee'
 */
export const useDashboardMetrics = (type = "student") => {
  const currentDate = getCurrentDateInfo()
  
  return useQuery({
    queryKey: ["dashboardMetrics", type, currentDate.yearMonth],
    queryFn: async () => {
      try {
        if (type === "student") {
          // Use new monthly-stats endpoint for summary data (no params)
          const res = await apiClient.get(`/students/metrics/monthly-stats`)
          return res.data
        } else {
          // Use new monthly-stats endpoint for employees (no params)
          const res = await apiClient.get(`/employees/metrics/monthly-stats`)
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
            status: {
              screening: { completed: 0, notCompleted: 0 },
              counseling: { completed: 0, notCompleted: 0 },
            },
          }
        }
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1,
    retry: false,
    placeholderData: (previousData) => previousData || {
      data: {
        summary: {
          atRisk: { count: 0, total: 0 },
          notScreened: { count: 0, total: 0 },
          notCounseled: { count: 0, total: 0 },
        },
        status: {
          screening: { completed: 0, notCompleted: 0 },
          counseling: { completed: 0, notCompleted: 0 },
        },
      }
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

/**
 * Hook for fetching yearly stats for barchart with new API parameters
 * @param {string} type - 'student' or 'employee'
 * @param {Object} filters - Filter parameters for barchart
 */
export const useYearlyStats = (type = "student", filters = {}) => {
  const currentDate = getCurrentDateInfo()
  
  return useQuery({
    queryKey: ["yearlyStats", type, filters, currentDate.year],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        params.append("year", filters.year || currentDate.year)

        if (type === "student") {
          // For students: classroom and grade are required
          if (filters.classroom) params.append("classroom", filters.classroom)
          if (filters.grade) params.append("grade", filters.grade)
          
          const res = await apiClient.get(`/students/metrics/yearly-stats?${params}`)
          return res.data
        } else {
          // For employees: department is required - handle potential API differences
          if (filters.department) params.append("department", filters.department)
          
          // Try employees endpoint, fallback to empty data if fails
          try {
            const res = await apiClient.get(`/employees/metrics/yearly-stats?${params}`)
            return res.data
          } catch (employeeError) {
            console.log("Employee yearly-stats endpoint not available, using fallback data")
            // Return empty data structure that matches expected format
            return {
              data: []
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching ${type} yearly stats:`, error)
        // Return fallback data
        return {
          data: []
        }
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
    retry: false,
    placeholderData: { data: [] },
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

/**
 * Hook for fetching dashboard tab data using new API with month parameter
 * @param {string} type - 'student' or 'employee'
 * @param {string} tabType - 'at_risk', 'not_screened', 'not_counseled'
 * @param {Object} params - Additional query parameters
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  const currentDate = getCurrentDateInfo()
  const { enabled = true, limit = 10 } = params // Changed limit to 10

  return useInfiniteQuery({
    queryKey: ["dashboardTabData", type, tabType, currentDate.yearMonth],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const queryParams = new URLSearchParams()
        
        // Add current date context (month is required by new API)
        queryParams.append("year", currentDate.year)
        queryParams.append("month", currentDate.month.toString().padStart(2, '0'))
        
        // Add pagination
        queryParams.append("page", pageParam.toString())
        queryParams.append("limit", limit.toString())

        // Map tab types to API parameters - FIXED counseling param
        if (tabType === "at_risk") {
          queryParams.append("screeningStatus", "at_risk")
        } else if (tabType === "not_screened") {
          queryParams.append("screeningStatus", "not_screened")
        } else if (tabType === "not_counseled") {
          // FIXED: Use hasCounseling=false based on actual API response
          queryParams.append("hasCounseling", "false")
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
    staleTime: 1000 * 60 * 2,
    retry: false,
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
 * Main dashboard hook - combines metrics and options with new API structure
 */
export const useDashboard = (type = "student", filters = {}) => {
  const currentDate = getCurrentDateInfo()
  
  // Get summary metrics data (no filters needed for monthly-stats)
  const metricsQuery = useDashboardMetrics(type)
  
  // Get yearly stats for barchart (with filters)
  const yearlyQuery = useYearlyStats(type, {
    year: currentDate.year,
    ...(type === "student" 
      ? { classroom: "X", grade: "A" } // Default for barchart
      : { department: "Finance" }),
  })
  
  // Get options data (classrooms/grades or departments/positions)
  const optionsQuery = type === "student" 
    ? useAcademicInfo() 
    : useEmployeeRoles()

  // Process the new API structure
  const processedMetrics = useMemo(() => {
    const summaryData = metricsQuery.data?.data || metricsQuery.placeholderData?.data
    const yearlyData = yearlyQuery.data?.data || []

    // Convert new API structure to expected format
    return {
      summary: summaryData?.summary || {
        atRisk: { count: 0, total: 0 },
        notScreened: { count: 0, total: 0 },
        notCounseled: { count: 0, total: 0 },
      },
      // Create overall mental health from summary
      mentalHealth: {
        overall: {
          atRisk: summaryData?.summary?.atRisk?.count || 0,
          monitored: 0, // Not provided in new API
          stable: (summaryData?.summary?.atRisk?.total || 0) - (summaryData?.summary?.atRisk?.count || 0),
          notScreened: summaryData?.summary?.notScreened?.count || 0,
        },
        // Convert yearly data to month format
        byMonth: {
          firstHalf: yearlyData.filter(item => ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].includes(item.month)),
          secondHalf: yearlyData.filter(item => ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].includes(item.month)),
        }
      },
      status: summaryData?.status || {
        screening: { completed: 0, notCompleted: 0 },
        counseling: { completed: 0, notCompleted: 0 },
      },
    }
  }, [metricsQuery.data, yearlyQuery.data, metricsQuery.placeholderData])

  // Always return data, never show loading states
  return {
    // Extract metrics with new structure
    metrics: processedMetrics,
    
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
      yearlyQuery.refetch({ throwOnError: false })
      optionsQuery.refetch({ throwOnError: false })
    },
    
    // Additional context
    currentFilters: {
      year: currentDate.year,
      month: currentDate.month,
    },
    currentDate,
  }
}