// src/hooks/useDashboardMetrics.js (REFACTORED for efficiency - FINAL VERSION)

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { apiClient } from "../lib/api"
import { getCurrentDateInfo } from "@/lib/date"

// Helper function untuk handle empty data response
const handleEmptyDataResponse = (type) => {
  const defaultEmptyData = {
    summary: {
      atRisk: { count: 0, total: 0 },
      notScreened: { count: 0, total: 0 },
      notCounseled: { count: 0, total: 0 },
    },
    status: {
      screening: { completed: 0, notCompleted: 0 },
      counseling: { completed: 0, notCompleted: 0 },
    },
    mentalHealth: {
      overall: { atRisk: 0, monitored: 0, stable: 0 },
    },
  };

  if (type === "yearly") {
    return { status: "success", data: [] };
  } else if (type === "tabData") {
    return {
      status: "success",
      data: {
        students: [],
        employees: [],
        metadata: { totalData: 0, hasNextPage: false, page: 1, limit: 10 },
      },
      pageParam: 1,
    };
  }
  return { status: "success", data: defaultEmptyData };
};

/**
 * [MODIFIED] Hook for fetching ALL dashboard summary data from a SINGLE endpoint.
 */
export const useDashboardMetrics = (type = "student") => {
  const currentDate = getCurrentDateInfo()

  return useQuery({
    queryKey: ["dashboardMainMetrics", type, currentDate.yearMonth],
    queryFn: async () => {
      const endpoint = type === "student" ? "/students/metrics/monthly-stats" : "/employees/metrics/monthly-stats"
      try {
        const res = await apiClient.get(endpoint)
        if (res.data?.status === "fail" || !res.data?.data) {
          return handleEmptyDataResponse("monthly");
        }
        return res.data
      } catch (error) {
        if (error.response?.status === 404) {
          return handleEmptyDataResponse("monthly");
        }
        throw error
      }
    },
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: { data: handleEmptyDataResponse("monthly").data }
  })
}

/**
 * Hook for fetching yearly stats for bar chart.
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
        params.append("classroom", filters.classroom || "X")
        params.append("grade", filters.grade || "A")
      } else {
        params.append("department", filters.department || "Finance")
      }

      try {
        const res = await apiClient.get(`${endpointPath}?${params}`)
        if (res.data?.status === "fail" || !res.data?.data) {
          return handleEmptyDataResponse("yearly");
        }
        return res.data
      } catch (error) {
        if (error.response?.status === 404) {
          return handleEmptyDataResponse("yearly");
        }
        throw error
      }
    },
    refetchOnWindowFocus: false,
    retry: false,
  })
}

/**
 * Hook for fetching dashboard tab data (infinite scroll).
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
        if (res.data?.status === "fail" || !res.data?.data) {
          return handleEmptyDataResponse("tabData");
        }
        return {
          data: res.data?.data || { students: [], employees: [] },
          metadata: res.data?.data?.metadata || { totalData: 0, hasNextPage: false, page: pageParam, limit },
          pageParam,
        }
      } catch (error) {
        if (error.response?.status === 404) {
          return handleEmptyDataResponse("tabData");
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
 * Hook for fetching academic info (classrooms, grades).
 * THIS MUST EXIST IN THE FILE.
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
 * Hook for fetching employee roles (departments, positions).
 * THIS MUST EXIST IN THE FILE.
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
 * [REFACTORED] Main dashboard hook - SIMPLIFIED AND EFFICIENT.
 */
export const useDashboard = (type = "student") => {
  const currentDate = getCurrentDateInfo()

  const mainMetricsQuery = useDashboardMetrics(type)
  const yearlyQuery = useYearlyStats(type, {})
  const optionsQuery = type === "student" ? useAcademicInfo() : useEmployeeRoles()

  const processedMetrics = useMemo(() => {
    const data = mainMetricsQuery.data?.data || handleEmptyDataResponse("monthly").data;
    
    // Ensure all nested properties exist to prevent downstream errors
    const safeData = {
      summary: data.summary || { atRisk: {}, notScreened: {}, notCounseled: {} },
      status: data.status || { screening: {}, counseling: {} },
      mentalHealth: {
        ...(data.mentalHealth || {}),
        overall: data.mentalHealth?.overall || { atRisk: 0, monitored: 0, stable: 0 },
        byMonth: data.mentalHealth?.byMonth || { firstHalf: [], secondHalf: [] }
      }
    };

    return safeData;

  }, [mainMetricsQuery.data]);

  const allQueries = [mainMetricsQuery, yearlyQuery, optionsQuery];

  return {
    metrics: processedMetrics,
    options:
      type === "student"
        ? {
            classrooms: optionsQuery.data?.data?.classrooms || [],
            grades: optionsQuery.data?.data?.grades || [],
          }
        : {
            departments: optionsQuery.data?.data?.departments || [],
            positions: optionsQuery.data?.data?.positions || [],
          },
    isLoading: allQueries.some(q => q.isLoading),
    isError: allQueries.some(q => q.isError),
    error: allQueries.find(q => q.error)?.error,
    refetch: () => {
      allQueries.forEach(q => q.refetch());
    },
    currentDate,
  }
}