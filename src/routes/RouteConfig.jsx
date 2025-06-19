// src/routes/routeConfig.jsx - Simplified with existing layouts
import React from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// Layouts - using existing ones
import CompanyLayout from "../components/organization/company/layout/CompanyLayout";
import SchoolLayout from "../components/organization/school/layout/SchoolLayout";

// Public pages
import Homepage from "../pages/shared/HomePage";
import Login from "../pages/shared/auth/Login";
import ForgotPassword from "../pages/shared/auth/ForgotPassword";
import ResetPassword from "../pages/shared/auth/ResetPassword";

// Company pages
import CompanyDashboard from "../pages/organization/company/CompanyDashboard";
import EmployeeListPage from "../pages/organization/company/EmployeeListPage";
import CompanyProfilePage from "../pages/organization/company/CompanyProfilePage";
import EmployeeDetailPage from "@/pages/organization/company/EmployeeDetailPage";

// School pages
import SchoolDashboard from "../pages/organization/school/SchoolDashboard"; 
import StudentListPage from "../pages/organization/school/StudentListPage";
import SchoolProfilePage from "../pages/organization/school/SchoolProfilePage";
import StudentDetailPage from "../pages/organization/school/StudentDetailPage";

import OnboardingForm from "@/pages/shared/OnboardingForm";
import OnboardingSplashScreen from "@/pages/shared/OnboardingSplashScreen";

const routes = [
  // Public routes
  {
    path: "/",
    element: <Homepage />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/reset-password",
    element: <ResetPassword />
  },
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingSplashScreen />
      </ProtectedRoute>
    )
  },
  {
    path: "/onboarding/form",
    element: (
      <ProtectedRoute>
        <OnboardingForm />
      </ProtectedRoute>
    )
  },
  

  // ========================================
  // DEVELOPMENT ROUTES - NO BACKEND REQUIRED
  // Uses existing layouts but bypasses authentication
  // ========================================
  
  // Development landing page
  {
    path: "/dev",
    element: (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-white text-2xl">developer_mode</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Development Mode</h1>
            <p className="text-gray-600 text-sm">Access layouts without backend authentication</p>
          </div>
          
          <div className="space-y-3">
            <a 
              href="/dev/school/student-list" 
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <span className="material-icons">school</span>
              School Layout
            </a>
            <a 
              href="/dev/company/employee-list" 
              className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <span className="material-icons">business</span>
              Company Layout  
            </a>
            
            <div className="border-t pt-3 mt-4">
              <p className="text-gray-500 text-xs text-center mb-3">Legacy Demo Routes</p>
              <a 
                href="/demo/organization/school/student-list" 
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <span className="material-icons text-sm">assignment</span>
                Demo Routes
              </a>
            </div>
          </div>
          
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-xs text-center">
              💡 These routes work without backend server running
            </p>
          </div>
        </div>
      </div>
    )
  },

  // School development routes (No backend required) - Using existing SchoolLayout
  {
    path: "/dev/school",
    element: <SchoolLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="student-list" replace />
      },
      {
        path: "dashboard",
        element: <SchoolDashboard />
      },
      {
        path: "profile",
        element: <SchoolProfilePage />
      },
      {
        path: "student-list",
        element: <StudentListPage />
      },
      {
        path: "student/:studentId",
        element: <StudentDetailPage />
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      {
        path: "schedule",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">schedule</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Schedule Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  🚧 Coming soon: Class scheduling, teacher assignments, and timetable management
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },

  // Company development routes (No backend required) - Using existing CompanyLayout
  {
    path: "/dev/company",
    element: <CompanyLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="employee-list" replace />
      },
      {
        path: "dashboard",
        element: <CompanyDashboard />
      },
      {
        path: "profile",
        element: <CompanyProfilePage />
      },
      {
        path: "employee-list",
        element: <EmployeeListPage />
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      {
        path: "employee/:employeeId",
        element: <EmployeeDetailPage />
      },
      {
        path: "candidates",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">people</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Candidates Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Candidate profiles, application tracking, and recruitment pipeline
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        path: "jobs",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">work</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Jobs Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Job postings, requirements management, and application processing
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        path: "schedule",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">schedule</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Schedule Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Employee schedules, shift management, and time tracking
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },

  // ========================================
  // PRODUCTION ROUTES - BACKEND REQUIRED
  // ========================================

  // Organization routes - Company (Protected)
  {
    path: "/organization/company",
    element: (
      <ProtectedRoute requiredOrgType="company">
        <CompanyLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />
      },
      {
        path: "dashboard",
        element: <CompanyDashboard />
      },
      {
        path: "profile",
        element: <CompanyProfilePage />
      },
      {
        path: "employee-list",
        element: <EmployeeListPage />
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
    {
        path: "employee/:employeeId",
        element: <EmployeeDetailPage />
      },
      {
        path: "candidates",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">people</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Candidates Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Candidate profiles, application tracking, and recruitment pipeline
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        path: "jobs",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">work</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Jobs Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Job postings, requirements management, and application processing
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        path: "schedule",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">schedule</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Schedule Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Employee schedules, shift management, and time tracking
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },

  // Organization routes - School (Protected)
  {
    path: "/organization/school",
    element: (
      <ProtectedRoute requiredOrgType="school">
        <SchoolLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />
      },
      {
        path: "dashboard",
        element: <SchoolDashboard />
      },
      {
        path: "profile",
        element: <SchoolProfilePage />
      },
      {
        path: "student-list",
        element: <StudentListPage />
      },
      {
        path: "student/:studentId",
        element: <StudentDetailPage />
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      {
        path: "schedule",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">schedule</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Schedule Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  🚧 Coming soon: Class scheduling, teacher assignments, and timetable management
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },

  // ========================================
  // LEGACY DEMO ROUTES (kept for compatibility)
  // ========================================
  
  {
    path: "/demo/organization/company",
    element: <CompanyLayout />,
    children: [
      {
        index: true,
        element: <CompanyDashboard />
      },
      {
        path: "dashboard",
        element: <CompanyDashboard />
      },
      {
        path: "profile",
        element: <CompanyProfilePage />
      },
      {
        path: "employee-list",
        element: <EmployeeListPage />
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      {
        path: "candidates",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">people</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Candidates Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Candidate profiles, application tracking, and recruitment pipeline
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        path: "jobs",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">work</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Jobs Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Job postings, requirements management, and application processing
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        path: "schedule",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">schedule</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Schedule Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  🚧 Coming soon: Employee schedules, shift management, and time tracking
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },

  {
    path: "/demo/organization/school",
    element: <SchoolLayout />,
    children: [
      {
        index: true,
        element: <SchoolDashboard />
      },
      {
        path: "dashboard",
        element: <SchoolDashboard />
      },
      {
        path: "profile",
        element: <SchoolProfilePage />
      },
      {
        path: "student-list",
        element: <StudentListPage />
      },
      {
        path: "student/:studentId",
        element: <StudentDetailPage />
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      {
        path: "schedule",
        element: (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <span className="material-icons text-gray-400 text-6xl mb-4 block">schedule</span>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Schedule Management</h2>
              <p className="text-gray-500 mb-4">This feature is currently under development</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  🚧 Coming soon: Class scheduling, teacher assignments, and timetable management
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },

  // Legacy redirect routes
  {
    path: "/school/*",
    element: <Navigate to="/organization/school/*" replace />
  },
  {
    path: "/company/*",
    element: <Navigate to="/organization/company/*" replace />
  },

  // Catch-all fallback
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
];

export default routes;