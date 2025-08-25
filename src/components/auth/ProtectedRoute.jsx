// src/components/auth/ProtectedRoute.jsx - Enhanced with better onboarding flow debugging

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

  // ✅ Enhanced onboarding check with detailed logging
  if (userNeedsOnboarding && !currentPath.includes('/onboarding')) {
    console.log("🎯 ProtectedRoute: User needs onboarding, redirecting to onboarding");
    console.log("📊 Onboarding redirect info:", {
      userRole,
      orgType,
      isOnboarded: user.isOnboarded,
      currentPath,
      needsOnboarding: userNeedsOnboarding
    });
    return <Navigate to="/onboarding" replace />;
  }

  // ✅ Enhanced completed onboarding check
  if (!userNeedsOnboarding && currentPath.includes('/onboarding')) {
    console.log("✅ ProtectedRoute: User completed onboarding, redirecting to dashboard");
    
    let redirectPath = '/';
    
    if (userRole === 'student') {
      redirectPath = '/user/student/screening';
    } else if (userRole === 'employee') {
      redirectPath = '/user/employee/screening';
    } else if (userRole === 'psychologist') {
      redirectPath = '/user/psychologist/chat';
    } else if (orgType === 'school') {
      redirectPath = '/organization/school/dashboard';
    } else if (orgType === 'company') {
      redirectPath = '/organization/company/dashboard';
    }
    
    console.log("📍 Dashboard redirect info:", {
      userRole,
      orgType,
      isOnboarded: user.isOnboarded,
      needsOnboarding: userNeedsOnboarding,
      redirectPath
    });
    
    return <Navigate to={redirectPath} replace />;
  }

  // Check specific role requirement
  if (requiredRole && userRole !== requiredRole) {
    console.log(`❌ ProtectedRoute: Role mismatch. Required: ${requiredRole}, User: ${userRole}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check specific organization type requirement
  if (requiredOrgType && orgType !== requiredOrgType) {
    console.log(`❌ ProtectedRoute: Org type mismatch. Required: ${requiredOrgType}, User: ${orgType}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check allowed roles (if specified)
  if (allowedRoles && Array.isArray(allowedRoles) && userRole && !allowedRoles.includes(userRole)) {
    console.log(`❌ ProtectedRoute: Role not in allowed list. User: ${userRole}, Allowed: ${allowedRoles.join(', ')}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Check allowed organization types (if specified)
  if (allowedOrgTypes && Array.isArray(allowedOrgTypes) && orgType && !allowedOrgTypes.includes(orgType)) {
    console.log(`❌ ProtectedRoute: Org type not in allowed list. User: ${orgType}, Allowed: ${allowedOrgTypes.join(', ')}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // Additional check: Ensure user is accessing the correct role-based routes
  // If user is trying to access a role-specific route that doesn't match their role
  if (currentPath.includes('/user/student/') && userRole !== 'student') {
    console.log(`❌ ProtectedRoute: Student route accessed by non-student: ${userRole}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/user/employee/') && userRole !== 'employee') {
    console.log(`❌ ProtectedRoute: Employee route accessed by non-employee: ${userRole}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/user/psychologist/') && userRole !== 'psychologist') {
    console.log(`❌ ProtectedRoute: Psychologist route accessed by non-psychologist: ${userRole}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/organization/school/') && orgType !== 'school') {
    console.log(`❌ ProtectedRoute: School route accessed by non-school org: ${orgType}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }
  
  if (currentPath.includes('/organization/company/') && orgType !== 'company') {
    console.log(`❌ ProtectedRoute: Company route accessed by non-company org: ${orgType}`);
    return <Navigate to={getDefaultRouteForUser(userRole, orgType)} replace />;
  }

  // ✅ SUCCESS: All checks passed, render the protected content
  console.log(`✅ ProtectedRoute: Access granted to ${currentPath} for ${userRole || orgType}`);
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