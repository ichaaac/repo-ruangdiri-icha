// src/routes/routeConfig.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// Layouts
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
// import CompanySchedulePage from "../pages/organization/company/CompanySchedulePage"; // Not yet developed
// import CandidatesPage from "../pages/organization/company/CandidatesPage"; // Not yet developed
// import JobsPage from "../pages/organization/company/JobsPage"; // Not yet developed

// School pages
import SchoolDashboard from "../pages/organization/school/SchoolDashboard"; 
import StudentListPage from "../pages/organization/school/StudentListPage";
import SchoolProfilePage from "../pages/organization/school/SchoolProfilePage";
// import SchoolSchedulePage from "../pages/organization/school/SchoolSchedulePage"; // Not yet developed

/**
 * Route configuration for the application
 * Using a declarative array-based approach for easier maintenance
 */
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

  // Organization routes - Company
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
      // Route to profile page when settings is clicked (settings is profile page)
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      // Placeholder routes for features not yet developed
      {
        path: "candidates",
        element: <div className="p-6">Candidates page - Under development</div> // Placeholder
      },
      {
        path: "jobs",
        element: <div className="p-6">Jobs page - Under development</div> // Placeholder
      },
      {
        path: "schedule",
        element: <div className="p-6">Schedule page - Under development</div> // Placeholder
      }
    ]
  },

  // Organization routes - School
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
      // Route to profile page when settings is clicked (settings is profile page)
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      // Placeholder route for schedule feature not yet developed
      {
        path: "schedule",
        element: <div className="p-6">Schedule page - Under development</div> // Placeholder
      }
    ]
  },

  // Unprotected demo routes (for development/preview)
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
      // Route to profile page when settings is clicked (settings is profile page)
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      // Placeholder routes for features not yet developed
      {
        path: "candidates",
        element: <div className="p-6">Candidates page - Under development</div> // Placeholder
      },
      {
        path: "jobs",
        element: <div className="p-6">Jobs page - Under development</div> // Placeholder
      },
      {
        path: "schedule",
        element: <div className="p-6">Schedule page - Under development</div> // Placeholder
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
      // Route to profile page when settings is clicked (settings is profile page)
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      },
      // Placeholder route for schedule feature not yet developed
      {
        path: "schedule",
        element: <div className="p-6">Schedule page - Under development</div> // Placeholder
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