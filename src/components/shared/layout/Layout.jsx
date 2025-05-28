// src/components/shared/layout/Layout.jsx - Responsive Layout Component
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

/**
 * Responsive Layout Component for both School and Company
 */
const Layout = ({ 
  organizationType = "school", 
  menuItems = [],
  startExpanded = false 
}) => {
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

  // Calculate content margin - responsive design with forced re-render
  const getContentMargin = () => {
    if (isMobile) {
      return "60px"; // Always collapsed on mobile
    }
    
    if (expanded || sidebarHovered) {
      return "237px";
    }
    return "60px";
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
      {/* Responsive Sidebar */}
      <Sidebar 
        expanded={expanded} 
        setExpanded={setExpanded} 
        onHoverChange={setSidebarHovered}
        organizationType={organizationType}
        menuItems={menuItems}
        isMobile={isMobile}
      />

      {/* Main content area with responsive margin */}
      <div 
        className="flex-1 transition-all duration-300 min-h-screen bg-white overflow-x-hidden"
        style={{ 
          marginLeft: getContentMargin()
        }}
      >
        <Outlet />
      </div>
    </div>
);
};

export default Layout;
