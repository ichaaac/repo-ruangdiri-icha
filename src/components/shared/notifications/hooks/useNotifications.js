// src/components/shared/notifications/hooks/useNotifications.js

import { useState, useCallback, useEffect } from "react"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import "dayjs/locale/id"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"

dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
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
  weekdays: [
    "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
  ],
  months: [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
})

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState("all")

  // 🔥 UPDATED: Handle new unread count structure
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  })

  const generalCount = unreadData?.generalCount || 0
  const counselingCount = unreadData?.counselingCount || 0

  console.log('🔢 useNotifications unreadCount:', {
    generalCount,
    counselingCount,
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
        limit: 10, // Keep pagination at 10 per request
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

  // 🔥 UPDATED: Improved grouping dengan timezone handling yang proper
  const groupedNotifications = notifications.reduce((acc, notification) => {
    try {
      // Parse waktu sebagai UTC dan convert ke timezone lokal (WIB)
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

  // 🔥 ENHANCED: Improved date label dengan timezone handling dan hari
  const getDateLabel = useCallback((dateString) => {
    try {
      const date = dayjs(dateString).tz('Asia/Jakarta');
      const today = dayjs().tz('Asia/Jakarta');
      const yesterday = dayjs().tz('Asia/Jakarta').subtract(1, 'day');

      if (date.isSame(today, 'day')) {
        return 'Hari Ini'
      }
      
      if (date.isSame(yesterday, 'day')) {
        return 'Kemarin'
      }
      
      // 🔥 NEW: Show day name for older notifications
      const dayName = date.format('dddd'); // Senin, Selasa, etc.
      const dateFormat = date.format('DD MMMM YYYY');
      
      return `${dayName}, ${dateFormat}`;
    } catch (error) {
      console.error('❌ Error formatting date label:', dateString, error);
      return dayjs(dateString).format('DD MMMM YYYY')
    }
  }, [])

  // 🔥 ENHANCED: Detailed time formatting for main notifications page
  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "";

    try {
      // Parse timestamp sebagai UTC dan convert ke timezone lokal (WIB)
      const notificationTime = dayjs.utc(timestamp).tz('Asia/Jakarta');
      const now = dayjs().tz('Asia/Jakarta');
      
      const diffSeconds = now.diff(notificationTime, 'second');
      
      // Handle future timestamps
      if (diffSeconds < 0) {
        console.log('⚠️ Future timestamp detected, treating as "baru saja"');
        return "Baru saja";
      }
      
      // 🔥 UPDATED: More precise time formatting for main page
      if (diffSeconds < 60) {
        return "Baru saja";
      }

      const diffMinutes = now.diff(notificationTime, 'minute');
      if (diffMinutes < 60) {
        return `${diffMinutes} menit lalu`;
      }
      
      const diffHours = now.diff(notificationTime, 'hour');
      
      // 🔥 NEW: For today's notifications, show time with more detail
      if (notificationTime.isSame(now, 'day')) {
        if (diffHours < 24) {
          const timeFormat = notificationTime.format('HH:mm');
          return `${timeFormat} (${diffHours} jam lalu)`;
        }
      }
      
      // 🔥 NEW: For older notifications, show full date and time with day
      const dayName = notificationTime.format('dddd');
      const dateFormat = notificationTime.format('DD/MM/YYYY');
      const timeFormat = notificationTime.format('HH:mm');
      
        return `${dayName}, ${dateFormat} - ${timeFormat}`;

    } catch (error) {
      console.error('❌ Error formatting time ago:', timestamp, error);
      // Fallback jika terjadi error parsing
      return dayjs(timestamp).fromNow();
    }
  }, []);

  // 🔥 UPDATED: Format count with 999+ limit for main page
  const formatCount = useCallback((count) => {
    return count > 999 ? '999+' : count.toString()
  }, [])

  return {
    groupedNotifications,
    totalCount,
    unreadCount: generalCount, // Use generalCount for main unread count
    counselingCount, // Use counselingCount for counseling tab
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