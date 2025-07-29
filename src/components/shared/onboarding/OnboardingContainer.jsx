// src/components/shared/onboarding/OnboardingContainer.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import OnboardingSplashScreen from './OnboardingSplashScreen';
import OnboardingForm from './OnboardingForm';

/**
 * OnboardingContainer manages the flow between SplashScreen and OnboardingForm
 * without changing the URL after landing on /onboarding.
 */
const OnboardingContainer = () => {
  const { user, needsOnboarding, getUserRole, getOrganizationType, getDefaultRoute } = useAuth();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // If onboarding is already completed, redirect to dashboard.
    // This provides an extra layer of protection if somehow a completed user lands here.
    if (!needsOnboarding() && user) {
      console.log("OnboardingContainer: Onboarding completed, redirecting to dashboard.");
      navigate(getDefaultRoute(), { replace: true });
      return;
    }

    // Determine if the current user type should use this specific form.
    // This container/form is designed for 'student' and 'employee' only.
    const userRole = getUserRole();
    const orgType = getOrganizationType();

    if (userRole === 'psychologist' || orgType) {
      // If a psychologist or organization admin lands here, and they have separate onboarding
      // or no onboarding at all, redirect them appropriately.
      // For now, redirect them directly to their default route if onboarded,
      // or to a "coming soon" page for psychologists if their onboarding form isn't ready.
      // This logic should ideally be handled earlier in ProtectedRoute, but as a safeguard.
      if (needsOnboarding()) { // If they still need onboarding, but this form isn't for them
         // You might want a dedicated PsychologistOnboardingForm or OrgOnboardingForm
         console.warn(`OnboardingContainer: User role/type ${userRole || orgType} not handled by this form. Redirecting.`);
         // For now, just redirect them back to the general path to let ProtectedRoute handle
         // their ultimate destination based on their isOnboarded status.
         // Or, for psychologists who need specific onboarding not implemented yet, send them to a placeholder.
         // Given your `routeConfig`, if they hit `/onboarding` and `needsOnboarding()` is true,
         // they should ideally have their own dedicated onboarding path or a 'coming soon' page directly.
         // For now, let's redirect to default route as a safe exit.
         navigate(getDefaultRoute(), { replace: true });
      } else {
         // If for some reason they are here but don't need onboarding, send them to their dashboard.
         navigate(getDefaultRoute(), { replace: true });
      }
    }
  }, [user, needsOnboarding, getUserRole, getOrganizationType, navigate, getDefaultRoute]);

  const handleStartOnboarding = () => {
    setShowSplash(false); // Switch to show the form
  };

  if (!user) {
    // Still loading user data or not authenticated, ProtectedRoute should handle this.
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-primary">sync</span>
          <span className="text-primary">Loading user data...</span>
        </div>
      </div>
    );
  }

  // Render splash or form based on internal state
  return (
    <>
      {showSplash ? (
        <OnboardingSplashScreen onContinue={handleStartOnboarding} />
      ) : (
        <OnboardingForm />
      )}
    </>
  );
};

export default OnboardingContainer;