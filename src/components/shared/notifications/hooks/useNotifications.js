// src/components/shared/notifications/hooks/useNotifications.js

import { useState, useCallback, useEffect } from "react"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import { useWebSocket } from "@/components/shared/schedule/hooks/useWebSocket" // PATH DIUBAH SESUAI PUNYA LO
import { notificationsAPI } from "../lib/api" // Import menggunakan NAMED IMPORT!

dayjs.extend(relativeTime)
dayjs.extend(updateLocale)

dayjs.updateLocale("en", {
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
    queryFn: async () => {
      console.log('📊 Frontend: Fetching unread count from API (Initial load or manual invalidate only)')
      const response = await notificationsAPI.getUnreadCount()
      return response.data?.data || response.data
    },
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
        type: selectedTab === 'counseling' ? 'counseling' : undefined,
      }
      const response = await notificationsAPI.getNotifications(filters)
      return response.data?.data || response.data
    },
    getNextPageParam: (lastPage, allPages) => {
      const lastPageTotal = lastPage?.total || 0;
      const lastPageNotificationsCount = lastPage?.notifications?.length || 0;

      if (!lastPage || (lastPageTotal === 0 && lastPageNotificationsCount === 0)) {
        return undefined;
      }

      const totalFetched = allPages.reduce((acc, page) => {
          const notificationsLength = page?.notifications?.length || 0;
          return acc + notificationsLength;
      }, 0);

      const totalNotificationsFromBackend = lastPageTotal;

      const totalPages = Math.ceil(totalNotificationsFromBackend / 10);
      const nextPage = allPages.length + 1;

      console.log('📊 Pagination Check:', {
          lastPage,
          allPagesCount: allPages.length,
          totalFetched,
          totalNotificationsFromBackend,
          totalPages,
          nextPage,
          shouldFetch: nextPage <= totalPages
      });

      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
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
    (notif) => (notif.type === "counseling" || notif.type === "schedule") && !notif.isRead && !notif.readAt
  ).length

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => {
      console.log('✏️ Main: Marking as read:', notificationIds)
      return notificationsAPI.markAsRead(notificationIds)
    },
    onSuccess: (response, notificationIds) => {
      console.log('✅ Main: Mark as read success:', response)
      
      queryClient.setQueriesData(['notifications'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.map(notif =>
              notificationIds.includes(notif.id)
                ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                : notif
            ),
          })),
        }
      })
      
      queryClient.invalidateQueries(['notifications-unread-count'])
    },
    onError: (error) => {
      console.error('❌ Main: Mark as read failed:', error)
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      console.log('✏️ Main: Marking all as read')
      return notificationsAPI.markallAsRead()
    },
    onSuccess: (response) => {
      console.log('✅ Main: Mark all as read success:', response)
      
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
      console.error('❌ Main: Mark all as read failed:', error)
    },
  })

  const { socket, isConnected: isSocketConnected, on, off } = useWebSocket() 

  // 🔥 PERBAIKAN: Definisi handler dengan useCallback di luar useEffect
  const handleNotificationCreated = useCallback((data) => {
    console.log('🔔 Main: New notification via socket:', data)
    
    if (data.unreadCount !== undefined) {
      const newCount = parseInt(data.unreadCount, 10) || 0
      console.log('📊 Main: Setting count from backend (socket created payload):', newCount)
      queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
    } else {
      console.log('📊 Main: Socket created event without unreadCount. Invalidating unread count query.')
      queryClient.invalidateQueries(['notifications-unread-count'])
    }

    queryClient.setQueriesData(['notifications', selectedTab], (oldData) => {
        if (!oldData) return oldData;

        const isCounselingNotification = data.type === 'counseling' || data.type === 'schedule';
        const isSystemNotification = data.type === 'system';

        const shouldAdd = (selectedTab === 'all') ||
                          (selectedTab === 'counseling' && isCounselingNotification) ||
                          (selectedTab === 'system' && isSystemNotification);

        if (!shouldAdd) {
            console.log('Skipping adding notification to current tab:', selectedTab);
            return oldData;
        }

        const newNotification = {
            id: data.id || `temp-${Date.now()}`,
            title: data.title,
            message: data.message,
            createdAt: data.createdAt || new Date().toISOString(),
            isRead: false,
            type: data.type,
            subType: data.subType,
            recipientId: data.recipientId,
            readAt: null,
        };
        
        const updatedPages = oldData.pages.map((page, index) => {
            if (index === 0) {
                return {
                    ...page,
                    notifications: [newNotification, ...page.notifications].slice(0, page.notifications.length + 1),
                    total: (page.total || 0) + 1,
                };
            }
            return page;
        });
        return { ...oldData, pages: updatedPages };
    });

    if (selectedTab !== 'all') {
        queryClient.invalidateQueries(['notifications', 'all']);
    }
    if (selectedTab !== 'system' && (data.type === 'system')) {
        queryClient.invalidateQueries(['notifications', 'system']);
    }
  }, [queryClient, selectedTab]); // Dependencies for useCallback

  // 🔥 PERBAIKAN: Definisi handler dengan useCallback di luar useEffect
  const handleNotificationRead = useCallback((data) => {
    console.log('✅ Main: Notification read via socket:', data)

    if (data.newUnreadCount !== undefined) {
      const newCount = parseInt(data.newUnreadCount, 10) || 0
      console.log('📊 Main: Setting count from backend (socket read payload):', newCount)
      queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
    } else {
      console.log('📊 Main: Socket read event without newUnreadCount. Invalidating unread count query.')
      queryClient.invalidateQueries(['notifications-unread-count'])
    }

    queryClient.setQueriesData(['notifications'], oldData => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map(page => ({
          ...page,
          notifications: page.notifications.map(notif =>
            data.notificationIds?.includes(notif.id)
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          ),
        })),
      }
    })
  }, [queryClient]); // Dependencies for useCallback


  useEffect(() => {
    if (!socket || !isSocketConnected) { 
      console.log('🔗 Waiting for WebSocket connection to be established for notification listeners.') 
      return 
    }

    on('notification:created', handleNotificationCreated)
    on('notification:new', handleNotificationCreated)
    on('notification:read', handleNotificationRead)
    on('read', handleNotificationRead)

    return () => {
      off('notification:created', handleNotificationCreated)
      off('notification:new', handleNotificationCreated)
      off('notification:read', handleNotificationRead)
      off('read', handleNotificationRead)
      console.log('🔌 Main: Cleaning up WebSocket listeners.')
    }
  }, [socket, isSocketConnected, on, off, handleNotificationCreated, handleNotificationRead]); // Dependencies yang benar untuk useEffect socket


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

    if (date.isSame(today, 'day')) {
      return 'Hari Ini'
    }
    if (date.isSame(yesterday, 'day')) {
      return 'Kemarin'
    }
    return date.format('DD MMMM YYYY')
  }, [])

  const formatTimeAgo = useCallback((timestamp) => {
    return dayjs(timestamp).fromNow()
  }, [])

  const formatCount = useCallback((count) => {
    if (count > 99) {
      return '99+'
    }
    return count.toString()
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