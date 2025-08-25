// src/components/shared/onboarding/OnboardingContainer.jsx - FIXED: Remove infinite loop

import React, { useState, useEffect, useRef } from 'react';
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
 * OnboardingContainer - FIXED: Simple logic without infinite loops
 */
const OnboardingContainer = () => {
  const { user, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  
  // State untuk mengontrol tampilan: 'splash' atau 'form'
  const [view, setView] = useState('splash');
  const hasRedirected = useRef(false);

  // ✅ FIXED: Simple useEffect with minimal dependencies
  useEffect(() => {
    if (!user || hasRedirected.current) return;

    const currentNeedsOnboarding = needsOnboarding();
    
    // Debug log - only once per user change
    console.log("🔍 OnboardingContainer Check:", {
      userId: user.id,
      isOnboarded: user.isOnboarded,
      needsOnboarding: currentNeedsOnboarding,
      userRole: user.role,
      orgType: user.organization?.type
    });

    // If user doesn't need onboarding, redirect immediately
    if (!currentNeedsOnboarding) {
      console.log("✅ User is already onboarded, redirecting to dashboard");
      hasRedirected.current = true;
      
      // Determine redirect path
      let redirectPath = '/';
      const userRole = user.role;
      const orgType = user.organization?.type;
      
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
      
      console.log("📍 Redirecting to:", redirectPath);
      navigate(redirectPath, { replace: true });
    } else {
      console.log("⏳ User needs onboarding, staying on onboarding page");
    }
  }, [user?.id, user?.isOnboarded]); // ✅ FIXED: Only depend on user ID and isOnboarded status

  // ✅ Simple start handler
  const handleStart = () => {
    console.log("🚀 Starting onboarding form");
    setView('form');
  };

  // Loading state while no user data
  if (!user) {
    return <LoadingScreen />;
  }

  // Additional check - if user doesn't need onboarding, show redirecting screen
  if (!needsOnboarding()) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-primary">sync</span>
          <span className="text-primary">Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  // Render based on view state
  if (view === 'splash') {
    return <OnboardingSplashScreen onContinue={handleStart} />;
  }
  
  if (view === 'form') {
    return <OnboardingForm />;
  }

  // Fallback
  return <LoadingScreen />;
};

export default OnboardingContainer;