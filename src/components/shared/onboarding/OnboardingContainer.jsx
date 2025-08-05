// src/components/shared/onboarding/OnboardingContainer.jsx - VERSI BARU YANG LEBIH SEDERHANA

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import OnboardingSplashScreen from './OnboardingSplashScreen';
import OnboardingForm from './OnboardingForm';

const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="flex items-center space-x-2">
      <span className="material-icons animate-spin text-primary">sync</span>
      <span className="text-primary">Loading User Data...</span>
    </div>
  </div>
);

/**
 * OnboardingContainer MENGELOLA ALUR ONBOARDING.
 * Tugasnya hanya menampilkan Splash Screen atau Form.
 * TIDAK melakukan redirect berdasarkan role.
 */
const OnboardingContainer = () => {
  const { user, needsOnboarding, getDefaultRoute } = useAuth();
  const navigate = useNavigate();
  
  // State untuk mengontrol tampilan: 'splash' atau 'form'
  const [view, setView] = useState('splash');

  useEffect(() => {
    // Pengaman: Jika karena suatu alasan user yang sudah onboarded
    // masuk ke halaman ini, arahkan mereka ke dashboard.
    if (user && !needsOnboarding()) {
      console.log("OnboardingContainer: User is already onboarded. Redirecting...");
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [user, needsOnboarding, navigate, getDefaultRoute]);

  // Fungsi yang akan dipanggil oleh SplashScreen untuk beralih ke form
  const handleStart = () => {
    setView('form');
  };

  // Selama data user belum siap, tampilkan loading.
  if (!user) {
    return <LoadingScreen />;
  }

  // Render berdasarkan state 'view'
  if (view === 'splash') {
    return <OnboardingSplashScreen onContinue={handleStart} />;
  }
  
  if (view === 'form') {
    return <OnboardingForm />;
  }

  // Fallback (seharusnya tidak pernah terjadi)
  return <LoadingScreen />;
};

export default OnboardingContainer;