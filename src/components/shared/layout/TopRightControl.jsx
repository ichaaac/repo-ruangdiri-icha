// src/components/shared/layout/TopRightControl.jsx - Updated with notifications

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown";
import { useNotificationDropdown } from "@/components/shared/notifications/hooks/useNotificationDropdown";

const TopRightControl = ({ className = "", isAbsolute = true }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get notification data for dropdown
  const { unreadCount } = useNotificationDropdown();

  // US-AC-Notif-1-4: Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotif(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // US-AC-Notif-1-6: Close dropdown when navigating to other pages
  useEffect(() => {
    setOpenNotif(false);
  }, [location.pathname]);

  // US-AC-Notif-2-1: Navigate to organization-specific notification page
  const handleViewAllNotifications = () => {
    setOpenNotif(false);
    
    // Determine organization type from current path
    const isSchool = location.pathname.includes('/organization/school');
    const isCompany = location.pathname.includes('/organization/company');
    
    if (isSchool) {
      navigate("/organization/school/notifications");
    } else if (isCompany) {
      navigate("/organization/company/notifications");
    } else {
      // Fallback - shouldn't happen in normal flow
      navigate("/notifications");
    }
  };

  const wrapperClass = isAbsolute
    ? "absolute top-[29px] right-[12px]"
    : "flex justify-end w-full";

  return (
    <div className={`${wrapperClass} ${className} flex items-center gap-4 sm:gap-6`}>
      {/* Language Switch */}
      <div className="flex items-center">
        <span className="font-bold text-primary text-sm sm:text-base">ID</span>
        <span className="mx-2 text-primary text-sm sm:text-base">/</span>
        <span className="text-zinc-500 text-sm sm:text-base">EN</span>
      </div>

      {/* Notification Container */}
      <div className="relative" ref={notifRef}>
        <button
          aria-label="Notifications"
          onClick={() => setOpenNotif(!openNotif)}
          className="material-icons text-zinc-500 text-xl sm:text-2xl hover:text-[#488BBE] transition-colors relative"
        >
          notifications
          
          {/* US-AC-Notif-1-1: Badge indicator dengan number merah */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#EE4266] text-white text-[8px] font-semibold rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* US-AC-Notif-1-2, US-AC-Notif-1-3: Dropdown */}
        {openNotif && (
          <NotificationDropdown
            onViewAll={handleViewAllNotifications}
            onClose={() => setOpenNotif(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TopRightControl;