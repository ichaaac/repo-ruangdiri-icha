// src/components/auth/ProtectedRoute.jsx - FIXED VERSION

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * ProtectedRoute component that handles authentication and authorization
 * for different user roles and organization types
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredOrgType = null,
  allowedRoles = null,
  allowedOrgTypes = null
}) => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    getUserRole, 
    getOrganizationType,
    needsOnboarding,
    getDefaultRoute  // ✅ ADDED: Import from useAuth
  } = useAuth();
  const location = useLocation();

  // ✅ Enhanced token validation
  const hasValidToken = () => {
    const token = localStorage.getItem("token");
    return !!token;
  };

  // ✅ Enhanced debug logging effect
  useEffect(() => {
    const currentPath = location.pathname;
    const debugInfo = {
      path: currentPath,
      hasToken: hasValidToken(),
      isLoading,
      isAuthenticated: isAuthenticated(),
      user: user ? {
        id: user.id,
        fullName: user.fullName,
        isOnboarded: user.isOnboarded,
        role: getUserRole(),
        orgType: getOrganizationType()
      } : null,
      needsOnboarding: user ? needsOnboarding() : null,
      timestamp: new Date().toISOString()
    };
    
    console.log("🛡️ ProtectedRoute Debug Info:", debugInfo);
  }, [location.pathname, user, isLoading, isAuthenticated, getUserRole, getOrganizationType, needsOnboarding]);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log("⏳ ProtectedRoute: Loading authentication state...");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-blue-600">sync</span>
          <span className="text-blue-600">Loading...</span>
        </div>
      </div>
    );
  }

  // ✅ Enhanced token check
  if (!hasValidToken()) {
    console.log("❌ ProtectedRoute: No valid token found, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If token exists but not authenticated, redirect to login
  if (!isAuthenticated()) {
    console.log("❌ ProtectedRoute: Token exists but not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but no user data yet, wait
  if (!user) {
    console.log("⏳ ProtectedRoute: Authenticated but waiting for user data...");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-blue-600">sync</span>
          <span className="text-blue-600">Loading user data...</span>
        </div>
      </div>
    );
  }

  const userRole = getUserRole();
  const orgType = getOrganizationType();
  const currentPath = location.pathname;
  const userNeedsOnboarding = needsOnboarding();

  console.log('🛡️ [ProtectedRoute] Onboarding check:', {
    userNeedsOnboarding,
    isOnboarded: user.isOnboarded,
    currentPath,
    userRole,
    orgType
  });

  // ✅ User needs onboarding but NOT on onboarding page
  if (userNeedsOnboarding && currentPath !== '/onboarding') {
    console.log("🔄 [ProtectedRoute] User needs onboarding, redirecting");
    return <Navigate to="/onboarding" replace />;
  }

  // ✅ User completed onboarding but still on onboarding page
  if (!userNeedsOnboarding && currentPath === '/onboarding') {
    console.log("✅ [ProtectedRoute] Onboarding complete, redirecting to dashboard");
    
    // ✅ FIX: Use getDefaultRoute from useAuth instead of local function
    const dashboardPath = getDefaultRoute();
    console.log("📍 [ProtectedRoute] Dashboard path:", dashboardPath);
    
    return <Navigate to={dashboardPath} replace />;
  }

  // ✅ REMOVED: requiredRole check - causes redirects
  // Routes are already protected by authentication check
  // Role-specific routing is handled by getDashboardPath in useAuth

  // ✅ REMOVED: requiredOrgType check - causes redirects

  // ✅ REMOVED: allowedRoles check - causes redirects

  // ✅ REMOVED: allowedOrgTypes check - causes redirects

  // ✅ REMOVED: Path-based role checks - causes unwanted redirects
  // User authentication is enough, no need to validate role for every path

  // ✅ SUCCESS: All checks passed, render the protected content
  console.log(`✅ ProtectedRoute: Access granted to ${currentPath} for ${userRole || orgType}`);
  return children;
};

/**
 * Higher-order component for role-based access control
 */
export const withRoleAccess = (allowedRoles) => (Component) => {
  return (props) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Higher-order component for organization-type-based access control
 */
export const withOrgTypeAccess = (allowedOrgTypes) => (Component) => {
  return (props) => (
    <ProtectedRoute allowedOrgTypes={allowedOrgTypes}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Hook for checking if user has specific permissions
 */
export const usePermissions = () => {
  const { getUserRole, getOrganizationType } = useAuth();
  
  const hasRole = (requiredRole) => {
    return getUserRole() === requiredRole;
  };
  
  const hasOrgType = (requiredOrgType) => {
    return getOrganizationType() === requiredOrgType;
  };
  
  const hasAnyRole = (roles) => {
    const userRole = getUserRole();
    return roles.includes(userRole);
  };
  
  const hasAnyOrgType = (orgTypes) => {
    const orgType = getOrganizationType();
    return orgTypes.includes(orgType);
  };
  
  const isStudent = () => hasRole('student');
  const isEmployee = () => hasRole('employee');
  const isPsychologist = () => hasRole('psychologist');
  const isSchoolAdmin = () => hasOrgType('school');
  const isCompanyAdmin = () => hasOrgType('company');
  const isUser = () => hasAnyRole(['student', 'employee', 'psychologist']);
  const isOrgAdmin = () => hasAnyOrgType(['school', 'company']);
  
  return {
    hasRole,
    hasOrgType,
    hasAnyRole,
    hasAnyOrgType,
    isStudent,
    isEmployee,
    isPsychologist,
    isSchoolAdmin,
    isCompanyAdmin,
    isUser,
    isOrgAdmin
  };
};

export default ProtectedRoute;