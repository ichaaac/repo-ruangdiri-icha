// src/lib/api.js - IMPROVED STRUCTURE AND ORGANIZATION

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// === REQUEST INTERCEPTOR ===
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

// === RESPONSE INTERCEPTOR ===
// Handle 401 - only redirect if user was authenticated (had token) and it's not a login request
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    const hadToken = !!error.config?.headers?.Authorization;
    if (error.response?.status === 401 && hadToken && !isAuthRequest) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// === FALLBACK DATA HELPERS ===

/**
 * Convert absolute upload URLs to relative /uploads/... paths.
 * Both Vite dev proxy and Vercel production rewrite handle
 * forwarding /uploads/* to the backend, so <img> tags work
 * without needing custom headers (avoids ngrok interstitial).
 */
const normalizeUploadUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  const match = url.match(/\/uploads\/.+/);
  if (match) return match[0];
  return url;
};

const createFallbackResponse = (data, message = "Fallback data") => ({
  status: "fallback",
  data,
  message
});

const getAcademicInfoFallback = () => createFallbackResponse({
  grades: ["X", "XI", "XII"],
  classNumbers: ["1", "2", "3", "4", "5", "IPA-1", "IPA-2", "IPS-1", "IPS-2"],
  classrooms: [
    "X-1", "X-2", "X-3", "X-4", "X-5", 
    "XI-IPA-1", "XI-IPA-2", "XI-IPS-1", "XI-IPS-2",
    "XII-IPA-1", "XII-IPA-2", "XII-IPS-1", "XII-IPS-2"
  ]
});

const getDepartmentsFallback = () => createFallbackResponse([
  { department: "Human Resources", positions: ["Head", "Manager", "Staff", "Recruiter"] },
  { department: "Finance", positions: ["Head", "Manager", "Accountant", "Analyst"] },
  { department: "Marketing", positions: ["Head", "Manager", "Specialist", "Coordinator"] },
  { department: "Operations", positions: ["Head", "Lead", "Manager", "Staff"] },
  { department: "Information Technology", positions: ["Head", "Lead", "Developer", "Designer", "Support"] },
  { department: "Product Development", positions: ["Head", "Lead", "Manager", "Engineer"] },
  { department: "Legal", positions: ["Head", "Counsel", "Specialist"] }
]);

const getDashboardMetricsFallback = () => createFallbackResponse({
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
});

// === API ERROR HANDLER ===
const handleApiError = (error, context) => {
  console.error(`API Error in ${context}:`, error);
  
  if (error.response) {
    console.error("Response data:", error.response.data);
    console.error("Response status:", error.response.status);
  }
  
  throw error;
};

// === MAIN API OBJECT ===
const api = {
  // ==========================================
  // USER ENDPOINTS
  // ==========================================
  user: {
    /**
     * Get current user data
     * High-frequency endpoint used throughout the app
     */
    getMe: async () => {
      try {
        const response = await apiClient.get("/users/me");
        return response;
      } catch (error) {
        handleApiError(error, "user.getMe");
      }
    },

    updateProfile: async (data) => {
      try {
        const hasFile = Object.values(data).some(v => v instanceof File);
        if (hasFile) {
          const formData = new FormData();
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, value instanceof File ? value : String(value));
            }
          });
          const response = await apiClient.patch("/users/profile", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return response;
        }
        const response = await apiClient.patch("/users/profile", data);
        return response;
      } catch (error) {
        handleApiError(error, "user.updateProfile");
      }
    },
  },

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================
  auth: {
    /**
     * Login with email and password
     */
    login: async (credentials) => {
      try {
        const response = await apiClient.post("/auth/login", credentials);
        return response.data;
      } catch (error) {
        handleApiError(error, "auth.login");
      }
    },

    /**
     * Send forgot password email
     */
    forgotPassword: async (email) => {
      try {
        const response = await apiClient.post("/auth/forgot-password", { email });
        return response.data;
      } catch (error) {
        handleApiError(error, "auth.forgotPassword");
      }
    },

    /**
     * Reset password with token
     */
    resetPassword: async (token, newPassword) => {
      try {
        const response = await apiClient.post("/auth/reset-password", {
          token,
          newPassword,
        });
        return response.data;
      } catch (error) {
        handleApiError(error, "auth.resetPassword");
      }
    },

    /**
     * Change password
     */
    changePassword: async (oldPassword, newPassword) => {
      try {
        const response = await apiClient.patch("/users/change-password", {
          oldPassword,
          newPassword,
        });
        return response.data;
      } catch (error) {
        handleApiError(error, "auth.changePassword");
      }
    },

    /**
     * Logout user
     */
    logout: async () => {
      try {
        const response = await apiClient.post("/auth/logout");
        
        // Clear local storage regardless of API response
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("organizationType");
        
        return response.data;
      } catch (error) {
        // Still clear tokens on error
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("organizationType");
        handleApiError(error, "auth.logout");
      }
    },
  },

  // ==========================================
  // STUDENTS ENDPOINTS
  // ==========================================
  students: {
    /**
     * Get student by ID
     */
    getById: async (studentId) => {
      try {
        const response = await apiClient.get(`/students/${studentId}`);
        return response.data;
      } catch (error) {
        handleApiError(error, `students.getById(${studentId})`);
      }
    },

    /**
     * Update student profile
     */
    update: async (studentId, data) => {
      try {
        const response = await apiClient.patch(`/students/${studentId}`, data);
        return response.data;
      } catch (error) {
        handleApiError(error, `students.update(${studentId})`);
      }
    },

    /**
     * Get academic info (grades, classrooms)
     */
    getAcademicInfo: async () => {
      try {
        const response = await apiClient.get('/students/academic-info');
        return response.data;
      } catch (error) {
        console.error("Error fetching academic info:", error);
        return getAcademicInfoFallback();
      }
    },

    /**
     * Get mental health history
     */
    getMentalHealthHistory: async (studentId) => {
      try {
        const response = await apiClient.get(`/students/${studentId}/mental-health-history`);
        return response.data;
      } catch (error) {
        handleApiError(error, `students.getMentalHealthHistory(${studentId})`);
      }
    },

    /**
     * Update profile picture
     */
    updateProfilePicture: async (studentId, file) => {
      try {
        const formData = new FormData();
        formData.append("profilePicture", file);

        const response = await apiClient.put(`/students/${studentId}/profile-picture`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      } catch (error) {
        handleApiError(error, `students.updateProfilePicture(${studentId})`);
      }
    },

    /**
     * Update progress notes
     */
    updateProgress: async (studentId, progress) => {
      try {
        const response = await apiClient.patch(`/students/${studentId}/progress`, { progress });
        return response.data;
      } catch (error) {
        handleApiError(error, `students.updateProgress(${studentId})`);
      }
    },

    /**
     * Update screening status
     */
    updateScreeningStatus: async (studentId, status, notes = "") => {
      try {
        const response = await apiClient.patch(`/students/${studentId}/screening-status`, { 
          status, 
          notes 
        });
        return response.data;
      } catch (error) {
        handleApiError(error, `students.updateScreeningStatus(${studentId})`);
      }
    },

    /**
     * Get dashboard metrics
     */
    getDashboardMetrics: async () => {
      try {
        const response = await apiClient.get('/students/dashboard/metrics');
        return response.data;
      } catch (error) {
        console.error("Error fetching student dashboard metrics:", error);
        return getDashboardMetricsFallback();
      }
    }
  },

  // ==========================================
  // ORGANIZATION ENDPOINTS
  // ==========================================
  organization: {
    /**
     * Get organization profile
     */
    getProfile: async () => {
      try {
        const response = await apiClient.get("/organizations/profile");
        return response.data;
      } catch (error) {
        handleApiError(error, "organization.getProfile");
      }
    },

    /**
     * Update organization profile
     */
    updateProfile: async (profileData) => {
      try {
        const response = await apiClient.patch("/organizations/profile", profileData);
        return response.data;
      } catch (error) {
        handleApiError(error, "organization.updateProfile");
      }
    },

    /**
     * Update organization profile picture
     */
    updateProfilePicture: async (file) => {
      try {
        const formData = new FormData();
        formData.append("profilePicture", file);

        const response = await apiClient.patch("/organizations/profile", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      } catch (error) {
        handleApiError(error, "organization.updateProfilePicture");
      }
    },

    // ==========================================
    // SCHOOL-SPECIFIC ENDPOINTS
    // ==========================================
    school: {
      /**
       * Get school students with filters
       */
      getStudents: async (params = {}) => {
        try {
          const response = await apiClient.get("/organizations/students", { params });
          return response.data;
        } catch (error) {
          handleApiError(error, "organization.school.getStudents");
        }
      },

      /**
       * Get student counts
       */
      getStudentCounts: async () => {
        try {
          const response = await apiClient.get("/organizations/students/counts");
          return response.data;
        } catch (error) {
          handleApiError(error, "organization.school.getStudentCounts");
        }
      },

      /**
       * Get classrooms
       */
      getClassrooms: async () => {
        try {
          const response = await apiClient.get("/students/academic-info");
          return response.data;
        } catch (error) {
          console.error("Error fetching classrooms:", error);
          return getAcademicInfoFallback();
        }
      },

      /**
       * Update student (via organization endpoint)
       */
      updateStudent: async (studentId, data) => {
        try {
          const response = await apiClient.patch(`/organizations/students/${studentId}`, data);
          return response.data;
        } catch (error) {
          handleApiError(error, `organization.school.updateStudent(${studentId})`);
        }
      },

      /**
       * Get dashboard metrics
       */
      getDashboardMetrics: async () => {
        try {
          const response = await apiClient.get("/students/dashboard/metrics");
          return response.data;
        } catch (error) {
          console.error("Error fetching school dashboard metrics:", error);
          return getDashboardMetricsFallback();
        }
      }
    },

    // ==========================================
    // COMPANY-SPECIFIC ENDPOINTS
    // ==========================================
    company: {
      /**
       * Get company employees with filters
       */
      getEmployees: async (params = {}) => {
        try {
          const response = await apiClient.get("/organizations/employees", { params });
          return response.data;
        } catch (error) {
          handleApiError(error, "organization.company.getEmployees");
        }
      },

      /**
       * Update employee profile
       */
 updateEmployee: async (employeeId, employeeData) => { // employeeData DI SINI SUDAH FLAT DARI useListData
        try {
          // Tidak perlu lagi membuat formattedData dengan 'profile' bersarang
          // Karena 'employeeData' dari useListData.js sudah berisi field-field yang berubah secara flat.
          // Namun, kita perlu memastikan 'age' dan 'yearsOfService' di-parse ke integer jika ada
            // dan menghapus field yang undefined jika API tidak suka undefined.

            const payloadToSend = { ...employeeData }; // Mulai dengan salinan data yang flat

            // Parsing ulang angka jika perlu (ini sudah dilakukan di SharedTable, tapi bisa jaga-jaga di sini)
            if (payloadToSend.age !== undefined) {
                payloadToSend.age = parseInt(payloadToSend.age) || 0;
            }
            if (payloadToSend.yearsOfService !== undefined) { // Perhatikan: ini harusnya yearsOfService, bukan workDuration
                payloadToSend.yearsOfService = parseInt(payloadToSend.yearsOfService) || 0;
            }

            // Optional: Hapus properti dengan nilai undefined jika API tidak suka
            Object.keys(payloadToSend).forEach(key => {
                if (payloadToSend[key] === undefined) {
                    delete payloadToSend[key];
                }
            });

          const response = await apiClient.patch(`/organizations/employees/${employeeId}`, payloadToSend);
          return response.data;
        } catch (error) {
          handleApiError(error, `organization.company.updateEmployee(${employeeId})`);
        }
      },


      /**
       * Get departments and roles
       */
      getDepartments: async () => {
        try {
          const response = await apiClient.get("/employees/roles");
          return response.data;
        } catch (error) {
          console.error("Error fetching departments:", error);
          return getDepartmentsFallback();
        }
      },

      /**
       * Get dashboard metrics
       */
      getDashboardMetrics: async () => {
        try {
          const response = await apiClient.get("/employees/dashboard/metrics");
          return response.data;
        } catch (error) {
          console.error("Error fetching company dashboard metrics:", error);
          return getDashboardMetricsFallback();
        }
      }
    },
  },

  // ==========================================
  // DASHBOARD ENDPOINTS
  // ==========================================
  dashboard: {
    /**
     * Get student metrics with filters
     */
    getStudentMetrics: async (filters = {}) => {
      try {
        const params = new URLSearchParams();
        params.append("year", filters.year || new Date().getFullYear());
        if (filters.classroom) params.append("classroom", filters.classroom);
        if (filters.grade) params.append("grade", filters.grade);
        
        const response = await apiClient.get(`/students/metrics?${params}`);
        return response.data;
      } catch (error) {
        handleApiError(error, "dashboard.getStudentMetrics");
      }
    },

    /**
     * Get employee metrics with filters
     */
    getEmployeeMetrics: async (filters = {}) => {
      try {
        const params = new URLSearchParams();
        params.append("year", filters.year || new Date().getFullYear());
        if (filters.department) params.append("department", filters.department);
        
        const response = await apiClient.get(`/employees/metrics?${params}`);
        return response.data;
      } catch (error) {
        handleApiError(error, "dashboard.getEmployeeMetrics");
      }
    },

    /**
     * Get tab data (at risk, not screened, etc.)
     */
    getTabData: async (type = "student", tabType = "at_risk", params = {}) => {
      try {
        const queryParams = new URLSearchParams();
        
        if (tabType === "at_risk") queryParams.append("screeningStatus", "at_risk");
        else if (tabType === "not_screened") queryParams.append("screeningStatus", "not_screened");
        else if (tabType === "not_counseled") queryParams.append("counselingStatus", "false");

        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) queryParams.append(k, v);
        });

        const endpoint = type === "student" ? "/organizations/students" : "/organizations/employees";
        const response = await apiClient.get(`${endpoint}?${queryParams}`);
        return response.data;
      } catch (error) {
        handleApiError(error, `dashboard.getTabData(${type}, ${tabType})`);
      }
    },
  },

  // ==========================================
  // REGIONS & BRANCHES ENDPOINTS
  // ==========================================
  regions: {
    getAll: async () => {
      try {
        const response = await apiClient.get("/regions");
        return response.data;
      } catch (error) {
        handleApiError(error, "regions.getAll");
      }
    },
  },

  branches: {
    getAll: async (params = {}) => {
      try {
        const response = await apiClient.get("/branches", { params });
        return response.data;
      } catch (error) {
        handleApiError(error, "branches.getAll");
      }
    },
    create: async (data) => {
      try {
        const response = await apiClient.post("/branches", data);
        return response.data;
      } catch (error) {
        handleApiError(error, "branches.create");
        throw error;
      }
    },
    update: async (id, data) => {
      try {
        const response = await apiClient.put(`/branches/${id}`, data);
        return response.data;
      } catch (error) {
        handleApiError(error, "branches.update");
        throw error;
      }
    },
    delete: async (id) => {
      try {
        const response = await apiClient.delete(`/branches/${id}`);
        return response.data;
      } catch (error) {
        handleApiError(error, "branches.delete");
        throw error;
      }
    },
  },
};

// === STANDALONE FUNCTIONS ===

const STUDENT_ENDPOINT = "/students";

/**
 * Get student list for permit (SMA level)
 */
export const getStudentListForPermit = async (userCode, name) => {
    const params = {
        level: "SMA",
    };

    if (name) {
        params.name = name;
    }

    const { data } = await apiClient.get(STUDENT_ENDPOINT, {
        headers: {
            "x-user-id": userCode,
        },
        params,
    });
    return data;
};

/**
 * Standalone getMe function for direct use
 */
export const getMe = async () => {
  try {
    const response = await apiClient.get("/users/me");
    const data = response.data;
    if (data?.data?.profilePictureUrl) {
      data.data.profilePictureUrl = normalizeUploadUrl(data.data.profilePictureUrl);
    }
    if (data?.data?.profilePicture && data.data.profilePicture.includes("/uploads/")) {
      data.data.profilePicture = normalizeUploadUrl(data.data.profilePicture);
    }
    return data;
  } catch (error) {
    handleApiError(error, "getMe");
  }
};

// Force fresh GET for /users/me bypassing browser/server caching (ETag/304)
export const getMeFresh = async () => {
  try {
    const response = await apiClient.get("/users/me", {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "getMeFresh");
  }
};

// === EXPORTS ===
export default api;
export { apiClient };