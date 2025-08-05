import React, { useEffect } from "react";
import { toast } from "sonner";
import ScreeningWelcomePage from "./ScreeningWelcomePage";

/**
 * Container component for Mental Health Screening
 * Handles session management and callbacks
 */
const ScreeningContainer = ({ 
  user, 
  onComplete, 
  onExit, 
  userRole = 'student' 
}) => {
  useEffect(() => {
    // Initialize session when component mounts
    const sessionId = `screening_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log("Screening session initialized:", sessionId);
    
    // Store session info
    try {
      localStorage.setItem('screening_session_id', sessionId);
      localStorage.setItem('screening_start_time', new Date().toISOString());
    } catch (error) {
      console.error("Error initializing session:", error);
    }

    // Cleanup on unmount
    return () => {
      // Don't clear progress data on unmount - only clear on successful completion or explicit reset
      console.log("Screening container unmounted");
    };
  }, []);

  // Handle screening completion
  const handleScreeningComplete = (result, action = 'home') => {
    console.log("Screening completed with result:", result);
    console.log("Action requested:", action);
    
    // Clear session data on successful completion
    try {
      localStorage.removeItem('screening_session_id');
      localStorage.removeItem('screening_start_time');
    } catch (error) {
      console.error("Error clearing session:", error);
    }
    
    // Call parent callback with result and action context
    if (onComplete) {
      onComplete(result, userRole, action);
    }
  };

  // Handle user cancellation/exit
  const handleExit = () => {
    toast.warning('Screening dibatalkan', {
      description: 'Progress tidak tersimpan.'
    });
    
    // Clear all screening data on exit
    try {
      localStorage.removeItem('screening_answers');
      localStorage.removeItem('screening_current_question');
      localStorage.removeItem('screening_session_id');
      localStorage.removeItem('screening_start_time');
    } catch (error) {
      console.error("Error clearing screening data:", error);
    }
    
    if (onExit) {
      onExit(userRole);
    }
  };

  // Check if user has permission to access screening
  const canAccessScreening = () => {
    if (!user) return false;
    return ['student', 'employee'].includes(userRole);
  };

  // Show unauthorized message if needed
  if (!canAccessScreening()) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <span className="material-icons text-6xl text-red-500 mb-4 block">
            block
          </span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Akses Tidak Diizinkan
          </h2>
          <p className="text-gray-600 mb-4">
            Fitur screening hanya tersedia untuk siswa dan karyawan.
          </p>
          <button
            onClick={handleExit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <ScreeningWelcomePage 
      onComplete={handleScreeningComplete}
      onExit={handleExit}
      user={user}
    />
  );
};

export default ScreeningContainer;