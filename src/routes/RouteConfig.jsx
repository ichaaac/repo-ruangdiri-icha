// src/routes/RouteConfig.jsx

import { Navigate } from "react-router-dom"
import ProtectedRoute from "../components/auth/ProtectedRoute"

// === LAYOUTS ===
import CompanyLayout from "../components/organization/company/layout/CompanyLayout"
import SchoolLayout from "../components/organization/school/layout/SchoolLayout"
import UserLayout from "../components/user/shared/layout/UserLayout"

// === PUBLIC PAGES ===
import Homepage from "../pages/shared/HomePage"
import Login from "../pages/shared/auth/Login"
import ForgotPassword from "../pages/shared/auth/ForgotPassword"
import ResetPassword from "../pages/shared/auth/ResetPassword"

// === UNIFIED ONBOARDING COMPONENTS ===
import OnboardingContainer from "@/components/shared/onboarding/OnboardingContainer"

// === SHARED PAGES ===
import NotificationPage from "../pages/shared/NotificationPage"
import BookingSessionComplete from "@/components/shared/booking/BookingSessionComplete"

// === COMPANY PAGES ===
import CompanyDashboard from "../pages/organization/company/CompanyDashboard"
import EmployeeListPage from "../pages/organization/company/EmployeeListPage"
import CompanyProfilePage from "../pages/organization/company/CompanyProfilePage"
import EmployeeDetailPage from "../pages/organization/company/EmployeeDetailPage"
import CompanySchedule from "../pages/organization/company/CompanySchedule"

// === SCHOOL PAGES ===
import SchoolDashboard from "../pages/organization/school/SchoolDashboard"
import StudentListPage from "../pages/organization/school/StudentListPage"
import SchoolProfilePage from "../pages/organization/school/SchoolProfilePage"
import StudentDetailPage from "../pages/organization/school/StudentDetailPage"
import SchoolSchedule from "../pages/organization/school/SchoolSchedule"
import BookingSessionStandalone from "@/pages/user/shared/BookingSessonStandalone"
import ChatPage from "../pages/user/shared/ChatPage"
import UserProfile from "../pages/user/shared/UserProfile"
import MentalHealthScreening from "../pages/user/shared/MentalHealthScreening"
import UserDashboard from "../pages/user/shared/UserDashboard"

// === STANDALONE BOOKING COMPONENTS ===
import BookingContainer from "@/components/shared/booking/BookingContainer"

// === UNDER DEVELOPMENT COMPONENT ===
const UnderDevelopmentPage = ({ title, description, icon = "construction" }) => (
  <div className="p-8 text-center">
    <div className="max-w-md mx-auto">
      <span className="material-icons text-gray-400 text-6xl mb-4 block">{icon}</span>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-500 mb-4">{description}</p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-700 text-sm">🚧 Feature ini sedang dalam pengembangan</p>
      </div>
    </div>
  </div>
)

// === PSYCHOLOGIST COMING SOON PAGE ===
const PsychologistComingSoon = () => (
  <div className="p-8 text-center">
    <div className="max-w-lg mx-auto">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="material-icons text-purple-600 text-3xl">psychology</span>
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Platform Psikolog</h2>
      <p className="text-gray-600 mb-6">
        Fitur khusus untuk psikolog sedang dalam tahap pengembangan final. Saat ini Anda dapat mengakses sistem chat
        untuk berkomunikasi dengan klien.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-blue-800 mb-3">Fitur yang Akan Datang:</h3>
        <ul className="text-sm text-blue-700 space-y-2 text-left">
          <li className="flex items-center gap-2">
            <span className="material-icons text-xs">schedule</span>
            Manajemen jadwal konseling
          </li>
          <li className="flex items-center gap-2">
            <span className="material-icons text-xs">folder_shared</span>
            Case management system
          </li>
          <li className="flex items-center gap-2">
            <span className="material-icons text-xs">assessment</span>
            Assessment tools terintegrasi
          </li>
          <li className="flex items-center gap-2">
            <span className="material-icons text-xs">analytics</span>
            Dashboard analytics klien
          </li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 text-sm font-medium">
          💬 Sistem Chat sudah tersedia untuk komunikasi dengan klien
        </p>
      </div>
    </div>
  </div>
)

// === MAIN ROUTES CONFIGURATION ===
const routes = [
  // ==========================================
  // PUBLIC ROUTES
  // ==========================================
  {
    path: "/",
    element: <Homepage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },

  // ==========================================
  // STANDALONE BOOKING ROUTES (NO LAYOUT)
  // ==========================================
  {
    path: "/booking-session/:userType",
    element: (
      <ProtectedRoute>
        <BookingContainer showTopRightControl={false} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/user/:userType/booking-complete",
    element: (
      <ProtectedRoute>
        <BookingSessionComplete />
      </ProtectedRoute>
    ),
  },

  // ==========================================
  // UNIFIED ONBOARDING SYSTEM
  // ==========================================
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingContainer />
      </ProtectedRoute>
    ),
  },

  // ==========================================
  // STUDENT ROUTES - UPDATED WITHOUT BOOKING IN LAYOUT
  // ==========================================
  {
    path: "/user/student",
    element: (
      <ProtectedRoute requiredRole="student">
        <UserLayout userType="student" />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="screening" replace />,
      },
      {
        path: "dashboard",
        element: <UserDashboard />,
      },
      {
        path: "screening",
        element: <MentalHealthScreening />,
      },
      {
        path: "chat",
        element: <ChatPage />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
      {
        path: "notifications",
        element: <NotificationPage />,
      },
    ],
  },

  // ==========================================
  // EMPLOYEE ROUTES - UPDATED WITHOUT BOOKING IN LAYOUT
  // ==========================================
  {
    path: "/user/employee",
    element: (
      <ProtectedRoute requiredRole="employee">
        <UserLayout userType="employee" />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="screening" replace />,
      },
      {
        path: "dashboard",
        element: <UserDashboard />,
      },
      {
        path: "screening",
        element: <MentalHealthScreening />,
      },
      {
        path: "chat",
        element: <ChatPage />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
      {
        path: "notifications",
        element: <NotificationPage />,
      },
    ],
  },

  // ==========================================
  // PSYCHOLOGIST ROUTES - Updated for current functionality
  // ==========================================
  {
    path: "/user/psychologist",
    element: (
      <ProtectedRoute requiredRole="psychologist">
        <UserLayout userType="psychologist" />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="chat" replace />,
      },
      {
        path: "dashboard",
        element: <PsychologistComingSoon />,
      },
      {
        path: "chat",
        element: <ChatPage />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
      {
        path: "notifications",
        element: <NotificationPage />,
      },
      // Placeholder routes for future features
      {
        path: "schedule",
        element: (
          <UnderDevelopmentPage
            title="Manajemen Jadwal"
            description="Kelola jadwal konseling dan appointment dengan klien"
            icon="schedule"
          />
        ),
      },
      {
        path: "clients",
        element: (
          <UnderDevelopmentPage
            title="Manajemen Klien"
            description="Overview klien, riwayat sesi, dan progress tracking"
            icon="groups"
          />
        ),
      },
      {
        path: "assessments",
        element: (
          <UnderDevelopmentPage
            title="Assessment Tools"
            description="Tools asesmen kesehatan mental untuk klien"
            icon="assessment"
          />
        ),
      },
      {
        path: "analytics",
        element: (
          <UnderDevelopmentPage
            title="Analytics & Reports"
            description="Analisis data klien dan laporan progress"
            icon="analytics"
          />
        ),
      },
    ],
  },

  // ==========================================
  // SCHOOL ORGANIZATION ROUTES
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
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <SchoolDashboard />,
      },
      {
        path: "profile",
        element: <SchoolProfilePage />,
      },
      {
        path: "student-list",
        element: <StudentListPage />,
      },
      {
        path: "student/:studentId",
        element: <StudentDetailPage />,
      },
      {
        path: "schedule",
        element: <SchoolSchedule />,
      },
      {
        path: "notifications",
        element: <NotificationPage />,
      },
      {
        path: "message",
        element: (
          <UnderDevelopmentPage
            title="Messages"
            description="Sistem pesan untuk komunikasi dengan siswa dan orangtua"
            icon="chat"
          />
        ),
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />,
      },
    ],
  },

  // ==========================================
  // COMPANY ORGANIZATION ROUTES
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
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <CompanyDashboard />,
      },
      {
        path: "profile",
        element: <CompanyProfilePage />,
      },
      {
        path: "employee-list",
        element: <EmployeeListPage />,
      },
      {
        path: "employee/:employeeId",
        element: <EmployeeDetailPage />,
      },
      {
        path: "schedule",
        element: <CompanySchedule />,
      },
      {
        path: "notifications",
        element: <NotificationPage />,
      },
      {
        path: "message",
        element: (
          <UnderDevelopmentPage
            title="Messages"
            description="Sistem pesan untuk komunikasi dengan karyawan"
            icon="chat"
          />
        ),
      },
      {
        path: "candidates",
        element: (
          <UnderDevelopmentPage
            title="Candidates Management"
            description="Candidate profiles, application tracking, dan recruitment pipeline"
            icon="people"
          />
        ),
      },
      {
        path: "jobs",
        element: (
          <UnderDevelopmentPage
            title="Jobs Management"
            description="Job postings, requirements management, dan application processing"
            icon="work"
          />
        ),
      },
      {
        path: "settings",
        element: <Navigate to="profile" replace />,
      },
    ],
  },

  // ==========================================
  // LEGACY REDIRECTS
  // ==========================================
  {
    path: "/school/*",
    element: <Navigate to="/organization/school" replace />,
  },
  {
    path: "/company/*",
    element: <Navigate to="/organization/company" replace />,
  },
  {
    path: "/demo/*",
    element: <Navigate to="/" replace />,
  },

  // Redirect old user onboarding routes to unified system
  {
    path: "/user/onboarding/*",
    element: <Navigate to="/onboarding" replace />,
  },

  // ==========================================
  // FALLBACK ROUTE
  // ==========================================
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]

export default routes