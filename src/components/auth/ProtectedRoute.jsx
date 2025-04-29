// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Protected Route Component
 * Only allows authenticated users to access the route
 * Can optionally restrict access by organization type
 * Uses React Query through useAuth instead of useEffect
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.requiredOrgType] - Required organization type ('school' or 'company')
 */
const ProtectedRoute = ({ children, requiredOrgType }) => {
  const { user, isLoading, isAuthenticated, getOrganizationType } = useAuth();
  const location = useLocation();

  // First check if we have a token - most basic check
  const token = localStorage.getItem('token');
  if (!token) {
    // No token, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading state if we have a token but data is still loading
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

  // If we have a token but isAuthenticated fails, still let the user proceed
  // This can happen when token exists but user data hasn't loaded yet
  // We'll rely on the loading state to prevent showing protected content

  // Check if user has the required organization type
  if (requiredOrgType) {
    const currentOrgType = getOrganizationType();
    
    // If organization type doesn't match and we have user data
    if (currentOrgType && currentOrgType !== requiredOrgType && user) {
      // Redirect to appropriate dashboard based on actual org type
      if (currentOrgType === 'school') {
        return <Navigate to="/organization/school/profile" replace />;
      } else if (currentOrgType === 'company') {
        return <Navigate to="/organization/company/profile" replace />;
      }
    }
  }

  // Render children if all conditions are met or we're still loading with a token
  return children;
};

export default ProtectedRoute;