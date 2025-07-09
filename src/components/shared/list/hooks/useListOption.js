// src/components/list/hooks/useListOptions.js
import { useQuery } from "@tanstack/react-query"
import { studentListService, employeeListService } from "../services/listApiService"

/**
 * Hook for fetching list options (classrooms, departments, etc.)
 * @param {string} type - List type
 * @returns {Object} Options data
 */
export const useListOptions = (type) => {
  return useQuery({
    queryKey: [`${type}Options`],
    queryFn: async () => {
      if (type === "student") {
        const response = await studentListService.getAcademicInfo()
        return {
          classrooms: response.data?.classrooms || [],
          grades: response.data?.grades || []
        }
      } else {
        const response = await employeeListService.getDepartments()
        return {
          departments: response.departments || [],
          positions: response.positions || []
        }
      }
    },
  })
}