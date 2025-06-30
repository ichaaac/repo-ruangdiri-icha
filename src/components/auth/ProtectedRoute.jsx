// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

const ProtectedRoute = ({ children, requiredOrgType }) => {
  const { user, isLoading, getOrganizationType } = useAuth()
  const location = useLocation()

  // ===================================================
  // CRITICAL: Handle refresh scenarios safely
  // ===================================================

  const token = localStorage.getItem("token")
  const hasToken = !!token

  // If we have a token but still loading, wait for user data
  if (hasToken && isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-primary">sync</span>
          <span className="text-primary">Loading...</span>
        </div>
      </div>
    )
  }

  // If no token and not loading, redirect to login
  if (!hasToken && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If we have token but no user data after loading completed, redirect to login
  if (hasToken && !isLoading && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // At this point, we should have a valid user
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ===================================================
  // ONBOARDING LOGIC - FIXED LOGIC
  // ===================================================

  const isOnboardingPage = location.pathname.startsWith("/onboarding")

  // CASE 1: User NEEDS onboarding (isOnboarded = true) but NOT on onboarding page
  if (user.isOnboarded === false && !isOnboardingPage) {
    return <Navigate to="/onboarding" replace />
  }

  // CASE 2: User COMPLETED onboarding (isOnboarded = false) but still on onboarding page
  if (user.isOnboarded === true && isOnboardingPage) {
    const orgType = getOrganizationType()

    if (orgType === "school") {
      return <Navigate to="/organization/school/dashboard" replace />
    } else if (orgType === "company") {
      return <Navigate to="/organization/company/dashboard" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  // ===================================================
  // ORGANIZATION TYPE CHECK
  // ===================================================

  if (requiredOrgType) {
    const currentOrgType = getOrganizationType()

    if (currentOrgType && currentOrgType !== requiredOrgType) {
      if (currentOrgType === "school") {
        return <Navigate to="/organization/school/dashboard" replace />
      } else if (currentOrgType === "company") {
        return <Navigate to="/organization/company/dashboard" replace />
      }
    }
  }

  // All checks passed, render the page
  return children
}

export default ProtectedRoute
