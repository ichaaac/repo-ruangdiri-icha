// src/components/auth/ProtectedRoute.jsx - FINAL FIX LOGIC

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, requiredOrgType }) => {
  const { user, isLoading, getOrganizationType } = useAuth();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ==========================================================
  // !!! INI DIA LOGIKA YANG SUDAH DIBENERIN TOTAL !!!
  // ==========================================================
  // Sekarang kita cek apakah user BELUM onboarding (isOnboarded === true)
  if (user.isOnboarded === true && !location.pathname.startsWith('/onboarding')) {
    // Kalo BELUM onboarding & coba akses halaman lain, paksa ke splash screen
    return <Navigate to="/onboarding" replace />;
  }

  // --- Cek required org type ---
  if (requiredOrgType) {
    const currentOrgType = getOrganizationType();

    if (currentOrgType && currentOrgType !== requiredOrgType) {
      if (currentOrgType === 'school') {
        return <Navigate to="/organization/school/profile" replace />;
      } else if (currentOrgType === 'company') {
        return <Navigate to="/organization/company/profile" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;