// src/components/auth/ProtectedRoute.jsx - Fixed Protected Route with Better Token Management

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
    needsOnboarding
  } = useAuth();
  const location = useLocation();

  // ✅ IMPROVED: Better token validation
  const hasValidToken = () => {
    const token = localStorage.getItem("token");
    return !!token;
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-blue-600">sync</span>
          <span className="text-blue-600">Loading...</span>
        </div>
      </div>
    );
  }

  // ✅ IMPROVED: Check token first, then authentication
  if (!hasValidToken()) {
    console.log("No valid token found, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If token exists but not authenticated, redirect to login
  if (!isAuthenticated()) {
    console.log("Token exists but not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but no user data yet, wait
  if (!user) {
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

  // Check if user needs onboarding (but allow access to onboarding pages)
  if (needsOnboarding() && !location.pathname.includes('/onboarding')) {
    console.log("User needs onboarding, redirecting to onboarding");
    return <Navigate to="/onboarding" replace />;
  }

  // If user completed onboarding but still on onboarding page, redirect to appropriate dashboard
  if (!needsOnboarding() && location.pathname.includes('/onboarding')) {
    console.log("User completed onboarding, redirecting to dashboard");
    if (userRole === 'student') {
      return <Navigate to="/user/student/screening" replace />;
    } else if (userRole === 'employee') {
      return <Navigate to="/user/employee/screening" replace />;
    } else if (userRole === 'psychologist') {
      return <Navigate to="/user/psychologist/chat" replace />;
    } else if (orgType === 'school') {
      return <Navigate to="/organization/school/dashboard" replace />;
    } else if (orgType === 'company') {
      return <Navigate to="/organization/company/dashboard" replace />;
    }
  }

  // Check specific role requirement
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Role mismatch. Required: ${requiredRole}, User: ${userRole}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check specific organization type requirement
  if (requiredOrgType && orgType !== requiredOrgType) {
    console.log(`Org type mismatch. Required: ${requiredOrgType}, User: ${orgType}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check allowed roles (if specified)
  if (allowedRoles && Array.isArray(allowedRoles) && userRole && !allowedRoles.includes(userRole)) {
    console.log(`Role not in allowed list. User: ${userRole}, Allowed: ${allowedRoles.join(', ')}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check allowed organization types (if specified)
  if (allowedOrgTypes && Array.isArray(allowedOrgTypes) && orgType && !allowedOrgTypes.includes(orgType)) {
    console.log(`Org type not in allowed list. User: ${orgType}, Allowed: ${allowedOrgTypes.join(', ')}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Additional check: Ensure user is accessing the correct role-based routes
  const currentPath = location.pathname;
  
  // If user is trying to access a role-specific route that doesn't match their role
  if (currentPath.includes('/user/student/') && userRole !== 'student') {
    console.log(`Student route accessed by non-student: ${userRole}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/user/employee/') && userRole !== 'employee') {
    console.log(`Employee route accessed by non-employee: ${userRole}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/user/psychologist/') && userRole !== 'psychologist') {
    console.log(`Psychologist route accessed by non-psychologist: ${userRole}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/organization/school/') && orgType !== 'school') {
    console.log(`School route accessed by non-school org: ${orgType}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/organization/company/') && orgType !== 'company') {
    console.log(`Company route accessed by non-company org: ${orgType}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // ✅ SUCCESS: All checks passed, render the protected content
  console.log(`Access granted to ${currentPath} for ${userRole || orgType}`);
  return children;
};

/**
 * Helper function to get the default route for a user based on their role and org type
 */
const getDefaultRouteForUser = (userRole, orgType) => {
  if (userRole === 'student') return '/user/student/screening';
  if (userRole === 'employee') return '/user/employee/screening';
  if (userRole === 'psychologist') return '/user/psychologist/chat';
  if (orgType === 'school') return '/organization/school/dashboard';
  if (orgType === 'company') return '/organization/company/dashboard';
  return '/'; // Fallback to homepage
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