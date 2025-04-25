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
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state
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

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check organization type if required
  if (requiredOrgType && user?.organization?.type !== requiredOrgType) {
    // Redirect to appropriate dashboard based on actual org type
    if (user?.organization?.type === 'school') {
      return <Navigate to="/organization/school/dashboard" replace />;
    } else if (user?.organization?.type === 'company') {
      return <Navigate to="/organization/company/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // Render children if all conditions are met
  return children;
};

export default ProtectedRoute;