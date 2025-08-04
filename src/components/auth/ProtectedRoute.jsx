// src/components/auth/ProtectedRoute.jsx - Updated Protected Route

import React from 'react';
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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-primary">sync</span>
          <span className="text-primary">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but no user data yet, wait
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-primary">sync</span>
          <span className="text-primary">Loading user data...</span>
        </div>
      </div>
    );
  }

  const userRole = getUserRole();
  const orgType = getOrganizationType();

  // Check if user needs onboarding (but allow access to onboarding pages)
  if (needsOnboarding() && !location.pathname.includes('/onboarding')) {
    // All users who need onboarding go to unified onboarding system
    return <Navigate to="/onboarding" replace />;
  }

 if (!needsOnboarding() && location.pathname.includes('/onboarding')) {
    // --- PERUBAHAN DI SINI (1) ---
    if (userRole === 'student') {
      return <Navigate to="/user/student/screening" replace />; // Diubah ke screening
    } else if (userRole === 'employee') {
      return <Navigate to="/user/employee/screening" replace />; // Diubah ke screening
    } 
    // --- AKHIR PERUBAHAN (1) ---
    else if (userRole === 'psychologist') {
      return <Navigate to="/user/psychologist/chat" replace />;
    } else if (orgType === 'school') {
      return <Navigate to="/organization/school/dashboard" replace />;
    } else if (orgType === 'company') {
      return <Navigate to="/organization/company/dashboard" replace />;
    }
  }

  // Check specific role requirement
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard or deny access
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check specific organization type requirement
  if (requiredOrgType && orgType !== requiredOrgType) {
    // Redirect to appropriate dashboard or deny access
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check allowed roles (if specified)
  if (allowedRoles && Array.isArray(allowedRoles) && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check allowed organization types (if specified)
  if (allowedOrgTypes && Array.isArray(allowedOrgTypes) && orgType && !allowedOrgTypes.includes(orgType)) {
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Additional check: Ensure user is accessing the correct role-based routes
  const currentPath = location.pathname;
  
  // If user is trying to access a role-specific route that doesn't match their role
  if (currentPath.includes('/user/student/') && userRole !== 'student') {
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/user/employee/') && userRole !== 'employee') {
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/user/psychologist/') && userRole !== 'psychologist') {
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/organization/school/') && orgType !== 'school') {
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/organization/company/') && orgType !== 'company') {
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // If all checks pass, render the protected content
  return children;
};

/**
 * Helper function to get the default route for a user based on their role and org type
 */
const getDefaultRouteForUser = (userRole, orgType) => {
  // --- PERUBAHAN DI SINI (2) ---
  if (userRole === 'student') return '/user/student/screening'; // Diubah ke screening
  if (userRole === 'employee') return '/user/employee/screening'; // Diubah ke screening
  // --- AKHIR PERUBAHAN (2) ---
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