// src/components/shared/layout/Layout.jsx - WITH CHATWIDGET INTEGRATION

import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useDashboard } from "../../../hooks/useDashboardMetrics";
import { useAuth } from "../../../hooks/useAuth";
import ChatWidget from "../chat-widget/ChatWidget";
import TopRightControl from "./TopRightControl";

/**
 * Responsive Layout Component for both School and Company
 * ENHANCED: Added ChatWidget integration with sidebar-aware positioning
 */
const Layout = ({ 
  organizationType = "school", 
  menuItems = [],
  startExpanded = false,
}) => {
  const location = useLocation();
  const { user } = useAuth?.() || { user: {} };
  
  const [expanded, setExpanded] = useState(startExpanded);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDashboardTab, setSelectedDashboardTab] = useState("home");

  // Determine entity type based on organization
  const entityType = organizationType === "company" ? "employee" : "student";
  
  // Get dashboard metrics for sidebar state management
  const { metrics: dashboardMetrics } = useDashboard(entityType);

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

  // FIXED: Reset dashboard tab when navigating away from dashboard
  useEffect(() => {
    if (!location.pathname.includes("/dashboard")) {
      setSelectedDashboardTab("home");
    }
  }, [location.pathname]);

  // Handle dashboard tab changes
  const handleDashboardTabChange = (tabId) => {
    setSelectedDashboardTab(tabId);
  };

  // FIXED: Calculate content margin with proper responsive spacing
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

  // 🔥 Calculate ChatWidget positioning based on sidebar state
  const getChatWidgetStyle = () => {
    if (isMobile) {
      // Mobile: Standard bottom-right positioning
      return {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 40 // Below sidebar (z-40) but above content
      };
    }
    
    // Desktop: Adjust for sidebar
    const sidebarWidth = (expanded || sidebarHovered) ? 237 : 60;
    return {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 40 // Below sidebar but above content
    };
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
      <TopRightControl  />
      {/* FIXED: Responsive Sidebar with dashboard metrics */}
      <Sidebar 
        expanded={expanded} 
      setExpanded={setExpanded} 
        onHoverChange={setSidebarHovered}
        organizationType={organizationType}
        menuItems={menuItems}
        isMobile={isMobile}
        selectedDashboardTab={selectedDashboardTab}
        onDashboardTabChange={handleDashboardTabChange}
        dashboardMetrics={dashboardMetrics} // FIXED: Pass metrics for tab state
      />

      {/* Main content area with responsive margin - FIXED: Proper stretching */}
      <div 
        className="flex-1 transition-all duration-300 min-h-screen bg-white overflow-x-hidden"
        style={{ 
          marginLeft: getContentMargin(),
          // FIXED: Allow stretching when sidebar collapses
          width: `calc(100vw - ${getContentMargin()})`,
          maxWidth: `calc(100vw - ${getContentMargin()})`,
        }}
      >
        <Outlet context={{ 
          sidebarExpanded: expanded || sidebarHovered,
          selectedDashboardTab,
          onDashboardTabChange: handleDashboardTabChange,
          dashboardMetrics, // FIXED: Pass metrics to children
        }} />
      </div>

      {/* 🔥 CHATWIDGET - Layout Level Implementation */}
      <div style={getChatWidgetStyle()}>
        <ChatWidget 
          className="layout-chat-widget"
          // Pass sidebar state for potential future enhancements
          sidebarExpanded={expanded || sidebarHovered}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default Layout;
