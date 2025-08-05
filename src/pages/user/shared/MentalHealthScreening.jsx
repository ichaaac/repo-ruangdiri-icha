import React, { useState } from 'react';
import ScreeningWelcomePage from '@/components/shared/screening/ScreeningWelcomePage';
import ScreeningAssessment from '@/components/shared/screening/ScreeningAssesment';

function MentalHealthScreeningContainer() {
  // State untuk mengontrol tampilan antara welcome page dan assessment
  const [isStarted, setIsStarted] = useState(false);

  // Fungsi untuk memulai assessment, akan dipicu dari welcome page
  const handleStartAssessment = () => {
    setIsStarted(true);
  };

  return (
    <>
      {!isStarted ? (
        // Tampilkan halaman welcome jika assessment belum dimulai
        <ScreeningWelcomePage onStart={handleStartAssessment} />
      ) : (
        // Tampilkan halaman assessment jika sudah dimulai
        <ScreeningAssessment />
      )}
    </>
  );
}

export default MentalHealthScreeningContainer;