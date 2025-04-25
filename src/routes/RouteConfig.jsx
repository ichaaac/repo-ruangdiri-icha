import React from "react";
import { Navigate } from "react-router-dom";

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
import CompanyProfilePage from "../pages/organization/company/ProfilePage";
import EmployeeListPage from "../pages/organization/company/EmployeeListPage";

// School pages
import SchoolDashboard from "../pages/organization/school/SchoolDashboard";
import SchoolProfilePage from "../pages/organization/school/ProfilePage";
import StudentListPage from "../pages/organization/school/StudentListPage";

// Shared organization pages
import SettingsPage from "../pages/organization/SettingsPage";

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

  // Organization routes - Company (UNPROTECTED)
  {
    path: "/organization/company",
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
        path: "settings",
        element: <SettingsPage />
      },
      {
        path: "employee-list",
        element: <EmployeeListPage />
      }
    ]
  },

  // Organization routes - School (UNPROTECTED)
  {
    path: "/organization/school",
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
        path: "settings",
        element: <SettingsPage />
      },
      {
        path: "student-list",
        element: <StudentListPage />
      }
    ]
  },

  // Legacy redirect routes
  {
    path: "/school/dashboard",
    element: <Navigate to="/organization/school/dashboard" replace />
  },
  {
    path: "/school/profile",
    element: <Navigate to="/organization/school/profile" replace />
  },
  {
    path: "/school/settings",
    element: <Navigate to="/organization/school/settings" replace />
  },
  {
    path: "/school/student-list",
    element: <Navigate to="/organization/school/student-list" replace />
  },
  {
    path: "/organization/list",
    element: <Navigate to="/organization/company/employee-list" replace />
  },

  // Catch-all fallback
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
];

export default routes;
