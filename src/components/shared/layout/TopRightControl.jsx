// src/components/shared/layout/TopRightControl.jsx - FIXED: KEEP REACT QUERY, OPTIMIZE USAGE

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import notificationsAPI from "@/components/shared/notifications/lib/api";
import notificationSocket from "@/components/shared/notifications/lib/socket";
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown";

const TopRightControl = ({ className = "", isAbsolute = true }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 🔥 OPTIMIZED: Fetch unread count ONCE, no refetch interval
  const { data: unreadData, isLoading: isCountLoading } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => {
      console.log('📊 Fetching unread count for TopRightControl')
      return notificationsAPI.getUnreadCount()
    },
    staleTime: Infinity, // 🔥 NEVER REFETCH - socket/mutations will update
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
  });

  // 🔥 SOCKET SETUP FOR REAL-TIME BADGE UPDATES
  useEffect(() => {
    console.log('🔗 TopRightControl: Setting up socket for badge updates')
    notificationSocket.ensureConnection()

    const handleNotificationCreated = () => {
      console.log('🔔 TopRightControl: New notification - updating badge')
      // Update unread count (+1)
      queryClient.setQueryData(['notifications-unread-count'], (oldData) => {
        const currentCount = parseInt(oldData?.count || 0, 10)
        return { count: currentCount + 1 }
      })
    }

    const handleNotificationRead = (data) => {
      console.log('✅ TopRightControl: Notification read - updating badge')
      // Update unread count from socket data
      if (data.newUnreadCount !== undefined) {
        queryClient.setQueryData(['notifications-unread-count'], () => ({
          count: data.newUnreadCount
        }))
      }
    }

    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)

    return () => {
      console.log('🔌 TopRightControl: Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
    }
  }, [queryClient])

  // Process data
  const unreadCount = parseInt(unreadData?.count, 10) || 0;

  // 🔥 SIMPLIFIED: Format count for badge display (max 99+)
  const formatUnreadCount = (count) => {
    if (isCountLoading || !count || count === 0) return null;
    if (count > 99) return "99+";
    return count.toString();
  };

  const displayCount = formatUnreadCount(unreadCount);

  // Close on outside click
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

  // Close dropdown when navigating
  useEffect(() => {
    setOpenNotif(false);
  }, [location.pathname]);

  const handleViewAllNotifications = () => {
    setOpenNotif(false);
    const isSchool = location.pathname.includes('/organization/school');
    const isCompany = location.pathname.includes('/organization/company');
    
    if (isSchool) {
      navigate("/organization/school/notifications");
    } else if (isCompany) {
      navigate("/organization/company/notifications");
    } else {
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
          
          {/* 🔥 Badge now works with optimized query + socket updates */}
          {displayCount && (
            <span className="absolute top-0 -right-1 w-6 h-[11px] bg-[#EE4266] text-white text-[8px] font-bold rounded-xl flex items-center justify-center transform-gpu">
              {displayCount}
            </span>
          )}
        </button>

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