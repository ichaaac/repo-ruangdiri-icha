// src/components/auth/ProtectedRoute.jsx - FIXED VERSION

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ADMIN_LEVEL_RANK } from '../../lib/adminScope';

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

  // ✅ FIX: At the very end, just render children
  // Don't check onboarding here - that's handled by redirectAfterLogin
  console.log('✅ ProtectedRoute: Access granted to', location.pathname, 'for', getUserRole());
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
  const { getUserRole, getOrganizationType, getAdminLevel } = useAuth();

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

  // Admin hierarchy: cabang(1) < wilayah(2) < pusat(3)
  const isAdminPusat = () => isOrgAdmin() && getAdminLevel() === 'pusat';
  const isAdminWilayah = () => isOrgAdmin() && getAdminLevel() === 'wilayah';
  const isAdminCabang = () => isOrgAdmin() && getAdminLevel() === 'cabang';
  const hasMinAdminLevel = (minLevel) => {
    if (!isOrgAdmin()) return false;
    return (ADMIN_LEVEL_RANK[getAdminLevel()] || 0) >= (ADMIN_LEVEL_RANK[minLevel] || 0);
  };

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
    isOrgAdmin,
    isAdminPusat,
    isAdminWilayah,
    isAdminCabang,
    hasMinAdminLevel
  };
};

export default ProtectedRoute;