// src/hooks/useDashboardMetrics.js - Updated to use useAuth
import { useQuery } from "@tanstack/react-query"
import api, { dashboardEndpoints } from "../lib/api"

/**
 * Hook for fetching dashboard metrics for both students and employees
 * @param {string} type - 'student' or 'employee'
 * @param {Object} filters - Filter parameters (year, classroom, grade, department, etc.)
 */
export const useDashboardMetrics = (type = "student", filters = {}) => {
  return useQuery({
    queryKey: ["dashboardMetrics", type, filters],
    queryFn: async () => {
      try {
        let response

        if (type === "student") {
          // Use the students metrics endpoint with filters
          response = await dashboardEndpoints.dashboard.getStudentMetrics(filters)
        } else {
          // Use the employees metrics endpoint with filters
          response = await dashboardEndpoints.dashboard.getEmployeeMetrics(filters)
        }

        return (
          response.data || {
            summary: {
              atRisk: { count: 0, total: 0 },
              notScreened: { count: 0, total: 0 },
              notCounseled: { count: 0, total: 0 },
            },
            mentalHealth: {
              overall: { atRisk: 0, monitored: 0, stable: 0, notScreened: 0 },
              byMonth: [],
            },
            status: {
              screening: { completed: 0, notCompleted: 0 },
              counseling: { completed: 0, notCompleted: 0 },
            },
          }
        )
      } catch (error) {
        console.error(`Error fetching ${type} dashboard metrics:`, error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}

/**
 * Hook for fetching dashboard tab data (students/employees list)
 * @param {string} type - 'student' or 'employee'
 * @param {string} tabType - 'at_risk', 'not_screened', 'not_counseled'
 * @param {Object} params - Additional query parameters
 */
export const useDashboardTabData = (type = "student", tabType = "at_risk", params = {}) => {
  return useQuery({
    queryKey: ["dashboardTabData", type, tabType, params],
    queryFn: async () => {
      try {
        let response

        if (type === "student") {
          response = await dashboardEndpoints.dashboard.getStudentTabData(tabType, params)
        } else {
          response = await dashboardEndpoints.dashboard.getEmployeeTabData(tabType, params)
        }

        return response
      } catch (error) {
        console.error(`Error fetching ${type} tab data for ${tabType}:`, error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  })
}
