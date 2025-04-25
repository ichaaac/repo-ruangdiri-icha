import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SchoolSidebar from "../SchoolSidebar";

/**
 * School layout wrapper component with sidebar
 * Simple layout that only includes sidebar and outlet
 */
const SchoolLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  
  // Determine effective sidebar state for content positioning
  const isSidebarOpen = sidebarExpanded || sidebarHovered;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <SchoolSidebar 
          expanded={sidebarExpanded} 
          setExpanded={setSidebarExpanded} 
          onHoverChange={setSidebarHovered} 
        />

        <div
          className="w-full min-h-screen transition-all duration-300 ease-in-out"
          style={{
            marginLeft: isSidebarOpen ? "200px" : "70px",
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SchoolLayout;