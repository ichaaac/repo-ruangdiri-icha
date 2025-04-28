import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import CompanySidebar from "../CompanySidebar";

/**
 * Company layout wrapper component with sidebar
 * Enhanced with better responsive behavior
 */
const CompanyLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  return (
    <div className="min-h-screen bg-[#F8F7FA]">
      <CompanySidebar 
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

export default CompanyLayout;