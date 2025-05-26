// src/components/shared/layout/Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

/**
 * Reusable Layout Component for both School and Company
 * @param {Object} props
 * @param {string} props.organizationType - "school" or "company"
 * @param {Array} props.menuItems - Array of menu items for the sidebar
 * @param {boolean} props.startExpanded - Whether to start with expanded sidebar (default: false)
 */
const Layout = ({ 
  organizationType = "school", 
  menuItems = [],
  startExpanded = false 
}) => {
  const [expanded, setExpanded] = useState(startExpanded);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Calculate content margin - responsive design
  const getContentMargin = () => {
    if (expanded || sidebarHovered) {
      return "237px";
    }
    return "59px";
  };

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden">
      {/* Sidebar component with expansion controls */}
      <Sidebar 
        expanded={expanded} 
        setExpanded={setExpanded} 
        onHoverChange={setSidebarHovered}
        organizationType={organizationType}
        menuItems={menuItems}
      />
      
      {/* Main content area with responsive margin based on sidebar state */}
      <div 
        className="flex-1 transition-all duration-300 min-h-screen bg-white"
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