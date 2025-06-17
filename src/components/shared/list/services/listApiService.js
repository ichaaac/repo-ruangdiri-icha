// src/components/list/services/listApiService.js
import api from "@/lib/api"

/**
 * Base service for list operations
 */
class BaseListService {
  constructor(config) {
    this.config = config
  }

  /**
   * Build standardized query parameters
   * @param {Object} params - Raw parameters
   * @returns {Object} Formatted parameters
   */
  buildQueryParams(params = {}) {
    const formatted = {
      page: params.page || 1,
      limit: params.limit || this.config.defaultLimit || 30
    }

    if (params.search) {
      formatted.search = params.search
    }

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formatted[key] = value
        }
      })
    }

    return formatted
  }

  /**
   * Standardize API response
   * @param {Object} response - API response
   * @returns {Object} Standardized response
   */
  standardizeResponse(response) {
    return {
      data: response.data || [],
      metadata: response.metadata || {
        totalData: 0,
        totalPage: 1,
        page: 1,
        limit: this.config.defaultLimit || 30,
        hasNextPage: false,
        byGender: { male: 0, female: 0 }
      }
    }
  }
}

/**
 * Student list service
 */
export class StudentListService extends BaseListService {
  constructor() {
    super({ defaultLimit: 30 })
  }

  /**
   * Fetch students with parameters
   * @param {Object} params - Query parameters
   * @returns {Promise} Students data
   */
  async fetchStudents(params = {}) {
    try {
      const queryParams = this.buildStudentParams(params)
      const response = await api.organization.school.getStudents(queryParams)
      
      return {
        students: response.data?.students || [],
        metadata: response.metadata || {
          totalData: 0,
          totalPage: 1,
          page: 1,
          limit: 30,
          hasNextPage: false,
          byGender: { male: 0, female: 0 }
        }
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      throw error
    }
  }

  /**
   * Build student-specific parameters
   * @param {Object} params - Raw parameters
   * @returns {Object} Student API parameters
   */
  buildStudentParams(params = {}) {
    const baseParams = {
      page: params.page || 1,
      limit: params.limit || 30
    }

    if (params.search) {
      baseParams.search = params.search
    }

    if (params.filters) {
      const filterParams = this.buildStudentFilters(params.filters)
      return { ...baseParams, ...filterParams }
    }

    return baseParams
  }

  /**
   * Build student filter parameters
   * @param {Object} filters - Filter object
   * @returns {Object} API filter parameters
   */
  buildStudentFilters(filters) {
    const params = {}

    if (filters.classroom) params.classroom = filters.classroom
    if (filters.grade) params.grade = filters.grade
    if (filters.gender) {
      if (filters.gender === 'L') params.gender = 'male'
      else if (filters.gender === 'P') params.gender = 'female'
      else params.gender = filters.gender
    }
    if (filters.screeningStatus) params.screeningStatus = filters.screeningStatus
    if (filters.counselingStatus !== null && filters.counselingStatus !== undefined) {
      params.counselingStatus = filters.counselingStatus ? '1' : '0'
    }

    return params
  }

  /**
   * Update student
   * @param {string} studentId - Student ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated student
   */
  async updateStudent(studentId, data) {
    try {
      return await api.organization.school.updateStudent(studentId, data)
    } catch (error) {
      console.error(`Error updating student ${studentId}:`, error)
      throw error
    }
  }

  /**
   * Get academic info
   * @returns {Promise} Academic info
   */
  async getAcademicInfo() {
    try {
      return await api.students.getAcademicInfo()
    } catch (error) {
      console.error("Error fetching academic info:", error)
      return {
        status: "fallback",
        data: {
          classrooms: ["X", "XI", "XII"],
          grades: ["A", "B", "C", "D"]
        }
      }
    }
  }
}

/**
 * Employee list service
 */
export class EmployeeListService extends BaseListService {
  constructor() {
    super({ defaultLimit: 10 })
  }

  /**
   * Fetch employees with parameters
   * @param {Object} params - Query parameters
   * @returns {Promise} Employees data
   */
  async fetchEmployees(params = {}) {
    try {
      const queryParams = this.buildEmployeeParams(params)
      const response = await api.organization.company.getEmployees(queryParams)
      
      return {
        employees: response.data?.employees || [],
        metadata: response.metadata || {
          totalData: 0,
          totalPage: 1,
          page: 1,
          limit: 10,
          hasNextPage: false,
          byGender: { male: 0, female: 0 }
        }
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      throw error
    }
  }

  /**
   * Build employee-specific parameters
   * @param {Object} params - Raw parameters
   * @returns {Object} Employee API parameters
   */
  buildEmployeeParams(params = {}) {
    const baseParams = {
      page: params.page || 1,
      limit: params.limit || 10
    }

    if (params.search) {
      baseParams.search = params.search
    }

    if (params.filters) {
      const filterParams = this.buildEmployeeFilters(params.filters)
      return { ...baseParams, ...filterParams }
    }

    return baseParams
  }

  /**
   * Build employee filter parameters
   * @param {Object} filters - Filter object
   * @returns {Object} API filter parameters
   */
  buildEmployeeFilters(filters) {
    const params = {}

    if (filters.department) params.department = filters.department
    if (filters.position) params.position = filters.position
    if (filters.gender) {
      params.gender = filters.gender === "L" ? "male" : "female"
    }
    if (filters.screeningStatus) params.screeningStatus = filters.screeningStatus
    if (filters.counselingStatus !== null && filters.counselingStatus !== undefined) {
      params.counselingStatus = filters.counselingStatus ? "1" : "0"
    }

    return params
  }

  /**
   * Update employee
   * @param {string} employeeId - Employee ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated employee
   */
  async updateEmployee(employeeId, data) {
    try {
      return await api.organization.company.updateEmployee(employeeId, data)
    } catch (error) {
      console.error(`Error updating employee ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Get departments and positions
   * @returns {Promise} Organization data
   */
  async getDepartments() {
    try {
      const response = await api.organization.company.getDepartments()
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          const departments = response.data.map(item => item.department)
          const allPositions = response.data.flatMap(item => item.positions || [])
          const uniquePositions = [...new Set(allPositions)]
          
          return {
            departments,
            positions: uniquePositions
          }
        }
        
        if (response.data.departments && response.data.positions) {
          return {
            departments: response.data.departments,
            positions: response.data.positions
          }
        }
      }
      
      return {
        departments: ["Human Resources", "Finance", "Marketing", "IT", "Operations"],
        positions: ["Head", "Manager", "Staff", "Specialist", "Developer", "Analyst"]
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
      return {
        departments: ["Human Resources", "Finance", "Marketing", "IT", "Operations"],
        positions: ["Head", "Manager", "Staff", "Specialist", "Developer", "Analyst"]
      }
    }
  }

  /**
   * Client-side search filtering for employees
   * @param {Array} employees - Employee list
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered employees
   */
  filterEmployeesClientSide(employees, searchTerm) {
    if (!searchTerm || !employees.length) return employees

    const searchLower = searchTerm.toLowerCase()
    return employees.filter(employee => {
      const fullName = employee.fullName?.toLowerCase() || ""
      const employeeId = employee.employeeId?.toLowerCase() || ""
      return fullName.includes(searchLower) || employeeId.includes(searchLower)
    })
  }
}

// Create service instances
export const studentListService = new StudentListService()
export const employeeListService = new EmployeeListService()