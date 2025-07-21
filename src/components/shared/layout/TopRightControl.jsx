// src/components/shared/layout/TopRightControl.jsx - ENHANCED REALTIME

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { notificationsAPI } from "@/components/shared/notifications/lib/api";
import notificationSocket from "@/components/shared/notifications/lib/socket";
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown";

const TopRightControl = ({ className = "", isAbsolute = true }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 🔥 SHARED UNREAD COUNT QUERY WITH AGGRESSIVE REFETCHING
  const { data: unreadData, isLoading, refetch } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      console.log('📊 TopRightControl: Fetching unread count')
      const result = await notificationsAPI.getUnreadCount()
      console.log('📊 TopRightControl: Unread count result:', result)
      return result.data?.data || result.data
    },
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds as fallback
  });

  // 🔥 ENHANCED SOCKET SETUP WITH FORCED UPDATES
  useEffect(() => {
    console.log('🔗 TopRightControl: Setting up enhanced socket listeners')
    
    // Force connect socket
    notificationSocket.connect()
      .then(() => {
        console.log('✅ TopRightControl: Socket connected successfully')
        setIsSocketConnected(true)
      })
      .catch(err => {
        console.error('❌ TopRightControl: Socket connection failed:', err)
        setIsSocketConnected(false)
      })

    const handleNotificationCreated = (payload) => {
      console.log('🔔 TopRightControl: New notification via socket:', payload)
      
      // 🔥 FORCE IMMEDIATE UNREAD COUNT UPDATE
      if (payload.data?.unreadCount !== undefined) {
        const newCount = parseInt(payload.data.unreadCount, 10) || 0
        console.log('📊 TopRightControl: Setting count from backend (socket created):', newCount)
        queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
        setLocalUnreadCount(newCount)
      } else {
        console.log('📊 TopRightControl: Socket created event without unreadCount. Force refetching.')
        refetch() // Force refetch if no count in payload
      }

      // 🔥 INVALIDATE ALL NOTIFICATION QUERIES
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications-dropdown'])
    }

    const handleNotificationRead = (payload) => {
      console.log('✅ TopRightControl: Notification read via socket:', payload)
      
      // 🔥 FORCE IMMEDIATE UNREAD COUNT UPDATE
      if (payload.data?.unreadCount !== undefined) {
        const newCount = parseInt(payload.data.unreadCount, 10) || 0
        console.log('📊 TopRightControl: Setting count from backend (socket read):', newCount)
        queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
        setLocalUnreadCount(newCount)
      } else {
        console.log('📊 TopRightControl: Socket read event without unreadCount. Force refetching.')
        refetch() // Force refetch if no count in payload
      }

      // 🔥 INVALIDATE ALL NOTIFICATION QUERIES
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications-dropdown'])
    }

    const handleMarkAllRead = (payload) => {
      console.log('✅ TopRightControl: Mark all read via socket:', payload)
      
      // 🔥 FORCE UNREAD COUNT TO 0
      queryClient.setQueryData(['notifications-unread-count'], { count: 0 })
      setLocalUnreadCount(0)
      
      // 🔥 INVALIDATE ALL NOTIFICATION QUERIES
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications-dropdown'])
    }

    // 🔥 SOCKET CONNECTION STATUS MONITORING
    const handleConnect = () => {
      console.log('🔗 TopRightControl: Socket connected')
      setIsSocketConnected(true)
      // Force refetch on reconnection
      refetch()
    }

    const handleDisconnect = () => {
      console.log('❌ TopRightControl: Socket disconnected')
      setIsSocketConnected(false)
    }

    // 🔥 REGISTER ALL SOCKET LISTENERS
    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)
    notificationSocket.on('notification:mark-all-read', handleMarkAllRead)
    
    // Monitor socket connection status
    if (notificationSocket.socket) {
      notificationSocket.socket.on('connect', handleConnect)
      notificationSocket.socket.on('disconnect', handleDisconnect)
    }

    // Check initial socket status
    setIsSocketConnected(notificationSocket.isSocketConnected())

    return () => {
      console.log('🔌 TopRightControl: Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
      notificationSocket.off('notification:mark-all-read', handleMarkAllRead)
      
      if (notificationSocket.socket) {
        notificationSocket.socket.off('connect', handleConnect)
        notificationSocket.socket.off('disconnect', handleDisconnect)
      }
    }
  }, [queryClient, refetch])

  // 🔥 MARK AS READ MUTATION WITH OPTIMISTIC UPDATES
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds) => {
      console.log('✏️ TopRightControl: Marking as read:', notificationIds)
      return await notificationsAPI.markAsRead(notificationIds)
    },
    onMutate: async (notificationIds) => {
      // 🔥 OPTIMISTIC UPDATE: Decrease count immediately
      const currentCount = localUnreadCount
      const newCount = Math.max(0, currentCount - notificationIds.length)
      setLocalUnreadCount(newCount)
      console.log('🔄 TopRightControl: Optimistic count update:', currentCount, '->', newCount)
    },
    onSuccess: (response, variables) => {
      console.log('✅ TopRightControl: Mark as read response:', response)
      
      // 🔥 UPDATE NOTIFICATIONS LIST
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
      
      // 🔥 UPDATE DROPDOWN NOTIFICATIONS
      queryClient.setQueriesData(['notifications-dropdown'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif =>
            variables.includes(notif.id)
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          ),
        }
      })
      
      // 🔥 FORCE REFETCH UNREAD COUNT
      queryClient.invalidateQueries(['notifications-unread-count'])
    },
    onError: (error, variables) => {
      console.error('❌ TopRightControl: Mark as read failed:', error)
      // 🔥 REVERT OPTIMISTIC UPDATE ON ERROR
      refetch()
    }
  })

  // 🔥 MARK ALL AS READ MUTATION WITH OPTIMISTIC UPDATES
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('✏️ TopRightControl: Marking all as read')
      return await notificationsAPI.markallAsRead()
    },
    onMutate: async () => {
      // 🔥 OPTIMISTIC UPDATE: Set count to 0 immediately
      setLocalUnreadCount(0)
      console.log('🔄 TopRightControl: Optimistic mark all read')
    },
    onSuccess: (response) => {
      console.log('✅ TopRightControl: Mark all as read response:', response)
      
      // 🔥 UPDATE ALL NOTIFICATIONS TO READ
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
      
      queryClient.setQueriesData(['notifications-dropdown'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
        }
      })
      
      // 🔥 SET UNREAD COUNT TO 0
      queryClient.setQueryData(['notifications-unread-count'], { count: 0 })
    },
    onError: (error) => {
      console.error('❌ TopRightControl: Mark all as read failed:', error)
      // 🔥 REVERT OPTIMISTIC UPDATE ON ERROR
      refetch()
    }
  })

  // 🔥 SYNC LOCAL COUNT WITH QUERY RESULT
  useEffect(() => {
    if (unreadData && !isLoading) {
      const count = parseInt(unreadData?.count, 10) || 0
      setLocalUnreadCount(count)
      console.log('📊 TopRightControl: Syncing local count with query:', count)
    }
  }, [unreadData, isLoading])

  // 🔥 FORMAT BADGE COUNT
  const formatBadgeCount = (count) => {
    if (isLoading || count === 0) return null
    if (count > 99) return "99+"
    return count.toString()
  }

  const displayCount = formatBadgeCount(localUnreadCount)

  console.log('🎯 TopRightControl ENHANCED RENDER:', {
    localUnreadCount,
    displayCount,
    isLoading,
    isSocketConnected,
    queryData: unreadData,
    socketStatus: notificationSocket.getConnectionStatus()
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
          
          {/* 🔥 ENHANCED BADGE COUNT */}
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

        {/* 🔥 ENHANCED DROPDOWN */}
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