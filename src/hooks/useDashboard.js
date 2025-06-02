// src/hooks/useDashboard.js - With proper error handling
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "./useAuth"
import { apiClient } from "../lib/api"
import { useState, useEffect } from "react"

/**
 * Hook untuk dashboard metrics data dengan filtering dan error handling
 */
export const useDashboardMetrics = (type = "student", filters = {}) => {
  const { user } = useAuth()
  const [errorMessage, setErrorMessage] = useState(null)

  // Reset error message when filters change
  useEffect(() => {
    setErrorMessage(null)
  }, [filters])

  return useQuery({
    queryKey: ["dashboardMetrics", type, filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        
        // Always include year (required parameter)
        params.append("year", filters.year || "2025")

        if (type === "student") {
          // For students, we need classroom and grade
          if (!filters.classroom || !filters.grade) {
            throw new Error("Classroom and grade are required for student metrics")
          }
          
          params.append("classroom", filters.classroom)
          params.append("grade", filters.grade)
          
          const res = await apiClient.get(`/students/metrics?${params}`)
          
          // Check for API error response
          if (res.data.status === "fail") {
            setErrorMessage(res.data.message)
            throw new Error(res.data.message)
          }
          
          return res.data
        } else {
          // For employees, we need department
          if (!filters.department) {
            throw new Error("Department is required for employee metrics")
          }
          
          params.append("department", filters.department)
          
          const res = await apiClient.get(`/employees/metrics?${params}`)
          
          // Check for API error response
          if (res.data.status === "fail") {
            setErrorMessage(res.data.message)
            throw new Error(res.data.message)
          }
          
          return res.data
        }
      } catch (error) {
        // Log the error for debugging
        console.error(`Error fetching ${type} metrics:`, error)
        
        // Set error message
        setErrorMessage(error.message || "Failed to fetch dashboard data")
        
        // Rethrow the error to be caught by React Query
        throw error
      }
    },
    // Provide default fallback data matching expected structure
    placeholderData: {
      status: "success",
      data: {
        summary: {
          atRisk: { count: 0, total: 0 },
          notScreened: { count: 0, total: 0 },
          notCounseled: { count: 0, total: 0 }
        },
        mentalHealth: {
          overall: { atRisk: 0, monitored: 0, stable: 0, notScreened: 0 },
          byMonth: []
        },
        status: {
          screening: { completed: 0, notCompleted: 0 },
          counseling: { completed: 0, notCompleted: 0 }
        }
      },
      message: "Loading dashboard metrics..."
    },
    retry: (failureCount, error) => {
      // Don't retry if we got a specific error from the API
      if (error.message?.includes("required")) {
        return false
      }
      // Otherwise retry up to 2 times
      return failureCount < 2
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
        
        if (res.data.status === "fail") {
          throw new Error(res.data.message)
        }
        
        return res.data
      } catch (error) {
        console.error("Error fetching academic info:", error)
        throw error
      }
    },
    placeholderData: {
      status: "success",
      data: {
        classrooms: ["X", "XI", "XII"],
        grades: ["A", "B", "C", "D"]
      },
      message: "Loading academic info..."
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
        
        if (res.data.status === "fail") {
          throw new Error(res.data.message)
        }
        
        return res.data
      } catch (error) {
        console.error("Error fetching employee roles:", error)
        throw error
      }
    },
    placeholderData: {
      status: "success",
      data: {
        departments: ["Engineering", "Marketing", "Operations", "Creative", "Finance", "Human Resources", "Sales", "IT"],
        positions: ["Coordinator", "Engineer", "Analyst", "Manager", "Developer", "Assistant", "Specialist", "Staff", "Head"]
      },
      message: "Loading employee roles..."
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Hook untuk dashboard tab data (student / employee)
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  return useQuery({
    queryKey: ["dashboardTabData", type, tabType, params],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams()

        // Map tab types to API parameters
        if (tabType === "at_risk") {
          queryParams.append("screeningStatus", "at_risk")
        } else if (tabType === "not_screened") {
          queryParams.append("screeningStatus", "not_screened")
        } else if (tabType === "not_counseled") {
          queryParams.append("counselingStatus", "false")
        }

        // Add additional parameters
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null) queryParams.append(key, val)
        })

        const endpoint = type === "student" ? "/organizations/students" : "/organizations/employees"
        const res = await apiClient.get(`${endpoint}?${queryParams}`)
        
        if (res.data.status === "fail") {
          throw new Error(res.data.message)
        }
        
        return res.data
      } catch (error) {
        console.error(`Error fetching ${type} tab data:`, error)
        throw error
      }
    },
    placeholderData: {
      status: "success",
      data: {
        students: [],
        employees: []
      },
      metadata: {
        totalData: 0,
        totalPage: 0,
        page: 1,
        limit: 10,
        hasNextPage: false
      },
      message: "Loading tab data..."
    },
    enabled: !!tabType // Only run query when tab type is specified
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
    // Extract metrics from the response and provide fallbacks
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
          departments: optionsQuery.data?.data?.departments || ["Finance", "Engineering", "Marketing", "Operations", "Creative", "Human Resources", "Sales", "IT"]
        },
    
    // Pass through loading and error states
    isLoading: metricsQuery.isLoading || optionsQuery.isLoading,
    isError: metricsQuery.isError || optionsQuery.isError,
    error: metricsQuery.error || optionsQuery.error,
    errorMessage: metricsQuery.error?.message || optionsQuery.error?.message,
    
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