import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CompanySidebar from "../CompanySidebar";
import { apiClient } from "../../../../lib/api";

/**
 * Company layout wrapper component with sidebar
 * Enhanced with simultaneous content shifting to match sidebar animation
 * Improved user profile data fetching
 */
const CompanyLayout = () => {
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
        type: "Company"
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

  // Ensure content margin transitions are smooth and coordinated with sidebar
  const contentStyle = {
    marginLeft: contentMargin,
    // Use slightly slower transition for content to ensure it doesn't move ahead of sidebar
    transition: "margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="material-icons animate-spin text-[#488bbe] text-4xl">refresh</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <CompanySidebar 
        expanded={sidebarExpanded} 
        setExpanded={setSidebarExpanded}
        onHoverChange={(isHovered) => {
          setSidebarHovered(isHovered);
        }}
        userData={userData}
      />

      <div 
        className="min-h-screen bg-white"
        style={contentStyle}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default CompanyLayout;