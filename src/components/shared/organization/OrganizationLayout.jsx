// src/components/shared/organization/OrganizationLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import OrganizationSidebar from "./OrganizationSidebar";

const OrganizationLayout = ({ organizationType = "school" }) => {
  const [expanded, setExpanded] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <OrganizationSidebar 
        organizationType={organizationType}
        expanded={expanded} 
        setExpanded={setExpanded} 
        onHoverChange={setSidebarHovered}
      />
      
      <div 
        className="flex-1 transition-all duration-300"
        style={{ 
          marginLeft: expanded ? "237px" : sidebarHovered ? "237px" : "59px" 
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default OrganizationLayout;