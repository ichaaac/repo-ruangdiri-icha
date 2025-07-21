// src/components/shared/notifications/hooks/useNotifications.js

import { useState, useCallback, useEffect } from "react"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import "dayjs/locale/id"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"
import { getRelativeTime, formatDateIndonesian } from "../../schedule/utils/timezoneHandler"

dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
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
    queryFn: notificationsAPI.getUnreadCount, // Simplified
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  })

  const unreadCount = unreadData?.count || 0

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
      // Simplified: Just call the consistent API
      return notificationsAPI.getNotifications(filters);
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

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const dateKey = dayjs(notification.createdAt).format("YYYY-MM-DD")
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(notification)
    return acc
  }, {})

  const counselingCount = notifications.filter(
    (notif) => notif.type === 'schedule' && notif.subType === 'counseling' && !notif.isRead && !notif.readAt
  ).length

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => notificationsAPI.markAsRead(notificationIds),
    onSuccess: (response, notificationIds) => {
      console.log('✅ Main: Mark as read success:', response)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: (error) => console.error('❌ Main: Mark as read failed:', error),
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markallAsRead,
    onSuccess: (response) => {
      console.log('✅ Main: Mark all as read success:', response)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
    
    notificationSocket.on('notification:created', createdHandler)
    notificationSocket.on('notification:read', readHandler)

    return () => {
      notificationSocket.off('notification:created', createdHandler)
      notificationSocket.off('notification:read', readHandler)
    }
  }, [queryClient, selectedTab])

  const handleTabChange = useCallback((tab) => {
    setSelectedTab(tab)
  }, [])

  const handleMarkAsRead = useCallback((notificationId) => {
    markAsReadMutation.mutate([notificationId])
  }, [markAsReadMutation])

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const getDateLabel = useCallback((dateString) => {
    const date = dayjs(dateString)
    const today = dayjs()
    const yesterday = dayjs().subtract(1, 'day')

    if (date.isSame(today, 'day')) return 'Hari Ini'
    if (date.isSame(yesterday, 'day')) return 'Kemarin'
    
    try {
      return formatDateIndonesian(dateString) || date.format('DD MMMM YYYY')
    } catch {
      return date.format('DD MMMM YYYY')
    }
  }, [])

 const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "";

    try {
      const notificationTime = dayjs(timestamp);
      const now = dayjs();
      
      const diffSeconds = now.diff(notificationTime, 'second');
      if (diffSeconds < 60) return "Baru saja";

      const diffMinutes = now.diff(notificationTime, 'minute');
      if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
      
      const diffHours = now.diff(notificationTime, 'hour');
      if (diffHours < 24) return `${diffHours} jam lalu`;

      // Untuk notifikasi yang lebih lama, gunakan fungsi getDateLabel
      return getDateLabel(timestamp);

    } catch {
      // Fallback jika terjadi error parsing
      return dayjs(timestamp).fromNow();
    }
  }, [getDateLabel]); // Tambahkan getDateLabel sebagai dependensi

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