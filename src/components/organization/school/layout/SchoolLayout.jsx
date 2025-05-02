import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SchoolSidebar from "../SchoolSidebar";
import { apiClient } from "../../../../lib/api";

/**
 * School layout wrapper component with sidebar
 * Enhanced with simultaneous content shifting to match sidebar animation
 * Improved user profile data fetching
 */
const SchoolLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // Start with collapsed sidebar
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const navigate = useNavigate();
  
  // Fetch user profile data with better error handling
  const { 
    data: userData,
    isLoading: userLoading,
    isError: userError
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/users/me");
        // Make sure we extract the user data properly
        const data = response?.data?.data;
        
        // Log the data when received to debug
        console.log("User data received:", data);
        
        // Validate that we have the required fields
        if (!data || typeof data !== 'object') {
          console.error("Invalid user data format received", data);
          throw new Error("Invalid user data format");
        }
        
        return data;
      } catch (error) {
        console.error('User profile API error:', error);
        // Throw the error so React Query can handle it
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Increase retries
    retryDelay: 1000,
    useErrorBoundary: false,
    // Add a fallback value to ensure we have something
    placeholderData: {
      fullName: "Pengguna",
      email: "",
      organization: {
        type: "School"
      }
    }
  });

  // Redirect if there's a user error (e.g., unauthorized)
  useEffect(() => {
    if (userError) {
      navigate('/login');
    }
  }, [userError, navigate]);

  // Calculate content margin based on sidebar state
  const contentMargin = sidebarExpanded || sidebarHovered ? '240px' : '64px';

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="material-icons animate-spin text-[#488bbe] text-4xl">refresh</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <SchoolSidebar 
        expanded={sidebarExpanded} 
        setExpanded={setSidebarExpanded}
        onHoverChange={(isHovered) => {
          setSidebarHovered(isHovered);
        }}
        userData={userData}
      />

      <div 
        className="min-h-screen transition-all duration-300 ease-in-out" 
        style={{ 
          marginLeft: contentMargin,
          // Use the same transition timing as the sidebar to synchronize animations
          transitionProperty: "margin-left",
          transitionDuration: "0.3s",
          transitionTimingFunction: "ease-in-out"
        }} 
      >
        <Outlet />
      </div>
    </div>
  );
};

export default SchoolLayout;