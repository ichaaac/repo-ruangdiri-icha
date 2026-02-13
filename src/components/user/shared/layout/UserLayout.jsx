// src/components/user/shared/layout/UserLayout.jsx - Shared Layout untuk Student/Employee

import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import StudentSidebar from "../../student/layout/StudentSidebar";
import { useAuth } from "../../../../hooks/useAuth";
import ChatWidget from "../../../shared/chat-widget/ChatWidget";
import TopRightControl from "../../../shared/layout/TopRightControl";
import DevAuthGate from "../../../shared/dev-auth/DevAuthGate";

/**
 * Responsive Layout Component untuk Student dan Employee
 */
const UserLayout = ({ 
  userType = "student", // "student" atau "employee"
  startExpanded = false,
}) => {
  const location = useLocation();
  const { user } = useAuth?.() || { user: {} };
  
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

  // Calculate content margin with proper responsive spacing
  const getContentMargin = () => {
    if (isMobile) {
      return "60px"; // Always collapsed on mobile
    }
    
    // Desktop: Match exact sidebar width (no gap - pages handle their own padding)
    if (expanded || sidebarHovered) {
      return userType === "student" ? "280px" : "237px";
    }
    return "60px"; // exact sidebar width
  };

  // Calculate ChatWidget positioning based on sidebar state
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
      <DevAuthGate />

      {/* Sidebar - Student gets custom sidebar */}
      {userType === "student" ? (
        <StudentSidebar
          expanded={expanded}
          setExpanded={setExpanded}
          onHoverChange={setSidebarHovered}
          isMobile={isMobile}
        />
      ) : (
        <UserSidebar
          expanded={expanded}
          setExpanded={setExpanded}
          onHoverChange={setSidebarHovered}
          userType={userType}
          isMobile={isMobile}
        />
      )}

      {/* Main content area with responsive margin */}
      <div
        className="flex-1 transition-all duration-300 min-h-screen bg-white overflow-x-hidden"
        style={{
          marginLeft: getContentMargin(),
          width: `calc(100vw - ${getContentMargin()})`,
          maxWidth: `calc(100vw - ${getContentMargin()})`,
        }}
      >
        <TopRightControl transparent={location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/booking-session') || location.pathname.endsWith('/booking-chat') || location.pathname.endsWith('/screening')} />
        <Outlet context={{
          sidebarExpanded: expanded || sidebarHovered,
          userType,
        }} />
      </div>

      {/* ChatWidget - Layout Level Implementation */}
      <div style={getChatWidgetStyle()}>
        <ChatWidget 
          className="layout-chat-widget"
          sidebarExpanded={expanded || sidebarHovered}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default UserLayout;
