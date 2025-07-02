// src/hooks/useDashboardMetrics.js

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { apiClient } from "../lib/api"
import { getCurrentDateInfo } from "@/lib/date"

/**
 * Hook for fetching pie charts data using monthly-stats endpoint
 */
export const useDashboardMetrics = (type = "student") => {
  const currentDate = getCurrentDateInfo()

  return useQuery({
    queryKey: ["dashboardMetrics", type, currentDate.yearMonth],
    queryFn: async () => {
      const endpoint = type === "student" ? "/students/metrics/monthly-stats" : "/employees/metrics/monthly-stats"

      try {
        const res = await apiClient.get(endpoint)

        // Handle "fail" status as empty data instead of error
        if (res.data?.status === "fail" && res.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: {
              status: {
                screening: { completed: 0, notCompleted: 0 },
                counseling: { completed: 0, notCompleted: 0 },
              },
            },
          }
        }

        return res.data
      } catch (error) {
        // If it's a 404 or similar, return empty data
        if (error.response?.status === 404 || error.response?.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: {
              status: {
                screening: { completed: 0, notCompleted: 0 },
                counseling: { completed: 0, notCompleted: 0 },
              },
            },
          }
        }
        throw error
      }
    },
    refetchOnWindowFocus: false,
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

      const endpointPath = type === "student" ? "/students/metrics/yearly-stats" : "/employees/metrics/yearly-stats"

      if (type === "student") {
        const classroom = filters.classroom || "X"
        const grade = filters.grade || "A"
        params.append("classroom", classroom)
        params.append("grade", grade)
      } else {
        const department = filters.department || "Finance"
        params.append("department", department)
      }

      try {
        const res = await apiClient.get(`${endpointPath}?${params}`)

        // Handle "fail" status as empty data
        if (res.data?.status === "fail" && res.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: [],
          }
        }

        return res.data
      } catch (error) {
        // If it's a 404 or similar, return empty data
        if (error.response?.status === 404 || error.response?.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: [],
          }
        }
        throw error
      }
    },
    refetchOnWindowFocus: false,
    retry: false,
  })
}

/**
 * Hook for fetching metric cards data using organizations/period endpoint
 * This provides unified data for both metric cards and tab navigation
 */
export const useMetricCardsData = (type = "student") => {
  const currentDate = getCurrentDateInfo()

  const endpoint = type === "student" ? "/organizations/students/period" : "/organizations/employees/period"

  const atRiskQuery = useQuery({
    queryKey: ["metricCards", type, "at_risk", currentDate.yearMonth],
    queryFn: async () => {
      try {
        const res = await apiClient.get(
          `${endpoint}?page=1&limit=1&month=${currentDate.month}&year=${currentDate.year}&screeningStatus=at_risk`,
        )

        // Handle "fail" status as empty data
        if (res.data?.status === "fail" && res.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: {
              [type === "student" ? "students" : "employees"]: [],
              metadata: { totalData: 0 },
            },
          }
        }

        return res.data
      } catch (error) {
        // If it's a 404 or similar, return empty data
        if (error.response?.status === 404 || error.response?.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: {
              [type === "student" ? "students" : "employees"]: [],
              metadata: { totalData: 0 },
            },
          }
        }
        throw error
      }
    },
    refetchOnWindowFocus: false,
    retry: false,
    keepPreviousData: true,
  })

  const notScreenedQuery = useQuery({
    queryKey: ["metricCards", type, "not_screened", currentDate.yearMonth],
    queryFn: async () => {
      try {
        const res = await apiClient.get(
          `${endpoint}?page=1&limit=1&month=${currentDate.month}&year=${currentDate.year}&screeningStatus=not_screened`,
        )

        // Handle "fail" status as empty data
        if (res.data?.status === "fail" && res.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: {
              [type === "student" ? "students" : "employees"]: [],
              metadata: { totalData: 0 },
            },
          }
        }

        return res.data
      } catch (error) {
        // If it's a 404 or similar, return empty data
        if (error.response?.status === 404 || error.response?.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: {
              [type === "student" ? "students" : "employees"]: [],
              metadata: { totalData: 0 },
            },
          }
        }
        throw error
      }
    },
    refetchOnWindowFocus: false,
    retry: false,
    keepPreviousData: true,
  })

  const notCounseledQuery = useQuery({
    queryKey: ["metricCards", type, "not_counseled", currentDate.yearMonth],
    queryFn: async () => {
      try {
        const res = await apiClient.get(
          `${endpoint}?page=1&limit=1&month=${currentDate.month}&year=${currentDate.year}&counselingStatus=0`,
        )

        // Handle "fail" status as empty data
        if (res.data?.status === "fail" && res.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: {
              [type === "student" ? "students" : "employees"]: [],
              metadata: { totalData: 0 },
            },
          }
        }

        return res.data
      } catch (error) {
        // If it's a 404 or similar, return empty data
        if (error.response?.status === 404 || error.response?.data?.message?.includes("No employees found")) {
          return {
            status: "success",
            data: {
              [type === "student" ? "students" : "employees"]: [],
              metadata: { totalData: 0 },
            },
          }
        }
        throw error
      }
    },
    refetchOnWindowFocus: false,
    retry: false,
    keepPreviousData: true,
  })

  return {
    atRisk: {
      count: atRiskQuery.data?.data?.metadata?.totalData || 0,
      total: atRiskQuery.data?.data?.metadata?.totalData || 0,
      data: atRiskQuery.data?.data?.students || atRiskQuery.data?.data?.employees || [],
      isLoading: atRiskQuery.isLoading,
      error: atRiskQuery.error,
    },
    notScreened: {
      count: notScreenedQuery.data?.data?.metadata?.totalData || 0,
      total: notScreenedQuery.data?.data?.metadata?.totalData || 0,
      data: notScreenedQuery.data?.data?.students || notScreenedQuery.data?.data?.employees || [],
      isLoading: notScreenedQuery.isLoading,
      error: notScreenedQuery.error,
    },
    notCounseled: {
      count: notCounseledQuery.data?.data?.metadata?.totalData || 0,
      total: notCounseledQuery.data?.data?.metadata?.totalData || 0,
      data: notCounseledQuery.data?.data?.students || notCounseledQuery.data?.data?.employees || [],
      isLoading: notCounseledQuery.isLoading,
      error: notCounseledQuery.error,
    },
    refetch: () => {
      atRiskQuery.refetch()
      notScreenedQuery.refetch()
      notCounseledQuery.refetch()
    },
  }
}

/**
 * Hook for fetching dashboard tab data (organizations endpoint with infinite scroll)
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  const currentDate = getCurrentDateInfo()
  const { enabled = true, limit = 10 } = params

  return useInfiniteQuery({
    queryKey: ["dashboardTabData", type, tabType, currentDate.yearMonth, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams()

      queryParams.append("year", currentDate.year)
      queryParams.append("month", currentDate.month)
      queryParams.append("page", pageParam.toString())
      queryParams.append("limit", limit.toString())

      if (tabType === "at_risk") {
        queryParams.append("screeningStatus", "at_risk")
      } else if (tabType === "not_screened") {
        queryParams.append("screeningStatus", "not_screened")
      } else if (tabType === "not_counseled") {
        queryParams.append("counselingStatus", "0")
      }

      const endpoint = type === "student" ? "/organizations/students/period" : "/organizations/employees/period"

      try {
        const res = await apiClient.get(`${endpoint}?${queryParams}`)

        // Handle "fail" status as empty data
        if (res.data?.status === "fail" && res.data?.message?.includes("No employees found")) {
          return {
            data: { students: [], employees: [] },
            metadata: {
              totalData: 0,
              hasNextPage: false,
              page: pageParam,
              limit,
            },
            pageParam,
          }
        }

        return {
          data: res.data?.data || { students: [], employees: [] },
          metadata: res.data?.data?.metadata || {
            totalData: 0,
            hasNextPage: false,
            page: pageParam,
            limit,
          },
          pageParam,
        }
      } catch (error) {
        // If it's a 404 or similar, return empty data
        if (error.response?.status === 404 || error.response?.data?.message?.includes("No employees found")) {
          return {
            data: { students: [], employees: [] },
            metadata: {
              totalData: 0,
              hasNextPage: false,
              page: pageParam,
              limit,
            },
            pageParam,
          }
        }
        throw error
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.metadata?.hasNextPage ? lastPage.metadata.page + 1 : undefined
    },
    enabled: enabled,
    refetchOnWindowFocus: false,
    retry: 2,
    keepPreviousData: true,
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
        grades: ["A", "B", "C", "D"],
      },
    },
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
        positions: ["Manager", "Staff", "Coordinator", "Head", "Specialist"],
      },
    },
  })
}

/**
 * Main dashboard hook - combines metric cards data with pie chart data
 */
export const useDashboard = (type = "student") => {
  const currentDate = getCurrentDateInfo()

  const metricCardsData = useMetricCardsData(type)
  const monthlyStatsQuery = useDashboardMetrics(type)
  const yearlyQuery = useYearlyStats(type, {
    year: currentDate.year,
    ...(type === "student" ? { classroom: "X", grade: "A" } : { department: "Finance" }),
  })
  const optionsQuery = type === "student" ? useAcademicInfo() : useEmployeeRoles()

  const processedMetrics = useMemo(() => {
    const monthlyData = monthlyStatsQuery.data?.data

    const totalStudentsEmployees =
      (metricCardsData.atRisk.count || 0) +
      (metricCardsData.notScreened.count || 0) +
      (metricCardsData.notCounseled.count || 0)

    return {
      summary: {
        atRisk: {
          count: metricCardsData.atRisk.count || 0,
          total: totalStudentsEmployees || 0,
        },
        notScreened: {
          count: metricCardsData.notScreened.count || 0,
          total: totalStudentsEmployees || 0,
        },
        notCounseled: {
          count: metricCardsData.notCounseled.count || 0,
          total: totalStudentsEmployees || 0,
        },
      },
      status: monthlyData?.status || {
        screening: { completed: 0, notCompleted: 0 },
        counseling: { completed: 0, notCompleted: 0 },
      },
      mentalHealth: {
        overall: {
          atRisk: metricCardsData.atRisk.count || 0,
          monitored: 0,
          stable: Math.max(0, totalStudentsEmployees - (metricCardsData.atRisk.count || 0)),
        },
        byMonth: {
          firstHalf: (yearlyQuery.data?.data || []).filter((item) =>
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].includes(item.month),
          ),
          secondHalf: (yearlyQuery.data?.data || []).filter((item) =>
            ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].includes(item.month),
          ),
        },
      },
    }
  }, [metricCardsData, monthlyStatsQuery.data, yearlyQuery.data])

  return {
    metrics: processedMetrics,
    options:
      type === "student"
        ? {
            classrooms: optionsQuery.data?.data?.classrooms || optionsQuery.placeholderData?.data?.classrooms || [],
            grades: optionsQuery.data?.data?.grades || optionsQuery.placeholderData?.data?.grades || [],
          }
        : {
            departments: optionsQuery.data?.data?.departments || optionsQuery.placeholderData?.data?.departments || [],
            positions: optionsQuery.data?.data?.positions || optionsQuery.placeholderData?.data?.positions || [],
          },
    isLoading:
      metricCardsData.atRisk.isLoading ||
      metricCardsData.notScreened.isLoading ||
      metricCardsData.notCounseled.isLoading ||
      monthlyStatsQuery.isLoading ||
      yearlyQuery.isLoading ||
      optionsQuery.isLoading,
    isError:
      metricCardsData.atRisk.error ||
      metricCardsData.notScreened.error ||
      metricCardsData.notCounseled.error ||
      monthlyStatsQuery.isError ||
      yearlyQuery.isError ||
      optionsQuery.isError,
    error:
      metricCardsData.atRisk.error ||
      metricCardsData.notScreened.error ||
      metricCardsData.notCounseled.error ||
      monthlyStatsQuery.error ||
      yearlyQuery.error ||
      optionsQuery.error,
    refetch: () => {
      metricCardsData.refetch()
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
