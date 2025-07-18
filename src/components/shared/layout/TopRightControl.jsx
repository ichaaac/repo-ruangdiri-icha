// src/components/shared/layout/TopRightControl.jsx - FIXED HOOKS

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { notificationsAPI } from "@/components/shared/notifications/lib/api";
import notificationSocket from "@/components/shared/notifications/lib/socket";
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown";

const TopRightControl = ({ className = "", isAbsolute = true }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 🔥 SHARED UNREAD COUNT QUERY
  const { data: unreadData, isLoading } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      console.log('📊 TopRightControl: Fetching unread count')
      const result = await notificationsAPI.getUnreadCount()
      console.log('📊 TopRightControl: Unread count result:', result)
      return result.data?.data || result.data
    },
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // 🔥 SOCKET SETUP - FIXED: NO useCallback INSIDE useEffect
  useEffect(() => {
    console.log('🔗 TopRightControl: Setting up socket listeners')
    
    notificationSocket.connect()

    const handleNotificationCreated = (payload) => {
      console.log('🔔 TopRightControl: New notification via socket:', payload)
      
      // 🔥 INVALIDATE QUERIES TO GET FRESH UNREAD COUNT
      queryClient.invalidateQueries(['notifications-unread-count'])
    }

    const handleNotificationRead = (payload) => {
      console.log('✅ TopRightControl: Notification read via socket:', payload)
      
      // 🔥 INVALIDATE QUERIES TO GET FRESH UNREAD COUNT
      queryClient.invalidateQueries(['notifications-unread-count'])
    }

    const handleMarkAllRead = (payload) => {
      console.log('✅ TopRightControl: Mark all read via socket:', payload)
      
      // 🔥 INVALIDATE QUERIES TO GET FRESH UNREAD COUNT
      queryClient.invalidateQueries(['notifications-unread-count'])
      queryClient.invalidateQueries(['notifications'])
    }

    // 🔥 REGISTER SOCKET LISTENERS
    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)
    notificationSocket.on('notification:mark-all-read', handleMarkAllRead)

    return () => {
      console.log('🔌 TopRightControl: Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
      notificationSocket.off('notification:mark-all-read', handleMarkAllRead)
    }
  }, [queryClient])

  // 🔥 MARK AS READ MUTATION
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds) => {
      console.log('✏️ TopRightControl: Marking as read:', notificationIds)
      return await notificationsAPI.markAsRead(notificationIds)
    },
    onSuccess: (response, variables) => {
      console.log('✅ TopRightControl: Mark as read response:', response)
      
      queryClient.setQueriesData(['notifications'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.map(notif =>
              variables.includes(notif.id)
                ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                : notif
            ),
          })),
        }
      })
      
      queryClient.invalidateQueries(['notifications-unread-count'])
    },
    onError: (error) => {
      console.error('❌ TopRightControl: Mark as read failed:', error)
    }
  })

  // 🔥 MARK ALL AS READ MUTATION
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('✏️ TopRightControl: Marking all as read')
      return await notificationsAPI.markallAsRead()
    },
    onSuccess: (response) => {
      console.log('✅ TopRightControl: Mark all as read response:', response)
      
      queryClient.setQueriesData(['notifications'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.map(notif => ({
              ...notif,
              isRead: true,
              readAt: new Date().toISOString(),
            })),
          })),
        }
      })
      
      queryClient.invalidateQueries(['notifications-unread-count'])
    },
    onError: (error) => {
      console.error('❌ TopRightControl: Mark all as read failed:', error)
    }
  })

  // 🔥 SYNC LOCAL COUNT WITH QUERY RESULT
  useEffect(() => {
    if (unreadData) {
      const count = parseInt(unreadData?.count, 10) || 0
      setLocalUnreadCount(count)
    }
  }, [unreadData])

  // Set initial count when query loads
  useEffect(() => {
    if (unreadData && !isLoading) {
      const count = parseInt(unreadData?.count, 10) || 0
      console.log('📊 TopRightControl: Setting initial local count:', count)
      setLocalUnreadCount(count)
    }
  }, [unreadData, isLoading])

  // 🔥 FORMAT BADGE COUNT
  const formatBadgeCount = (count) => {
    if (isLoading || count === 0) return null
    if (count > 99) return "99+"
    return count.toString()
  }

  const displayCount = formatBadgeCount(localUnreadCount)

  console.log('🎯 TopRightControl RENDER:', {
    localUnreadCount,
    displayCount,
    isLoading,
    queryData: unreadData,
    socketConnected: notificationSocket.isSocketConnected()
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
          className="material-icons text-zinc-500 text-xl sm:text-2xl hover:text-[#488BBE] transition-colors relative inline-flex items-center justify-center"
          style={{ position: 'relative' }}
        >
          notifications
          
          {/* 🔥 BADGE COUNT */}
          {displayCount && (
            <span 
              className="absolute flex items-center justify-center text-white font-bold rounded-full bg-[#EE4266]"
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

        {/* 🔥 DROPDOWN */}
        {openNotif && (
          <NotificationDropdown
            onViewAll={handleViewAllNotifications}
            onClose={() => setOpenNotif(false)}
            onMarkAsRead={markAsReadMutation.mutate}
            onMarkAllAsRead={markAllAsReadMutation.mutate}
          />
        )}
      </div>
    </div>
  );
};

export default TopRightControl;