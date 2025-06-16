// src/hooks/useDashboardMetrics.js

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { apiClient } from "../lib/api"
import { getCurrentDateInfo } from "@/lib/date"

/**
 * Hook for fetching dashboard metrics (monthly stats)
 */
export const useDashboardMetrics = (type = "student") => {
  const currentDate = getCurrentDateInfo()
  
  return useQuery({
    queryKey: ["dashboardMetrics", type, currentDate.yearMonth],
    queryFn: async () => {
      const endpoint = type === "student" 
        ? "/students/metrics/monthly-stats"
        : "/employees/metrics/monthly-stats"
      
      const res = await apiClient.get(endpoint)
      return res.data
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1,
    retry: false,
  })
}

/**
 * Hook for fetching yearly stats for bar chart
 */
export const useYearlyStats = (type = "student", filters = {}) => {
  const currentDate = getCurrentDateInfo()
  
  return useQuery({
    queryKey: ["yearlyStats", type, filters, currentDate.year],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("year", filters.year || currentDate.year)

      if (type === "student") {
        if (filters.classroom) params.append("classroom", filters.classroom)
        if (filters.grade) params.append("grade", filters.grade)
        const res = await apiClient.get(`/students/metrics/yearly-stats?${params}`)
        return res.data
      } else {
        if (filters.department) params.append("department", filters.department)
        const res = await apiClient.get(`/employees/metrics/yearly-stats?${params}`)
        return res.data
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })
}

/**
 * Hook for fetching dashboard tab data (organizations endpoint)
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  const currentDate = getCurrentDateInfo()
  const { enabled = true, limit = 20 } = params

  return useInfiniteQuery({
    queryKey: ["dashboardTabData", type, tabType, currentDate.yearMonth],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams()
      
      queryParams.append("year", currentDate.year)
      queryParams.append("month", currentDate.month)
      queryParams.append("page", pageParam.toString())
      queryParams.append("limit", limit.toString())

      // Map tab types to API parameters
      if (tabType === "at_risk") {
        queryParams.append("screeningStatus", "at_risk")
      } else if (tabType === "not_screened") {
        queryParams.append("screeningStatus", "not_screened")
      } else if (tabType === "not_counseled") {
        queryParams.append("counselingStatus", "1")
      }

      const endpoint = type === "student" 
        ? "/organizations/students/period"
        : "/organizations/employees/period"
      
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
    },
    getNextPageParam: (lastPage) => {
      return lastPage.metadata?.hasNextPage ? lastPage.metadata.page + 1 : undefined
    },
    enabled: enabled,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })
}

/**
 * Hook for fetching academic info (classrooms, grades)
 */
export const useAcademicInfo = () => {
  return useQuery({
    queryKey: ["academicInfo"],
    queryFn: async () => {
      const res = await apiClient.get("/students/academic-info")
      return res.data
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
      const res = await apiClient.get("/employees/roles")
      return res.data
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
 * Main dashboard hook - combines metrics and options
 */
export const useDashboard = (type = "student") => {
  const currentDate = getCurrentDateInfo()
  
  const metricsQuery = useDashboardMetrics(type)
  const yearlyQuery = useYearlyStats(type, {
    year: currentDate.year,
    ...(type === "student" 
      ? { classroom: "X", grade: "A" }
      : { department: "Finance" }),
  })
  const optionsQuery = type === "student" ? useAcademicInfo() : useEmployeeRoles()

  const processedMetrics = useMemo(() => {
    const data = metricsQuery.data?.data
    if (!data) {
      return {
        summary: {
          atRisk: { count: 0, total: 0 },
          notScreened: { count: 0, total: 0 },
          notCounseled: { count: 0, total: 0 },
        },
        status: {
          screening: { completed: 0, notCompleted: 0 },
          counseling: { completed: 0, notCompleted: 0 },
        }
      }
    }

    return {
      summary: data.summary,
      status: data.status,
      mentalHealth: {
        overall: {
          atRisk: data.summary?.atRisk?.count || 0,
          monitored: 0,
          stable: (data.summary?.atRisk?.total || 0) - (data.summary?.atRisk?.count || 0),
          notScreened: data.summary?.notScreened?.count || 0,
        },
        byMonth: {
          firstHalf: (yearlyQuery.data?.data || []).filter(item => 
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].includes(item.month)
          ),
          secondHalf: (yearlyQuery.data?.data || []).filter(item => 
            ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].includes(item.month)
          ),
        }
      }
    }
  }, [metricsQuery.data, yearlyQuery.data])

  return {
    metrics: processedMetrics,
    options: type === "student"
      ? { 
          classrooms: optionsQuery.data?.data?.classrooms || optionsQuery.placeholderData?.data?.classrooms || [], 
          grades: optionsQuery.data?.data?.grades || optionsQuery.placeholderData?.data?.grades || [] 
        }
      : { 
          departments: optionsQuery.data?.data?.departments || optionsQuery.placeholderData?.data?.departments || [], 
          positions: optionsQuery.data?.data?.positions || optionsQuery.placeholderData?.data?.positions || [] 
        },
    isLoading: metricsQuery.isLoading || yearlyQuery.isLoading || optionsQuery.isLoading,
    isError: metricsQuery.isError || yearlyQuery.isError || optionsQuery.isError,
    error: metricsQuery.error || yearlyQuery.error || optionsQuery.error,
    refetch: () => {
      metricsQuery.refetch()
      yearlyQuery.refetch()
      optionsQuery.refetch()
    },
    currentFilters: {
      year: currentDate.year,
      month: currentDate.month,
    },
    currentDate,
  }
}