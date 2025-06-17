// src/hooks/useDashboard.js - Fixed tab data hook
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "./useAuth"
import { apiClient } from "../lib/api"

/**
 * Hook untuk dashboard metrics data - with proper error handling for required parameters
 */
export const useDashboardMetrics = (type = "student", filters = {}) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["dashboardMetrics", type, filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        
        // Always include year (required parameter)
        params.append("year", filters.year || "2025")

        if (type === "student") {
          // For students, we need classroom and grade
          if (!filters.classroom) {
            throw new Error("Classroom parameter is required")
          }
          if (!filters.grade) {
            throw new Error("Grade parameter is required")
          }
          
          params.append("classroom", filters.classroom)
          params.append("grade", filters.grade)
          
          const res = await apiClient.get(`/students/metrics?${params}`)
          return res.data
        } else {
          // For employees, we need department
          if (!filters.department) {
            throw new Error("Department parameter is required")
          }
          
          params.append("department", filters.department)
          
          const res = await apiClient.get(`/employees/metrics?${params}`)
          return res.data
        }
      } catch (error) {
        console.error(`Error fetching ${type} metrics:`, error)
        throw error
      }
    },
    // Don't retry on validation errors (missing params)
    retry: (failureCount, error) => {
      if (error.message?.includes("required")) {
        return false
      }
      return failureCount < 3
    }
  })
}

/**
 * Hook untuk academic info (khusus student)
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
        throw error
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Hook untuk employee roles (departments, positions)
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
        throw error
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * FIXED: Hook untuk dashboard tab data (student / employee)
 * This version correctly handles the counselingStatus parameter
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  // Only enable the query when tabType is valid and we're showing the tab
  const isEnabled = !!tabType
  
  return useQuery({
    queryKey: ["dashboardTabData", type, tabType, params],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams()

        // Map tab types to API parameters - FIXED string values
        if (tabType === "at_risk") {
          queryParams.append("screeningStatus", "at_risk")
        } else if (tabType === "not_screened") {
          queryParams.append("screeningStatus", "not_screened")
        } else if (tabType === "not_counseled") {
          // FIXED: Use "0" instead of boolean "false" for API compatibility
          queryParams.append("counselingStatus", "0")
        }

        // Add additional parameters
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null) queryParams.append(key, val)
        })

        const endpoint = type === "student" ? "/organizations/students" : "/organizations/employees"
        const res = await apiClient.get(`${endpoint}?${queryParams}`)
        return res.data
      } catch (error) {
        console.error(`Error fetching ${type} tab data:`, error)
        throw error
      }
    },
    enabled: isEnabled,
    // Don't retry bad requests
    retry: (failureCount, error) => {
      if (error.response?.status === 400) {
        return false
      }
      return failureCount < 2
    }
  })
}

/**
 * Main dashboard hook - combines metrics and options
 */
export const useDashboard = (type = "student", filters = {}) => {
  const { user } = useAuth()
  
  // Determine entity type - use explicit parameter first, then fallback to user organization type
  const entityType = type || (user?.organization?.type === "company" ? "employee" : "student")

  // Set appropriate default filters based on entity type
  const defaultFilters = {
    year: "2025", // As mentioned in your API example
    ...(entityType === "student" 
      ? { classroom: filters.classroom || "X", grade: filters.grade || "A" } 
      : { department: filters.department || "Finance" }),
  }
  
  // Get metrics data
  const metricsQuery = useDashboardMetrics(entityType, defaultFilters)
  
  // Get options data (classrooms/grades or departments/positions)
  const optionsQuery = entityType === "student" 
    ? useAcademicInfo() 
    : useEmployeeRoles()

  // Return combined data with safe defaults
  return {
    // Extract metrics from the response with proper data structure
    metrics: metricsQuery.data?.data || {
      summary: { atRisk: { count: 0, total: 0 }, notScreened: { count: 0, total: 0 }, notCounseled: { count: 0, total: 0 } },
      mentalHealth: { overall: { atRisk: 0, monitored: 0, stable: 0, notScreened: 0 }, byMonth: [] },
      status: { screening: { completed: 0, notCompleted: 0 }, counseling: { completed: 0, notCompleted: 0 } }
    },
    
    // Extract options with proper data structure
    options: entityType === "student"
      ? { 
          classrooms: optionsQuery.data?.data?.classrooms || ["X", "XI", "XII"], 
          grades: optionsQuery.data?.data?.grades || ["A", "B", "C", "D"] 
        }
      : { 
          departments: optionsQuery.data?.data?.departments || ["Finance", "Engineering", "Marketing"], 
          positions: optionsQuery.data?.data?.positions || ["Manager", "Staff", "Coordinator"] 
        },
    
    // Pass through loading and error states
    isLoading: metricsQuery.isLoading || optionsQuery.isLoading,
    isError: metricsQuery.isError || optionsQuery.isError,
    error: metricsQuery.error || optionsQuery.error,
    
    // Provide refetch functionality
    refetch: () => {
      metricsQuery.refetch()
      optionsQuery.refetch()
    },
    
    // Additional context
    currentFilters: defaultFilters,
    user,
  }
}