// src/components/shared/layout/TopRightControl.jsx - FIXED REALTIME SYNC

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "@/components/shared/notifications/lib/api";
import notificationSocket from "@/components/shared/notifications/lib/socket";
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown";

const TopRightControl = ({ className = "", isAbsolute = true }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 🔥 SIMPLIFIED: Use the SAME query key as hooks
  const { data: unreadData, isLoading } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  // 🔥 SIMPLIFIED: Get count directly, no local state needed
  const unreadCount = unreadData?.count || 0;

  // 🔥 SIMPLIFIED: Socket setup with minimal realtime listeners
  useEffect(() => {
    console.log('🔗 TopRightControl: Setting up socket connection')
    
    // Connect socket
    notificationSocket.connect()
      .then(() => {
        console.log('✅ TopRightControl: Socket connected')
        setIsSocketConnected(true)
      })
      .catch(err => {
        console.error('❌ TopRightControl: Socket connection failed:', err)
        setIsSocketConnected(false)
      })

    // 🔥 MINIMAL REALTIME UPDATE HANDLERS
    const handleRealtimeUpdate = (event) => {
      console.log(`🔔 TopRightControl: Received '${event}' event. Invalidating unread count.`);
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    };

    const createdHandler = () => handleRealtimeUpdate('notification:created');
    const readHandler = () => handleRealtimeUpdate('notification:read');
    const markAllReadHandler = () => handleRealtimeUpdate('notification:mark-all-read');

    // Monitor socket connection status
    const handleConnect = () => {
      console.log('🔗 TopRightControl: Socket connected')
      setIsSocketConnected(true)
    }

    const handleDisconnect = () => {
      console.log('❌ TopRightControl: Socket disconnected')
      setIsSocketConnected(false)
    }

    // 🔥 ADD SOCKET LISTENERS
    notificationSocket.on('notification:created', createdHandler);
    notificationSocket.on('notification:read', readHandler);
    notificationSocket.on('notification:mark-all-read', markAllReadHandler);

    // Add connection listeners
    if (notificationSocket.socket) {
      notificationSocket.socket.on('connect', handleConnect)
      notificationSocket.socket.on('disconnect', handleDisconnect)
    }

    // Check initial socket status
    setIsSocketConnected(notificationSocket.isSocketConnected())

    return () => {
      // 🔥 CLEANUP SOCKET LISTENERS
      notificationSocket.off('notification:created', createdHandler);
      notificationSocket.off('notification:read', readHandler);
      notificationSocket.off('notification:mark-all-read', markAllReadHandler);
      
      if (notificationSocket.socket) {
        notificationSocket.socket.off('connect', handleConnect)
        notificationSocket.socket.off('disconnect', handleDisconnect)
      }
    }
  }, [queryClient])

  // 🔥 SIMPLIFIED: Format badge count
  const formatBadgeCount = (count) => {
    if (isLoading || count === 0) return null
    if (count > 99) return "99+"
    return count.toString()
  }

  const displayCount = formatBadgeCount(unreadCount)

  console.log('🎯 TopRightControl SIMPLIFIED RENDER:', {
    unreadCount,
    displayCount,
    isLoading,
    isSocketConnected,
    queryData: unreadData
  })

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
    ? "absolute top-[29px] right-[12px] z-50"
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
          className={`material-icons text-xl sm:text-2xl transition-colors relative inline-flex items-center justify-center ${
            isSocketConnected 
              ? "text-zinc-500 hover:text-[#488BBE]" 
              : "text-red-400 hover:text-red-500"
          }`}
          title={isSocketConnected ? "Notifications" : "Notification service offline"}
        >
          notifications
          
          {/* 🔥 CONNECTION STATUS INDICATOR */}
          {!isSocketConnected && (
            <span 
              className="absolute flex items-center justify-center text-white font-bold rounded-full bg-red-500"
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '8px',
                height: '8px',
                fontSize: '1px',
                zIndex: 10000,
              }}
              title="Offline"
            />
          )}
          
          {/* 🔥 SIMPLIFIED BADGE COUNT */}
          {displayCount && (
            <span 
              className="absolute flex items-center justify-center text-white font-bold rounded-full bg-[#EE4266] animate-pulse"
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                minWidth: '20px',
                height: '20px',
                fontSize: '11px',
                lineHeight: '1',
                zIndex: 9999,
                textDecoration: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#EE4266',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {displayCount}
            </span>
          )}
        </button>

        {/* 🔥 SIMPLIFIED DROPDOWN - No need to pass mutation props */}
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