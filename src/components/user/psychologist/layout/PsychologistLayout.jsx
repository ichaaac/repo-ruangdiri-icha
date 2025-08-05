// src/components/user/psychologist/layout/PsychologistLayout.jsx - Layout khusus untuk Psikolog

import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PsychologistSidebar from "./PsychologistSidebar";
import { useAuth } from "../../../../hooks/useAuth";
import TopRightControl from "../../../shared/layout/TopRightControl";

/**
 * Responsive Layout Component khusus untuk Psikolog
 * Hanya memiliki akses ke chat system
 */
const PsychologistLayout = ({ 
  startExpanded = false,
}) => {
  const location = useLocation();
  const { user } = useAuth?.() || { user: {} };
  
  const [expanded, setExpanded] = useState(startExpanded);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setExpanded(false);
    }
  }, [isMobile]);

  // Calculate content margin with proper responsive spacing
  const getContentMargin = () => {
    if (isMobile) {
      return "60px"; // Always collapsed on mobile
    }
    
    // Desktop: Use different spacing based on sidebar state
    if (expanded || sidebarHovered) {
      return "257px"; // 237px sidebar + 20px gap
    }
    return "80px"; // 60px sidebar + 20px gap
  };

  // Force window resize event when sidebar state changes
  useEffect(() => {
    const dispatchResize = () => {
      window.dispatchEvent(new Event('resize'));
    };

    // Dispatch resize event after sidebar animation completes
    const timeoutId = setTimeout(dispatchResize, 350);
    
    return () => clearTimeout(timeoutId);
  }, [expanded, sidebarHovered]);

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden">
      <TopRightControl />
      
      {/* Psychologist Sidebar */}
      <PsychologistSidebar 
        expanded={expanded} 
        setExpanded={setExpanded} 
        onHoverChange={setSidebarHovered}
        isMobile={isMobile}
      />

      {/* Main content area with responsive margin */}
      <div 
        className="flex-1 transition-all duration-300 min-h-screen bg-white overflow-x-hidden"
        style={{ 
          marginLeft: getContentMargin(),
          width: `calc(100vw - ${getContentMargin()})`,
          maxWidth: `calc(100vw - ${getContentMargin()})`,
        }}
      >
        <Outlet context={{ 
          sidebarExpanded: expanded || sidebarHovered,
          userType: "psychologist",
        }} />
      </div>
    </div>
  );
};

export default PsychologistLayout;