// src/routes/routeConfig.jsx - SIMPLIFIED ROUTES

import React from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// === LAYOUTS ===
import CompanyLayout from "../components/organization/company/layout/CompanyLayout";
import SchoolLayout from "../components/organization/school/layout/SchoolLayout";

// === PUBLIC PAGES ===
import Homepage from "../pages/shared/HomePage";
import Login from "../pages/shared/auth/Login";
import ForgotPassword from "../pages/shared/auth/ForgotPassword";
import ResetPassword from "../pages/shared/auth/ResetPassword";

// === ONBOARDING PAGES ===
import OnboardingForm from "@/pages/shared/OnboardingForm";
import OnboardingSplashScreen from "@/pages/shared/OnboardingSplashScreen";

// === COMPANY PAGES ===
import CompanyDashboard from "../pages/organization/company/CompanyDashboard";
import EmployeeListPage from "../pages/organization/company/EmployeeListPage";
import CompanyProfilePage from "../pages/organization/company/CompanyProfilePage";
import EmployeeDetailPage from "../pages/organization/company/EmployeeDetailPage";
import CompanySchedule from "../pages/organization/company/CompanySchedule";

// === SCHOOL PAGES ===
import SchoolDashboard from "../pages/organization/school/SchoolDashboard"; 
import StudentListPage from "../pages/organization/school/StudentListPage";
import SchoolProfilePage from "../pages/organization/school/SchoolProfilePage";
import StudentDetailPage from "../pages/organization/school/StudentDetailPage";
import SchoolSchedule from "../pages/organization/school/SchoolSchedule";

// === SHARED COMPONENTS ===
const UnderDevelopmentPage = ({ title, description, icon = "construction" }) => (
  <div className="p-8 text-center">
    <div className="max-w-md mx-auto">
      <span className="material-icons text-gray-400 text-6xl mb-4 block">{icon}</span>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-500 mb-4">{description}</p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-700 text-sm">
          🚧 Feature ini sedang dalam pengembangan
        </p>
      </div>
    </div>
  </div>
);

// === MAIN ROUTES CONFIGURATION ===
const routes = [
  // ==========================================
  // PUBLIC ROUTES
  // ==========================================
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

  // ==========================================
  // ONBOARDING ROUTES (PROTECTED)
  // ==========================================
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

  // ==========================================
  // SCHOOL ORGANIZATION ROUTES (PROTECTED)
  // ==========================================
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
        path: "schedule",
        element: <SchoolSchedule />
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      }
    ]
  },

  // ==========================================
  // COMPANY ORGANIZATION ROUTES (PROTECTED)
  // ==========================================
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
        path: "employee/:employeeId",
        element: <EmployeeDetailPage />
      },
      {
        path: "schedule",
        element: <CompanySchedule />
      },
      {
        path: "candidates",
        element: <UnderDevelopmentPage 
          title="Candidates Management" 
          description="Candidate profiles, application tracking, dan recruitment pipeline"
          icon="people"
        />
      },
      {
        path: "jobs",
        element: <UnderDevelopmentPage 
          title="Jobs Management" 
          description="Job postings, requirements management, dan application processing"
          icon="work"
        />
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />
      }
    ]
  },

  // ==========================================
  // LEGACY REDIRECTS
  // ==========================================
  {
    path: "/school/*",
    element: <Navigate to="/organization/school" replace />
  },
  {
    path: "/company/*",
    element: <Navigate to="/organization/company" replace />
  },
  {
    path: "/demo/*",
    element: <Navigate to="/" replace />
  },
  {
    path: "/dev/*",
    element: <Navigate to="/" replace />
  },

  // ==========================================
  // FALLBACK ROUTE
  // ==========================================
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
];

export default routes;