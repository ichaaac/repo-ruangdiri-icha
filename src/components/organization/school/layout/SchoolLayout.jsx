// src/components/organization/school/layout/SchoolLayout.jsx

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SchoolSidebar from "../SchoolSidebar";

/**
 * School layout wrapper component with sidebar
 * Enhanced with better responsive behavior
 */
const SchoolLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  return (
    <div className="min-h-screen bg-[#F8F7FA]">
      <SchoolSidebar 
        expanded={sidebarExpanded} 
        setExpanded={setSidebarExpanded} 
      />

      <div
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{
          marginLeft: sidebarExpanded ? "240px" : "64px",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default SchoolLayout;