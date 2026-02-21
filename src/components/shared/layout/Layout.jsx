// src/components/shared/layout/Layout.jsx - WITH CHATWIDGET INTEGRATION

import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudentSidebar from "../../user/student/layout/StudentSidebar";
import { useDashboard } from "../../../hooks/useDashboardMetrics";
import TopRightControl from "./TopRightControl";
// import { useAuth } from "../../../hooks/useAuth";
// import ChatWidget from "../chats/ChatWidget";

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

  // Handle dashboard tab changess
  const handleDashboardTabChange = (tabId) => {
    setSelectedDashboardTab(tabId);
  };

  // FIXED: Calculate content margin with proper responsive spacing
  const getContentMargin = () => {
    if (isMobile) {
      return "60px"; // Always collapsed on mobile
    }
    
    // Desktop: Match StudentSidebar width
    if (expanded || sidebarHovered) {
      return "280px";
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
      {/* Sidebar */}
      <StudentSidebar
        expanded={expanded}
        setExpanded={setExpanded}
        onHoverChange={setSidebarHovered}
        isMobile={isMobile}
        userType={organizationType}
      />

      {/* Main content area: TopBar + Page content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300 min-h-screen bg-white overflow-x-hidden"
        style={{
          marginLeft: getContentMargin(),
          width: `calc(100vw - ${getContentMargin()})`,
          maxWidth: `calc(100vw - ${getContentMargin()})`,
        }}
      >
        {/* Top navbar */}
        <TopRightControl />

        {/* Page content */}
        <div className="flex-1">
          <Outlet context={{
            sidebarExpanded: expanded || sidebarHovered,
            selectedDashboardTab,
            onDashboardTabChange: handleDashboardTabChange,
            dashboardMetrics,
          }} />
        </div>
      </div>
    </div>
  );
};

export default Layout;