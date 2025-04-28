// src/components/organization/company/layout/CompanyLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import CompanySidebar from "../CompanySidebar";

/**
 * Company layout wrapper component with sidebar
 * Enhanced with synchronized content shifting behavior
 */
const CompanyLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // Start with collapsed sidebar
  const [sidebarHovered, setSidebarHovered] = useState(false);
  
  // Calculate content margin based on sidebar state
  const contentMargin = sidebarExpanded || sidebarHovered ? '240px' : '64px';
  
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <CompanySidebar 
        expanded={sidebarExpanded} 
        setExpanded={setSidebarExpanded}
        onHoverChange={(isHovered) => {
          setSidebarHovered(isHovered);
        }}
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

export default CompanyLayout;