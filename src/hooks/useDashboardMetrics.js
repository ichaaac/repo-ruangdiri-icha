// src/hooks/useDashboardMetrics.js

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { apiClient } from "../lib/api"
import { getCurrentDateInfo } from "@/lib/date"

/**
 * Hook for fetching metric cards data using organizations/period endpoint
 * This also provides the totalData for metric cards
 */
export const useMetricCardsData = (type = "student") => {
  const currentDate = getCurrentDateInfo()
  
  // Fetch each metric separately to get totalData for cards
  const atRiskQuery = useQuery({
    queryKey: ["metricCards", type, "at_risk", currentDate.yearMonth],
    queryFn: async () => {
      if (type === "student") {
        const res = await apiClient.get(`/organizations/students/period?page=1&limit=10&month=${currentDate.month}&year=${currentDate.year}&screeningStatus=at_risk`)
        return res.data
      } else {
        const res = await apiClient.get(`/organizations/employees/period?page=1&limit=10&month=${currentDate.month}&year=${currentDate.year}&screeningStatus=at_risk`)
        return res.data
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1,
    retry: false,
  })

  const notScreenedQuery = useQuery({
    queryKey: ["metricCards", type, "not_screened", currentDate.yearMonth],
    queryFn: async () => {
      if (type === "student") {
        const res = await apiClient.get(`/organizations/students/period?page=1&limit=10&month=${currentDate.month}&year=${currentDate.year}&screeningStatus=not_screened`)
        return res.data
      } else {
        const res = await apiClient.get(`/organizations/employees/period?page=1&limit=10&month=${currentDate.month}&year=${currentDate.year}&screeningStatus=not_screened`)
        return res.data
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1,
    retry: false,
  })

  const notCounseledQuery = useQuery({
    queryKey: ["metricCards", type, "not_counseled", currentDate.yearMonth],
    queryFn: async () => {
      if (type === "student") {
        const res = await apiClient.get(`/organizations/students/period?page=1&limit=10&month=${currentDate.month}&year=${currentDate.year}&counselingStatus=0`)
        return res.data
      } else {
        const res = await apiClient.get(`/organizations/employees/period?page=1&limit=10&month=${currentDate.month}&year=${currentDate.year}&counselingStatus=0`)
        return res.data
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1,
    retry: false,
  })

  return {
    atRisk: {
      count: atRiskQuery.data?.data?.metadata?.totalData || 0,
      total: atRiskQuery.data?.data?.metadata?.totalData || 0,
      data: atRiskQuery.data?.data?.students || atRiskQuery.data?.data?.employees || [],
      isLoading: atRiskQuery.isLoading,
      error: atRiskQuery.error
    },
    notScreened: {
      count: notScreenedQuery.data?.data?.metadata?.totalData || 0,
      total: notScreenedQuery.data?.data?.metadata?.totalData || 0,
      data: notScreenedQuery.data?.data?.students || notScreenedQuery.data?.data?.employees || [],
      isLoading: notScreenedQuery.isLoading,
      error: notScreenedQuery.error
    },
    notCounseled: {
      count: notCounseledQuery.data?.data?.metadata?.totalData || 0,
      total: notCounseledQuery.data?.data?.metadata?.totalData || 0,
      data: notCounseledQuery.data?.data?.students || notCounseledQuery.data?.data?.employees || [],
      isLoading: notCounseledQuery.isLoading,
      error: notCounseledQuery.error
    },
    refetch: () => {
      atRiskQuery.refetch()
      notScreenedQuery.refetch()
      notCounseledQuery.refetch()
    }
  }
}

/**
 * Hook for fetching pie charts data using monthly-stats endpoint
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
        // Wajib ada classroom dan grade
        const classroom = filters.classroom || "X"
        const grade = filters.grade || "A"
        params.append("classroom", classroom)
        params.append("grade", grade)
        const res = await apiClient.get(`/students/metrics/yearly-stats?${params}`)
        return res.data
      } else {
        // Wajib ada department
        const department = filters.department || "Finance"
        params.append("department", department)
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
 * Hook for fetching dashboard tab data (organizations endpoint with infinite scroll)
 * Reuses metric cards queries when possible to avoid duplicate fetching
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  const currentDate = getCurrentDateInfo()
  const { enabled = true, limit = 10 } = params

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
        queryParams.append("counselingStatus", "0")
      }

      const endpoint = type === "student" 
        ? "/organizations/students/period"
        : "/organizations/employees/period"
      
      const res = await apiClient.get(`${endpoint}?${queryParams}`)
      
      return {
        data: res.data?.data || { students: [], employees: [] },
        metadata: res.data?.data?.metadata || { 
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
 * Main dashboard hook - combines all metrics efficiently
 */
export const useDashboard = (type = "student") => {
  const currentDate = getCurrentDateInfo()
  
  // Use monthly-stats for both metric cards AND pie charts
  const monthlyStatsQuery = useDashboardMetrics(type)
  const yearlyQuery = useYearlyStats(type, {
    year: currentDate.year,
    ...(type === "student" 
      ? { classroom: "X", grade: "A" }
      : { department: "Finance" }),
  })
  const optionsQuery = type === "student" ? useAcademicInfo() : useEmployeeRoles()

  const processedMetrics = useMemo(() => {
    // Use monthly-stats data for both metric cards and pie charts
    const monthlyData = monthlyStatsQuery.data?.data
    
    console.log("=== DASHBOARD METRICS DEBUG ===")
    console.log("Monthly stats data:", monthlyData)
    
    if (!monthlyData) {
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

    const result = {
      // Metric cards use monthly-stats data
      summary: {
        atRisk: { 
          count: monthlyData.summary?.atRisk?.count || 0, 
          total: monthlyData.summary?.atRisk?.total || 0 
        },
        notScreened: { 
          count: monthlyData.summary?.notScreened?.count || 0, 
          total: monthlyData.summary?.notScreened?.total || 0 
        },
        notCounseled: { 
          count: monthlyData.summary?.notCounseled?.count || 0, 
          total: monthlyData.summary?.notCounseled?.total || 0 
        },
      },
      // Pie charts also use monthly-stats data
      status: monthlyData.status || {
        screening: { completed: 0, notCompleted: 0 },
        counseling: { completed: 0, notCompleted: 0 },
      },
      mentalHealth: {
        overall: {
          atRisk: monthlyData.summary?.atRisk?.count || 0,
          monitored: 0, // Not in API response
          stable: monthlyData.summary?.atRisk?.total ? (monthlyData.summary.atRisk.total - monthlyData.summary.atRisk.count) : 0,
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
    
    console.log("Final processed metrics:", result.summary)
    return result
  }, [monthlyStatsQuery.data, yearlyQuery.data])

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
    isLoading: monthlyStatsQuery.isLoading || yearlyQuery.isLoading || optionsQuery.isLoading,
    isError: monthlyStatsQuery.isError || yearlyQuery.isError || optionsQuery.isError,
    error: monthlyStatsQuery.error || yearlyQuery.error || optionsQuery.error,
    refetch: () => {
      monthlyStatsQuery.refetch()
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