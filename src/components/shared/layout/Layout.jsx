// src/components/shared/layout/Layout.jsx

import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudentSidebar from "../../user/student/layout/StudentSidebar";
import { useDashboard } from "../../../hooks/useDashboardMetrics";
import TopRightControl from "./TopRightControl";

const SIDEBAR_EXPANDED_W = 280;
const SIDEBAR_COLLAPSED_W = 60;
const MD_BREAKPOINT = 768;
const RESIZE_DELAY_MS = 350;

const Layout = ({
  organizationType = "school",
  startExpanded = false,
}) => {
  const location = useLocation();

  const [expanded, setExpanded] = useState(startExpanded);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDashboardTab, setSelectedDashboardTab] = useState("home");

  const entityType = organizationType === "company" ? "employee" : "student";
  const { metrics: dashboardMetrics } = useDashboard(entityType);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MD_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setExpanded(false);
  }, [isMobile]);

  useEffect(() => {
    if (!location.pathname.includes("/dashboard")) {
      setSelectedDashboardTab("home");
    }
  }, [location.pathname]);

  const handleDashboardTabChange = (tabId) => {
    setSelectedDashboardTab(tabId);
  };

  const contentMargin = isMobile || (!expanded && !sidebarHovered)
    ? `${SIDEBAR_COLLAPSED_W}px`
    : `${SIDEBAR_EXPANDED_W}px`;

  // Dispatch resize after sidebar animation so charts/tables recalculate
  useEffect(() => {
    const id = setTimeout(() => window.dispatchEvent(new Event("resize")), RESIZE_DELAY_MS);
    return () => clearTimeout(id);
  }, [expanded, sidebarHovered]);

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden">
      <StudentSidebar
        expanded={expanded}
        setExpanded={setExpanded}
        onHoverChange={setSidebarHovered}
        isMobile={isMobile}
        userType={organizationType}
      />

      <div
        className="flex-1 flex flex-col transition-all duration-300 min-h-screen bg-white overflow-x-hidden"
        style={{
          marginLeft: contentMargin,
          width: `calc(100vw - ${contentMargin})`,
          maxWidth: `calc(100vw - ${contentMargin})`,
        }}
      >
        <TopRightControl />

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