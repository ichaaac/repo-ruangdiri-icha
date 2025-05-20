// src/lib/api.js - Fixed function naming

import axios from "axios";

// Base API URL from environment variable or default
const API_URL = import.meta.env.VITE_API_URL

// Create axios instance with common configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 errors during login attempts
    // This ensures login errors are handled by the component
    const isLoginAttempt = error.config.url?.includes("/auth/login");

    if (error.response && error.response.status === 401 && !isLoginAttempt) {
      // Only clear tokens and redirect for non-login 401 errors
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Consolidated API object with all endpoints
const api = {
  // ===== User endpoints =====
  user: {
    /**
     * Get current user data
     * This is a high-frequency endpoint that's used throughout the app
     * @returns {Promise} API response with user data
     */
    getMe: async () => {
      try {
        const response = await apiClient.get("/users/me");
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ===== Authentication endpoints =====
  auth: {
    /**
     * Login with email and password
     * @param {Object} credentials - User credentials
     * @param {string} credentials.email - User email
     * @param {string} credentials.password - User password
     * @param {boolean} credentials.rememberMe - Remember me flag
     * @returns {Promise} API response
     */
    login: async (credentials) => {
      try {
        const response = await apiClient.post("/auth/login", credentials);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    /**
     * Send forgot password email
     * @param {string} email - User email
     * @returns {Promise} API response
     */
    forgotPassword: async (email) => {
      try {
        const response = await apiClient.post("/auth/forgot-password", { email });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    /**
     * Reset password with token
     * @param {string} token - Reset password token
     * @param {string} newPassword - New password
     * @returns {Promise} API response
     */
    resetPassword: async (token, newPassword) => {
      try {
        const response = await apiClient.post("/auth/reset-password", {
          token,
          newPassword,
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    /**
     * Change password
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} API response
     */
    changePassword: async (oldPassword, newPassword) => {
      try {
        const response = await apiClient.patch("/users/change-password", {
          oldPassword,
          newPassword,
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    /**
     * Logout user (clear token)
     * @returns {Promise} API response
     */
    logout: async () => {
      try {
        const response = await apiClient.post("/auth/logout");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return response.data;
      } catch (error) {
        // Still remove token on error
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        throw error;
      }
    },
  },

  // ===== Students endpoints =====
  students: {
    /**
     * Get a single student by ID
     * @param {string} studentId - The ID of the student to fetch
     * @returns {Promise} API response with student data
     */
    getStudentById: async (studentId) => {
      try {
        const response = await apiClient.get(`/students/${studentId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching student ${studentId}:`, error);
        throw error;
      }
    },

    /**
     * Update a student's profile
     * @param {string} studentId - The ID of the student to update
     * @param {Object} data - Profile data to update
     * @returns {Promise} API response with updated student data
     */
    update: async (studentId, data) => {
      try {
        const response = await apiClient.patch(`/students/${studentId}`, data);
        return response.data;
      } catch (error) {
        console.error(`Error updating student ${studentId}:`, error);
        throw error;
      }
    },

    /**
     * Get student's academic info (grades, classrooms)
     * @returns {Promise} API response with academic info
     */
    getAcademicInfo: async () => {
      try {
        const response = await apiClient.get('/students/academic-info');
        return response.data;
      } catch (error) {
        console.error("Error fetching academic info:", error);
        // Return a fallback structure with some common values
        return {
          status: "fallback",
          data: {
            grades: ["X", "XI", "XII"],
            classNumbers: ["1", "2", "3", "4", "5", "IPA-1", "IPA-2", "IPS-1", "IPS-2"],
            // Generate some sample classrooms
            classrooms: [
              "X-1", "X-2", "X-3", "X-4", "X-5", 
              "XI-IPA-1", "XI-IPA-2", "XI-IPS-1", "XI-IPS-2",
              "XII-IPA-1", "XII-IPA-2", "XII-IPS-1", "XII-IPS-2",
              "x-ayam bakar"
            ]
          }
        };
      }
    },

    /**
     * Get student's mental health history
     * @param {string} studentId - The ID of the student
     * @returns {Promise} API response with mental health data
     */
    getMentalHealthHistory: async (studentId) => {
      try {
        const response = await apiClient.get(`/students/${studentId}/mental-health-history`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching mental health history for student ${studentId}:`, error);
        throw error;
      }
    },

    /**
     * Upload student profile picture
     * @param {string} studentId - The ID of the student
     * @param {File} file - Profile picture file
     * @returns {Promise} API response
     */
    updateProfilePicture: async (studentId, file) => {
      try {
        const formData = new FormData();
        formData.append("profilePicture", file);

        const response = await apiClient.put(`/students/${studentId}/profile-picture`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (error) {
        console.error(`Error updating profile picture for student ${studentId}:`, error);
        throw error;
      }
    },

    /**
     * Update student progress notes
     * @param {string} studentId - The ID of the student
     * @param {string} progress - Progress notes text
     * @returns {Promise} API response
     */
    updateProgress: async (studentId, progress) => {
      try {
        const response = await apiClient.patch(`/students/${studentId}/progress`, { progress });
        return response.data;
      } catch (error) {
        console.error(`Error updating progress for student ${studentId}:`, error);
        throw error;
      }
    },

    /**
     * Update student screening status
     * @param {string} studentId - The ID of the student
     * @param {string} status - New screening status ('at_risk', 'monitored', 'stable')
     * @param {string} notes - Optional notes about the status change
     * @returns {Promise} API response
     */
    updateScreeningStatus: async (studentId, status, notes = "") => {
      try {
        const response = await apiClient.patch(`/students/${studentId}/screening-status`, { 
          status, 
          notes 
        });
        return response.data;
      } catch (error) {
        console.error(`Error updating screening status for student ${studentId}:`, error);
        throw error;
      }
    },

    /**
     * Get dashboard metrics for students
     * @returns {Promise} API response with dashboard metrics data
     */
    getDashboardMetrics: async () => {
      try {
        const response = await apiClient.get('/students/dashboard/metrics');
        return response.data;
      } catch (error) {
        console.error("Error fetching student dashboard metrics:", error);
        // Return a fallback empty structure
        return {
          status: "fallback",
          data: {
            summary: {
              atRisk: { count: 0, total: 0 },
              notScreened: { count: 0, total: 0 },
              notCounseled: { count: 0, total: 0 }
            },
            mentalHealth: {
              overall: { atRisk: 0, monitored: 0, stable: 0 },
              byMonth: []
            },
            status: {
              screening: { completed: 0, notCompleted: 0 },
              counseling: { completed: 0, notCompleted: 0 }
            }
          },
          message: "Fallback student dashboard metrics"
        };
      }
    }
  },

  // ===== Organization endpoints =====
  organization: {
    /**
     * Get organization profile
     * @returns {Promise} API response with organization profile data
     */
    getProfile: async () => {
      try {
        const response = await apiClient.get("/organizations/profile");
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    /**
     * Update organization profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise} API response
     */
    updateProfile: async (profileData) => {
      try {
        const response = await apiClient.patch("/organizations/profile", profileData);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    /**
     * Update organization profile picture
     * @param {File} file - Profile picture file
     * @returns {Promise} API response
     */
    updateProfilePicture: async (file) => {
      try {
        const formData = new FormData();
        formData.append("profilePicture", file);

        const response = await apiClient.put("/organizations/profile-picture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // School-specific endpoints
    school: {
      /**
       * Get school student list
       * @param {Object} params - Query parameters (pagination, filters, etc.)
       * @returns {Promise} API response with students data
       */
      getStudents: async (params = {}) => {
        try {
          const response = await apiClient.get("/organizations/students", { params });
          return response.data;
        } catch (error) {
          throw error;
        }
      },
    
      /**
       * Get total student counts
       * @returns {Promise} API response with total counts data
       */
      getStudentCounts: async () => {
        try {
          const response = await apiClient.get("/organizations/students/counts");
          return response.data;
        } catch (error) {
          throw error;
        }
      },
    
      /**
       * Get all available classrooms
       * @returns {Promise} API response with classrooms data
       */
      getClassrooms: async () => {
        try {
          const response = await apiClient.get("/students/academic-info");
          return response.data;
        } catch (error) {
          throw error;
        }
      },
    
      /**
       * Update a student's profile (via organization endpoint)
       * @param {string} studentId - The ID of the student to update
       * @param {Object} studentData - Profile data to update
       * @returns {Promise} API response with updated student data
       */
      updateStudent: async (studentId, studentData) => {
        try {
          const response = await apiClient.patch(`/organizations/students/${studentId}`, studentData);
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      /**
       * Get dashboard metrics for the school
       * @returns {Promise} API response with dashboard metrics
       */
      getDashboardMetrics: async () => {
        try {
          const response = await apiClient.get("/students/dashboard/metrics");
          return response.data;
        } catch (error) {
          console.error("Error fetching school dashboard metrics:", error);
          // Return fallback structure
          return {
            status: "fallback",
            data: {
              summary: {
                atRisk: { count: 0, total: 0 },
                notScreened: { count: 0, total: 0 },
                notCounseled: { count: 0, total: 0 }
              },
              mentalHealth: {
                overall: { atRisk: 0, monitored: 0, stable: 0 },
                byMonth: []
              },
              status: {
                screening: { completed: 0, notCompleted: 0 },
                counseling: { completed: 0, notCompleted: 0 }
              }
            },
            message: "Fallback school dashboard metrics"
          };
        }
      }
    },

    // Company-specific endpoints
    company: {
      /**
       * Get company employee list
       * @param {Object} params - Query parameters (pagination, filters, etc.) 
       * @returns {Promise} API response with employees data
       */
      getEmployees: async (params = {}) => {
        try {
          const response = await apiClient.get("/organizations/employees", { params });
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      /**
       * Update an employee's profile
       * @param {string} employeeId - The ID of the employee to update
       * @param {Object} employeeData - Profile data to update
       * @returns {Promise} API response with updated employee data
       */
      updateEmployee: async (employeeId, employeeData) => {
        try {
          // Transform the data to match the expected API structure if needed
          // The API expects specific fields in the profile object
          const formattedData = {
            // Map common fields directly
            fullName: employeeData.fullName,
            
            // Add profile-specific fields
            profile: {
              employeeId: employeeData.employeeId,
              department: employeeData.department,
              position: employeeData.position,
              gender: employeeData.gender,
              age: employeeData.age ? parseInt(employeeData.age) : undefined,
              yearsOfService: employeeData.workDuration ? parseInt(employeeData.workDuration) : undefined,
              screeningStatus: employeeData.screeningStatus,
              counselingStatus: employeeData.counselingStatus,
            }
          };
          
          // Remove undefined values
          Object.keys(formattedData.profile).forEach(key => {
            if (formattedData.profile[key] === undefined) {
              delete formattedData.profile[key];
            }
          });
          
          console.log("Updating employee with data:", formattedData);
          
          const response = await apiClient.patch(`/organizations/employees/${employeeId}`, formattedData);
          return response.data;
        } catch (error) {
          console.error("Error updating employee:", error);
          throw error;
        }
      },

      /**
       * Get departments and roles
       * @returns {Promise} API response with departments data
       */
      getDepartments: async () => {
        try {
          const response = await apiClient.get("/employees/roles");
          return response.data;
        } catch (error) {
          console.error("Error fetching departments:", error);
          // Return fallback structure
          return {
            status: "fallback",
            data: [
              { department: "Human Resources", positions: ["Head", "Manager", "Staff", "Recruiter"] },
              { department: "Finance", positions: ["Head", "Manager", "Accountant", "Analyst"] },
              { department: "Marketing", positions: ["Head", "Manager", "Specialist", "Coordinator"] },
              { department: "Operations", positions: ["Head", "Lead", "Manager", "Staff"] },
              { department: "Information Technology", positions: ["Head", "Lead", "Developer", "Designer", "Support"] },
              { department: "Product Development", positions: ["Head", "Lead", "Manager", "Engineer"] },
              { department: "Legal", positions: ["Head", "Counsel", "Specialist"] }
            ]
          };
        }
      },

      /**
       * Get dashboard metrics for company
       * @returns {Promise} API response with dashboard metrics
       */
      getDashboardMetrics: async () => {
        try {
          const response = await apiClient.get("/employees/dashboard/metrics");
          return response.data;
        } catch (error) {
          console.error("Error fetching employee dashboard metrics:", error);
          // Return fallback structure
          return {
            status: "fallback",
            data: {
              summary: {
                atRisk: { count: 0, total: 0 },
                notScreened: { count: 0, total: 0 },
                notCounseled: { count: 0, total: 0 }
              },
              mentalHealth: {
                overall: { atRisk: 0, monitored: 0, stable: 0 },
                byMonth: []
              },
              status: {
                screening: { completed: 0, notCompleted: 0 },
                counseling: { completed: 0, notCompleted: 0 }
              }
            },
            message: "Fallback employee dashboard metrics"
          };
        }
      },

      /**
       * Get employee by ID
       * @param {string} employeeId - The ID of the employee
       * @returns {Promise} API response with employee data
       */
      getEmployeeById: async (employeeId) => {
        try {
          const response = await apiClient.get(`/employees/${employeeId}`);
          return response.data;
        } catch (error) {
          console.error(`Error fetching employee ${employeeId}:`, error);
          throw error;
        }
      },

      /**
       * Get employee mental health history
       * @param {string} employeeId - The ID of the employee
       * @returns {Promise} API response with mental health data
       */
      getEmployeeMentalHealthHistory: async (employeeId) => {
        try {
          const response = await apiClient.get(`/employees/${employeeId}/mental-health-history`);
          return response.data;
        } catch (error) {
          console.error(`Error fetching mental health history for employee ${employeeId}:`, error);
          throw error;
        }
      },

      /**
       * Update employee screening status
       * @param {string} employeeId - The ID of the employee
       * @param {string} status - New screening status ('at_risk', 'monitored', 'stable')
       * @param {string} notes - Optional notes about the status change
       * @returns {Promise} API response
       */
      updateEmployeeScreeningStatus: async (employeeId, status, notes = "") => {
        try {
          const response = await apiClient.patch(`/employees/${employeeId}/screening-status`, { 
            status, 
            notes 
          });
          return response.data;
        } catch (error) {
          console.error(`Error updating screening status for employee ${employeeId}:`, error);
          throw error;
        }
      }
    }
  },
};

export default api;

export { apiClient };

export const getMe = api.user.getMe;