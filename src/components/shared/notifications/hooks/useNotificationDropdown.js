// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"
import { formatTimeAgoDropdown, isNotificationFromToday } from "../lib/timezoneUtils"

export const useNotificationDropdown = (selectedTab = 'all') => {
  const queryClient = useQueryClient()

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
  })

  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications-dropdown', selectedTab],
    queryFn: async () => {
      const filters = {
        page: 1,
        limit: 3,
        type: selectedTab,
      };
      const result = await notificationsAPI.getNotifications(filters);
      return result;
    },
    staleTime: 0,
    cacheTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const notifications = notificationsData?.notifications || []
  const generalCount = unreadData?.generalCount || 0
  const counselingCount = unreadData?.counselingCount || 0

  useEffect(() => {
    let isComponentMounted = true;

    const setupSocket = async () => {
      try {
        await notificationSocket.connect();
      } catch (error) {
        console.error('❌ Dropdown: Socket connection failed:', error);
      }
    };

    setupSocket();

    const handleRealtimeUpdate = (event, payload = null) => {
      if (!isComponentMounted) return;
      
      Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['notifications-dropdown', 'all'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['notifications-dropdown', 'counseling'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['notifications-unread-count'],
          refetchType: 'active'
        })
      ]).then(() => {
        setTimeout(() => {
          if (isComponentMounted) {
            refetch();
          }
        }, 100);
      });
    };

    const createdHandler = (payload) => handleRealtimeUpdate('notification:created', payload);
    const readHandler = (payload) => handleRealtimeUpdate('notification:read', payload);
    const markAllReadHandler = (payload) => handleRealtimeUpdate('notification:mark-all-read', payload);
    
    notificationSocket.on('notification:created', createdHandler);
    notificationSocket.on('notification:read', readHandler);
    notificationSocket.on('notification:mark-all-read', markAllReadHandler);

    return () => {
      isComponentMounted = false;
      notificationSocket.off('notification:created', createdHandler);
      notificationSocket.off('notification:read', readHandler);
      notificationSocket.off('notification:mark-all-read', markAllReadHandler);
    }
  }, [queryClient, refetch])

  // 🔥 SIMPLE FORMAT untuk dropdown - hanya jam/menit lalu, baru saja
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    return formatTimeAgoDropdown(timestamp);
  }

  const formatUnreadCount = (count) => {
    return count > 99 ? '99+' : count.toString();
  }

  return {
    notifications,
    unreadCount: generalCount,
    counselingCount,
    isLoading,
    formatTimeAgo,
    formatUnreadCount,
    isNotificationFromToday,
  }
}