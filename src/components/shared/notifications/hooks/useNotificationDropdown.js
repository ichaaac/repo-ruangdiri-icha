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
import { getRelativeTime } from "../../schedule/utils/timezoneHandler"

dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale("id")

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
        limit: 3, // 🔥 FIXED: Maksimal 3 item untuk dropdown
        type: selectedTab,
      };
      console.log('🔄 Dropdown fetching notifications:', filters);
      const result = await notificationsAPI.getNotifications(filters);
      console.log('📊 Dropdown fetch result:', result);
      return result;
    },
    staleTime: 0, // 🔥 CHANGED: Make it fresh always
    cacheTime: 1 * 60 * 1000, // Keep in cache for 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true, // 🔥 ADDED: Refetch on mount
  })

  const notifications = notificationsData?.notifications || []
  const unreadCount = unreadData?.count || 0

  // 🔥 FIXED: Semua type schedule masuk ke Konseling, bukan hanya subType counseling
  const counselingCount = notifications.filter(
    (notif) => notif.type === 'schedule' && 
    !(notif.status === 'read' || notif.isRead || notif.readAt)
  ).length

  // 🔥 ENHANCED: Socket setup dengan improved real-time handling
  useEffect(() => {
    console.log('🔗 Dropdown: Setting up socket connection and listeners');
    
    let isComponentMounted = true; // Track component mount status

    const setupSocket = async () => {
      try {
        await notificationSocket.connect();
        console.log('✅ Dropdown: Socket connected successfully');
      } catch (error) {
        console.error('❌ Dropdown: Socket connection failed:', error);
      }
    };

    setupSocket();

    // 🔥 ENHANCED: Better real-time update handlers
    const handleRealtimeUpdate = (event, payload = null) => {
      if (!isComponentMounted) return; // Prevent updates if component unmounted
      
      console.log(`🔔 Dropdown: Received '${event}' event:`, payload);
      
      // 🔥 IMMEDIATE: Invalidate and refetch dropdown queries
      Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['notifications-dropdown', 'all'],
          refetchType: 'active' // Only refetch active queries
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
        
        // 🔥 FORCE REFETCH: If invalidation doesn't trigger, force it
        setTimeout(() => {
          if (isComponentMounted) {
            refetch();
            console.log('🔄 Dropdown: Force refetch triggered');
          }
        }, 100);
      }).catch(error => {
        console.error('❌ Dropdown: Query invalidation failed:', error);
      });

      // Also invalidate main page queries for consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
    };

    const createdHandler = (payload) => handleRealtimeUpdate('notification:created', payload);
    const readHandler = (payload) => handleRealtimeUpdate('notification:read', payload);
    const markAllReadHandler = (payload) => handleRealtimeUpdate('notification:mark-all-read', payload);
    
    // 🔥 ADDED: Handle socket reconnection
    const reconnectedHandler = (payload) => {
      console.log('🔄 Dropdown: Socket reconnected, refreshing data');
      handleRealtimeUpdate('socket:reconnected', payload);
    };
    
    // 🔥 ADD SOCKET LISTENERS
    notificationSocket.on('notification:created', createdHandler);
    notificationSocket.on('notification:read', readHandler);
    notificationSocket.on('notification:mark-all-read', markAllReadHandler);
    notificationSocket.on('socket:reconnected', reconnectedHandler);

    // 🔥 ENHANCED: Periodic refresh as fallback
    const refreshInterval = setInterval(() => {
      if (isComponentMounted && notificationSocket.isSocketConnected()) {
        console.log('🔄 Dropdown: Periodic refresh');
        refetch();
      }
    }, 30000); // Refresh every 30 seconds as fallback

    return () => {
      isComponentMounted = false; // Mark component as unmounted
      
      // 🔥 CLEANUP SOCKET LISTENERS
      notificationSocket.off('notification:created', createdHandler);
      notificationSocket.off('notification:read', readHandler);
      notificationSocket.off('notification:mark-all-read', markAllReadHandler);
      notificationSocket.off('socket:reconnected', reconnectedHandler);
      
      // Clear interval
      clearInterval(refreshInterval);
      
      console.log('🧹 Dropdown: Cleaned up listeners and intervals');
    }
  }, [queryClient, refetch])

  // 🔥 FIXED: Improved time formatting with proper timezone handling
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      // Parse timestamp as UTC and convert to local timezone (WIB)
      const notificationTime = dayjs.utc(timestamp).tz('Asia/Jakarta');
      const now = dayjs().tz('Asia/Jakarta');
      
      const diffSeconds = now.diff(notificationTime, 'second');
      
      // Jika waktu notifikasi di masa depan (karena sync issue), anggap sebagai "baru saja"
      if (diffSeconds < 0) {
        console.log('⚠️ Future timestamp detected, treating as "baru saja"');
        return "Baru saja";
      }
      
      if (diffSeconds < 10) return "Baru saja";
      if (diffSeconds < 60) return `${diffSeconds} detik lalu`;

      const diffMinutes = now.diff(notificationTime, 'minute');
      if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

      const diffHours = now.diff(notificationTime, 'hour');
      if (diffHours < 24) return `${diffHours} jam lalu`;

      // Jika lebih dari sehari, tampilkan tanggal dalam format Indonesia
      return notificationTime.format('DD MMM YYYY');
    } catch (error) {
      console.error('❌ Error parsing timestamp:', timestamp, error);
      // Fallback dengan dayjs biasa
      return dayjs(timestamp).fromNow();
    }
  }

  const formatUnreadCount = (count) => {
    return count > 99 ? '99+' : count.toString();
  }

  return {
    notifications,
    unreadCount,
    counselingCount,
    isLoading,
    formatTimeAgo,
    formatUnreadCount,
  }
}