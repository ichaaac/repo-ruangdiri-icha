// src/hooks/useDashboardMetrics.js (UPDATED - Added "All" Option Support)

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
      // FIX: Tambahkan properti byMonth yang hilang agar struktur data konsisten
      byMonth: { firstHalf: [], secondHalf: [] }, 
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
 * Hook for fetching ALL dashboard summary data from monthly stats endpoint.
 * This data is used for MetricCards only.
 */
export const useDashboardMetrics = (type = "student") => {
  const currentDate = getCurrentDateInfo()

  return useQuery({
    queryKey: ["dashboardMainMetrics", type, currentDate.year, currentDate.month],
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
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: { data: handleEmptyDataResponse("monthly").data }
  })
}

/**
 * Hook for fetching yearly stats for bar chart.
 * UPDATED: Handle "All" option - don't send classroom/department filters when "All" is selected.
 */
export const useYearlyStats = (type = "student", filters = {}) => {
  const currentDate = getCurrentDateInfo()
  
  // UPDATED: Create stable filter values with "All" handling
  const stableFilters = useMemo(() => {
    const baseFilters = {
      year: currentDate.year,
      ...filters
    }
    
    if (type === "student") {
      return {
        ...baseFilters,
        classroom: filters.classroom === "All" ? undefined : (filters.classroom || "X"),
        grade: filters.grade === "All" ? undefined : (filters.grade || "A")
      }
    } else {
      return {
        ...baseFilters,
        department: filters.department === "All" ? undefined : (filters.department || "Finance")
      }
    }
  }, [type, filters.year, filters.classroom, filters.grade, filters.department, currentDate.year])

  return useQuery({
    queryKey: ["yearlyStats", type, stableFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("year", stableFilters.year)
      const endpointPath = type === "student" ? "/students/metrics/yearly-stats" : "/employees/metrics/yearly-stats"

      // UPDATED: Only add classroom/department params if they're not "All"
      if (type === "student") {
        if (stableFilters.classroom) {
          params.append("classroom", stableFilters.classroom)
        }
        if (stableFilters.grade) {
          params.append("grade", stableFilters.grade)
        }
      } else {
        if (stableFilters.department) {
          params.append("department", stableFilters.department)
        }
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
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // UPDATED: Enable query even when filters are "All"
    enabled: true,
  })
}

/**
 * Hook for fetching dashboard tab data (infinite scroll).
 * This is ONLY used for table/list data, NOT for MetricCard counts.
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  const currentDate = getCurrentDateInfo()
  const { enabled = true, limit = 10 } = params

  return useInfiniteQuery({
    queryKey: ["dashboardTabData", type, tabType, currentDate.year, currentDate.month, limit],
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
        // Not counseled - semua karyawan yang belum konseling
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
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
  })
}

/**
 * Hook for fetching academic info (classrooms, grades).
 */
export const useAcademicInfo = () => {
  return useQuery({
    queryKey: ["academicInfo"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/students/academic-info")
        if (res.data?.status === "fail" || !res.data?.data) {
          return {
            data: {
              classrooms: [],
              grades: [],
            },
          }
        }
        return res.data
      } catch (error) {
        if (error.response?.status === 404) {
          return {
            data: {
              classrooms: [],
              grades: [],
            },
          }
        }
        throw error
      }
    },
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    placeholderData: {
      data: {
        classrooms: [],
        grades: [],
      },
    },
  })
}

/**
 * Hook for fetching employee roles (departments, positions).
 */
export const useEmployeeRoles = () => {
  return useQuery({
    queryKey: ["employeeRoles"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/employees/roles")
        if (res.data?.status === "fail" || !res.data?.data) {
          return {
            data: {
              departments: [],
              positions: [],
            },
          }
        }
        return res.data
      } catch (error) {
        if (error.response?.status === 404) {
          return {
            data: {
              departments: [],
              positions: [],
            },
          }
        }
        throw error
      }
    },
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    placeholderData: {
      data: {
        departments: [],
        positions: [],
      },
    },
  })
}

/**
 * Hook for downloading PDF reports.
 * Handles both student and employee report downloads.
 */
export const usePdfReport = () => {
  const currentDate = getCurrentDateInfo()

  const downloadPdfReport = async (type = "student", reportType = "at_risk", params = {}) => {
    try {
      const baseEndpoint = type === "student" ? "/pdf/students/risk-report" : "/pdf/employees/risk-report"
      
      const queryParams = new URLSearchParams()
      const totalCount = params.totalCount || 1000 
      queryParams.append("page", "1")
      queryParams.append("limit", totalCount.toString())
      queryParams.append("month", params.month || currentDate.month)
      queryParams.append("year", params.year || currentDate.year)

      if (reportType === "at_risk") {
        queryParams.append("screeningStatus", "at_risk")
      } else if (reportType === "not_screened") {
        queryParams.append("screeningStatus", "not_screened")
      } else if (reportType === "not_counseled") {
        queryParams.append("counselingStatus", "0")
      }

      // UPDATED: Don't add classroom/department if they're "All"
      if (type === "student") {
        if (params.classroom && params.classroom !== "All") {
          queryParams.append("classroom", params.classroom)
        }
        if (params.grade && params.grade !== "All") {
          queryParams.append("grade", params.grade)
        }
      } else {
        if (params.department && params.department !== "All") {
          queryParams.append("department", params.department)
        }
      }

      const response = await apiClient.get(`${baseEndpoint}?${queryParams}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      const entityName = type === "student" ? "Siswa" : "Karyawan"
      const reportName = reportType === "at_risk" ? "Berisiko" : 
                        reportType === "not_screened" ? "Belum-Skrining" : "Belum-Konseling"
      const filename = `Laporan-${entityName}-${reportName}-${currentDate.monthName}-${currentDate.year}.pdf`
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true, filename }
    } catch (error) {
      console.error('Error downloading PDF report:', error)
      throw error
    }
  }

  return { downloadPdfReport }
}

/**
 * FIXED: Main dashboard hook - Stable dependencies and proper data flow.
 */
export const useDashboard = (type = "student") => {
  const currentDate = getCurrentDateInfo()

  const mainMetricsQuery = useDashboardMetrics(type)
  
  const optionsQuery = type === "student" ? useAcademicInfo() : useEmployeeRoles()

  const processedMetrics = useMemo(() => {
const data = {
  ...handleEmptyDataResponse("monthly").data,
  ...(mainMetricsQuery.data?.data || {})
}
    
    // Ensure all nested properties exist to prevent downstream errors
    const safeData = {
      summary: {
        atRisk: { count: 0, total: 0, ...(data.summary?.atRisk || {}) },
        notScreened: { count: 0, total: 0, ...(data.summary?.notScreened || {}) },
        notCounseled: { count: 0, total: 0, ...(data.summary?.notCounseled || {}) },
      },
      status: {
        screening: { completed: 0, notCompleted: 0, ...(data.status?.screening || {}) },
        counseling: { completed: 0, notCompleted: 0, ...(data.status?.counseling || {}) },
      },
      mentalHealth: {
        // --- PERUBAHAN DI SINI ---
        // SEBELUM: Mencari di `data.mentalHealth.overall` yang tidak ada
        // overall: { atRisk: 0, monitored: 0, stable: 0, ...(data.mentalHealth?.overall || {}) },

        // SESUDAH: Mengambil langsung dari `data.overall` sesuai struktur API
        overall: { atRisk: 0, monitored: 0, stable: 0, ...(data.overall || {}) },
        
        // Bagian byMonth ini kita asumsikan bisa jadi berasal dari `mentalHealth` di masa depan,
        // jadi kita biarkan saja, karena sudah ada fallback-nya.
        byMonth: data.mentalHealth?.byMonth || { firstHalf: [], secondHalf: [] }
      }
    };

    return safeData;

  }, [mainMetricsQuery.data]);

  const allQueries = [mainMetricsQuery, optionsQuery];

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