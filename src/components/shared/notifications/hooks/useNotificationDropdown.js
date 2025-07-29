// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import "dayjs/locale/id"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"

dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale("id")

// Set timezone default ke Asia/Jakarta
dayjs.tz.setDefault('Asia/Jakarta')

dayjs.updateLocale("id", {
  relativeTime: {
    future: "dalam %s",
    past: "%s lalu",
    s: "beberapa detik",
    m: "semenit",
    mm: "%d menit",
    h: "sejam",
    hh: "%d jam",
    d: "sehari",
    dd: "%d hari",
    M: "sebulan",
    MM: "%d bulan",
    y: "setahun",
    yy: "%d tahun",
  },
})

export const useNotificationDropdown = (selectedTab = 'all') => {
  const queryClient = useQueryClient()

  // 🔥 UPDATED: Handle new unread count structure
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
        limit: 3, // Keep 3 items for dropdown
        type: selectedTab,
      };
      console.log('🔄 Dropdown fetching notifications:', filters);
      const result = await notificationsAPI.getNotifications(filters);
      console.log('📊 Dropdown fetch result:', result);
      return result;
    },
    staleTime: 0,
    cacheTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const notifications = notificationsData?.notifications || []
  
  // 🔥 UPDATED: Use new unread count structure
  const generalCount = unreadData?.generalCount || 0
  const counselingCount = unreadData?.counselingCount || 0

  console.log('🔢 Dropdown unread counts:', {
    generalCount,
    counselingCount,
    selectedTab
  });

  // 🔥 ENHANCED: Socket setup dengan improved real-time handling
  useEffect(() => {
    console.log('🔗 Dropdown: Setting up socket connection and listeners');
    
    let isComponentMounted = true;

    const setupSocket = async () => {
      try {
        await notificationSocket.connect();
        console.log('✅ Dropdown: Socket connected successfully');
      } catch (error) {
        console.error('❌ Dropdown: Socket connection failed:', error);
      }
    };

    setupSocket();

    const handleRealtimeUpdate = (event, payload = null) => {
      if (!isComponentMounted) return;
      
      console.log(`🔔 Dropdown: Received '${event}' event:`, payload);
      
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
        console.log('✅ Dropdown: Queries invalidated and refetched');
        
        setTimeout(() => {
          if (isComponentMounted) {
            refetch();
            console.log('🔄 Dropdown: Force refetch triggered');
          }
        }, 100);
      }).catch(error => {
        console.error('❌ Dropdown: Query invalidation failed:', error);
      });

      queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
    };

    const createdHandler = (payload) => handleRealtimeUpdate('notification:created', payload);
    const readHandler = (payload) => handleRealtimeUpdate('notification:read', payload);
    const markAllReadHandler = (payload) => handleRealtimeUpdate('notification:mark-all-read', payload);
    const reconnectedHandler = (payload) => {
      console.log('🔄 Dropdown: Socket reconnected, refreshing data');
      handleRealtimeUpdate('socket:reconnected', payload);
    };
    
    notificationSocket.on('notification:created', createdHandler);
    notificationSocket.on('notification:read', readHandler);
    notificationSocket.on('notification:mark-all-read', markAllReadHandler);
    notificationSocket.on('socket:reconnected', reconnectedHandler);

    const refreshInterval = setInterval(() => {
      if (isComponentMounted && notificationSocket.isSocketConnected()) {
        console.log('🔄 Dropdown: Periodic refresh');
        refetch();
      }
    }, 30000);

    return () => {
      isComponentMounted = false;
      
      notificationSocket.off('notification:created', createdHandler);
      notificationSocket.off('notification:read', readHandler);
      notificationSocket.off('notification:mark-all-read', markAllReadHandler);
      notificationSocket.off('socket:reconnected', reconnectedHandler);
      
      clearInterval(refreshInterval);
      
      console.log('🧹 Dropdown: Cleaned up listeners and intervals');
    }
  }, [queryClient, refetch])

  // 🔥 UPDATED: Simple time formatting for dropdown
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      const notificationTime = dayjs.utc(timestamp).tz('Asia/Jakarta');
      const now = dayjs().tz('Asia/Jakarta');
      
      const diffSeconds = now.diff(notificationTime, 'second');
      
      if (diffSeconds < 0) {
        console.log('⚠️ Future timestamp detected, treating as "baru saja"');
        return "Baru saja";
      }
      
      // 🔥 UPDATED: Simple format for dropdown
      if (diffSeconds < 60) return "Baru saja";
      
      const diffMinutes = now.diff(notificationTime, 'minute');
      if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

      const diffHours = now.diff(notificationTime, 'hour');
      if (diffHours < 24) return `${diffHours} jam lalu`;

      const diffDays = now.diff(notificationTime, 'day');
      if (diffDays < 7) return `${diffDays} hari lalu`;

      // For older notifications, show date
      return notificationTime.format('DD MMM YYYY');
    } catch (error) {
      console.error('❌ Error parsing timestamp:', timestamp, error);
      return dayjs(timestamp).fromNow();
    }
  }

  const formatUnreadCount = (count) => {
    return count > 99 ? '99+' : count.toString();
  }

  return {
    notifications,
    unreadCount: generalCount, // Use generalCount for "Semua" tab
    counselingCount, // Use counselingCount for "Konseling" tab
    isLoading,
    formatTimeAgo,
    formatUnreadCount,
  }
}