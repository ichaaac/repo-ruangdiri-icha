import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SchoolSidebar from "../SchoolSidebar";
import { apiClient, getMe } from "../../../../lib/api";

/**
 * School layout wrapper component with sidebar
 * Enhanced with simultaneous content shifting to match sidebar animation
 * Improved user profile data fetching and consistent query keys
 */
const SchoolLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // Start with collapsed sidebar
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { 
    data: userData,
    isLoading: userLoading,
    isError: userError
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await getMe();
        
        console.log("User data received:", response?.data);
        
        if (response?.data?.status === "success") {
          return response.data.data;
        }
        
        throw new Error(response?.data?.message || "Failed to fetch user data");
      } catch (error) {
        console.error('User profile API error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: 1000,
    // Add a fallback value to ensure we have something
    placeholderData: {
      fullName: "Pengguna",
      email: "",
      organization: {
        type: "school"
      }
    }
  });

  // Redirect if there's a user error (e.g., unauthorized)
  useEffect(() => {
    if (userError) {
      console.error("User fetch error - redirecting to login", userError);
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