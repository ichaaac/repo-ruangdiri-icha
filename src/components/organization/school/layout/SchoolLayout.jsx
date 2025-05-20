// src/components/organization/school/layout/SchoolLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import SchoolSidebar from "../SchoolSidebar";

const SchoolLayout = () => {
  const [expanded, setExpanded] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <SchoolSidebar 
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

export default SchoolLayout;