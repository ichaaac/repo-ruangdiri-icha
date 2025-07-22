// src/components/shared/notifications/hooks/useNotifications.js

import { useState, useCallback, useEffect } from "react"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import "dayjs/locale/id"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"
import { getRelativeTime, formatDateIndonesian } from "../../schedule/utils/timezoneHandler"

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

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState("all")

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  })

  const unreadCount = unreadData?.count || 0

  // 🔥 DEBUG: Log unread count
  console.log('🔢 useNotifications unreadCount:', {
    unreadCount,
    unreadData,
    selectedTab
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['notifications', selectedTab],
    queryFn: async ({ pageParam = 1 }) => {
      const filters = {
        page: pageParam,
        limit: 10,
        type: selectedTab,
      };
      
      console.log('🔍 Fetching notifications with filters:', filters);
      const result = await notificationsAPI.getNotifications(filters);
      console.log('📊 Fetched notifications result:', result);
      
      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      const lastPageTotal = lastPage?.total || 0
      const lastPageNotificationsCount = lastPage?.notifications?.length || 0

      if (!lastPage || lastPageNotificationsCount === 0) {
        return undefined
      }

      const totalFetched = allPages.reduce((acc, page) => {
        return acc + (page?.notifications?.length || 0)
      }, 0)

      if (totalFetched >= lastPageTotal) {
        return undefined
      }
      
      return allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const notifications = data?.pages.flatMap(page => page.notifications) || []
  const totalCount = data?.pages[0]?.total || 0

  // 🔥 FIXED: Updated grouping dengan timezone handling yang benar
  const groupedNotifications = notifications.reduce((acc, notification) => {
    try {
      // Parse waktu sebagai UTC dan convert ke timezone lokal
      const notificationTime = dayjs.utc(notification.createdAt).tz('Asia/Jakarta');
      const dateKey = notificationTime.format("YYYY-MM-DD");
      
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(notification)
    } catch (error) {
      console.error('❌ Error grouping notification:', notification.id, error);
      // Fallback ke parsing biasa
      const dateKey = dayjs(notification.createdAt).format("YYYY-MM-DD");
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(notification)
    }
    return acc
  }, {})

  // 🔥 FIXED: Calculate unread counts from loaded notifications
  // Note: unreadCount dari API mungkin berbeda dengan yang kita hitung dari loaded notifications
  // karena loaded notifications ter-paginate sementara unreadCount dari API adalah total global
  
  const loadedUnreadCount = notifications.filter(
    (notif) => !(notif.status === 'read' || notif.isRead || notif.readAt)
  ).length;

  const counselingCount = notifications.filter(
    (notif) => notif.type === 'schedule' && 
    !(notif.status === 'read' || notif.isRead || notif.readAt)
  ).length

  console.log('📈 Notification counts EXPLAINED:', {
    totalCount,           // Total from API (all notifications available)
    unreadCount,          // Global unread count from API endpoint
    loadedUnreadCount,    // Unread count dari notifications yang sudah di-load
    counselingCount,      // Unread schedule notifications dari yang sudah di-load
    totalNotificationsLoaded: notifications.length,
    selectedTab,
    breakdown: {
      system: notifications.filter(n => n.type === 'system').length,
      schedule: notifications.filter(n => n.type === 'schedule').length,
      report: notifications.filter(n => n.type === 'report').length,
    },
    explanation: 'totalCount shows ALL available notifications, unreadCount shows global unread count'
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => notificationsAPI.markAsRead(notificationIds),
    onSuccess: (response, notificationIds) => {
      console.log('✅ Main: Mark as read success:', response)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: (error) => console.error('❌ Main: Mark as read failed:', error),
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markallAsRead,
    onSuccess: (response) => {
      console.log('✅ Main: Mark all as read success:', response)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: (error) => console.error('❌ Main: Mark all as read failed:', error),
  })

  useEffect(() => {
    notificationSocket.connect()

    const handleRealtimeUpdate = (event) => {
        console.log(`🔔 Main: Received '${event}' event. Invalidating queries.`);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    };

    const createdHandler = () => handleRealtimeUpdate('notification:created');
    const readHandler = () => handleRealtimeUpdate('notification:read');
    const markAllReadHandler = () => handleRealtimeUpdate('notification:mark-all-read');
    
    notificationSocket.on('notification:created', createdHandler)
    notificationSocket.on('notification:read', readHandler)
    notificationSocket.on('notification:mark-all-read', markAllReadHandler)

    return () => {
      notificationSocket.off('notification:created', createdHandler)
      notificationSocket.off('notification:read', readHandler)
      notificationSocket.off('notification:mark-all-read', markAllReadHandler)
    }
  }, [queryClient, selectedTab])

  const handleTabChange = useCallback((tab) => {
    console.log('🔄 Tab changed to:', tab);
    setSelectedTab(tab)
  }, [])

  const handleMarkAsRead = useCallback((notificationId) => {
    console.log('📖 Marking as read:', notificationId);
    markAsReadMutation.mutate([notificationId])
  }, [markAsReadMutation])

  const handleMarkAllAsRead = useCallback(() => {
    console.log('📖 Marking all as read');
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  // 🔥 FIXED: Improved date label dengan timezone handling
  const getDateLabel = useCallback((dateString) => {
    try {
      // Parse dateString sebagai date lokal (karena sudah diformat sebagai YYYY-MM-DD)
      const date = dayjs(dateString);
      const today = dayjs().tz('Asia/Jakarta');
      const yesterday = dayjs().tz('Asia/Jakarta').subtract(1, 'day');

      if (date.isSame(today, 'day')) return 'Hari Ini'
      if (date.isSame(yesterday, 'day')) return 'Kemarin'
      
      try {
        return formatDateIndonesian(dateString) || date.format('DD MMMM YYYY')
      } catch {
        return date.format('DD MMMM YYYY')
      }
    } catch (error) {
      console.error('❌ Error formatting date label:', dateString, error);
      return dayjs(dateString).format('DD MMMM YYYY')
    }
  }, [])

  // 🔥 FIXED: Improved time formatting dengan timezone handling
  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "";

    try {
      // Parse timestamp sebagai UTC dan convert ke timezone lokal (WIB)
      const notificationTime = dayjs.utc(timestamp).tz('Asia/Jakarta');
      const now = dayjs().tz('Asia/Jakarta');
      
      const diffSeconds = now.diff(notificationTime, 'second');
      
      // Jika waktu notifikasi di masa depan (karena sync issue), anggap sebagai "baru saja"
      if (diffSeconds < 0) {
        console.log('⚠️ Future timestamp detected, treating as "baru saja"');
        return "Baru saja";
      }
      
      if (diffSeconds < 60) return "Baru saja";

      const diffMinutes = now.diff(notificationTime, 'minute');
      if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
      
      const diffHours = now.diff(notificationTime, 'hour');
      if (diffHours < 24) return `${diffHours} jam lalu`;

      // Untuk notifikasi yang lebih lama, gunakan fungsi getDateLabel
      return getDateLabel(notificationTime.format('YYYY-MM-DD'));

    } catch (error) {
      console.error('❌ Error formatting time ago:', timestamp, error);
      // Fallback jika terjadi error parsing
      return dayjs(timestamp).fromNow();
    }
  }, [getDateLabel]);

  const formatCount = useCallback((count) => {
    return count > 99 ? '99+' : count.toString()
  }, [])

  return {
    groupedNotifications,
    totalCount,
    unreadCount,
    counselingCount,
    selectedTab,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    handleTabChange,
    handleMarkAsRead,
    handleMarkAllAsRead,
    fetchNextPage,
    getDateLabel,
    formatTimeAgo,
    formatCount,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    refetchNotifications: refetch,
  }
}