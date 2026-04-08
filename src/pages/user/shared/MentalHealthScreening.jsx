import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import ScreeningWelcomePage from '@/components/shared/screening/ScreeningWelcomePage';
import ScreeningAssessment from '@/components/shared/screening/ScreeningAssesment';

function MentalHealthScreeningContainer() {
  const [isStarted, setIsStarted] = useState(false);
  const navigate = useNavigate();
  const { userType } = useOutletContext?.() || {};

  const handleStartAssessment = () => {
    setIsStarted(true);
  };

  const handleComplete = (result, action) => {
    if (action === "booking") {
      navigate(`/user/${userType || 'employee'}/booking-session`);
    }
  };

  return (
    <>
      {!isStarted ? (
        <ScreeningWelcomePage onStart={handleStartAssessment} onComplete={handleComplete} />
      ) : (
        <ScreeningAssessment />
      )}
    </>
  );
}

export default MentalHealthScreeningContainer;