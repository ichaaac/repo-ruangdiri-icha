// src/components/shared/notifications/hooks/useNotifications.js

import { useState, useCallback, useEffect } from "react"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"

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

  // 🔥 SHARED UNREAD COUNT QUERY
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      console.log('📊 Main: Fetching unread count from API')
      const response = await notificationsAPI.getUnreadCount()
      return response.data?.data || response.data
    },
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  })

  const unreadCount = parseInt(unreadData?.count, 10) || 0

  // 🔥 INFINITE QUERY
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
      const lastPageTotal = lastPage?.total || 0
      const lastPageNotificationsCount = lastPage?.notifications?.length || 0

      if (!lastPage || (lastPageTotal === 0 && lastPageNotificationsCount === 0)) {
        return undefined
      }

      const totalFetched = allPages.reduce((acc, page) => {
        const notificationsLength = page?.notifications?.length || 0
        return acc + notificationsLength
      }, 0)

      const totalNotificationsFromBackend = lastPageTotal
      const totalPages = Math.ceil(totalNotificationsFromBackend / 10)
      const nextPage = allPages.length + 1

      return nextPage <= totalPages ? nextPage : undefined
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
    (notif) => {
      const isCounselingType = ['schedule_created', 'schedule_updated', 'schedule_deleted', 'schedule_reminder'].includes(notif.type) || 
                             (notif.type === "counseling" || notif.type === "schedule")
      const isUnread = !notif.isRead && !notif.readAt
      return isCounselingType && isUnread
    }
  ).length

  // 🔥 MARK AS READ MUTATION
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

  // 🔥 MARK ALL AS READ MUTATION
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

  // 🔥 SOCKET SETUP - FIXED: NO useCallback INSIDE useEffect
  useEffect(() => {
    console.log('🔗 Main: Setting up socket listeners')
    
    notificationSocket.connect()

    const handleNotificationCreated = (payload) => {
      console.log('🔔 Main: New notification via socket:', payload)
      
      // 🔥 UPDATE UNREAD COUNT FROM BACKEND
      if (payload.data?.unreadCount !== undefined) {
        const newCount = parseInt(payload.data.unreadCount, 10) || 0
        console.log('📊 Main: Setting count from backend (socket created):', newCount)
        queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
      } else {
        console.log('📊 Main: Socket created event without unreadCount. Invalidating.')
        queryClient.invalidateQueries(['notifications-unread-count'])
      }

      queryClient.setQueriesData(['notifications', selectedTab], (oldData) => {
        if (!oldData) return oldData

        const isCounselingNotification = payload.data?.type === 'counseling' || payload.data?.type === 'schedule'
        const isSystemNotification = payload.data?.type === 'system'

        const shouldAdd = (selectedTab === 'all') ||
                          (selectedTab === 'counseling' && isCounselingNotification) ||
                          (selectedTab === 'system' && isSystemNotification)

        if (!shouldAdd) {
          console.log('Skipping adding notification to current tab:', selectedTab)
          return oldData
        }

        const newNotification = {
          id: payload.data?.id || `temp-${Date.now()}`,
          title: payload.data?.title || '',
          message: payload.data?.message || '',
          createdAt: payload.data?.createdAt || new Date().toISOString(),
          isRead: false,
          type: payload.data?.type || 'system',
          subType: payload.data?.subType,
          recipientId: payload.data?.recipientId,
          readAt: null,
        }
        
        const updatedPages = oldData.pages.map((page, index) => {
          if (index === 0) {
            return {
              ...page,
              notifications: [newNotification, ...page.notifications].slice(0, page.notifications.length + 1),
              total: (page.total || 0) + 1,
            }
          }
          return page
        })
        return { ...oldData, pages: updatedPages }
      })

      if (selectedTab !== 'all') {
        queryClient.invalidateQueries(['notifications', 'all'])
      }
    }

    const handleNotificationRead = (payload) => {
      console.log('✅ Main: Notification read via socket:', payload)

      // 🔥 UPDATE UNREAD COUNT FROM BACKEND
      if (payload.data?.unreadCount !== undefined) {
        const newCount = parseInt(payload.data.unreadCount, 10) || 0
        console.log('📊 Main: Setting count from backend (socket read):', newCount)
        queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
      } else {
        console.log('📊 Main: Socket read event without unreadCount. Invalidating.')
        queryClient.invalidateQueries(['notifications-unread-count'])
      }

      queryClient.setQueriesData(['notifications'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.map(notif =>
              payload.data?.notificationIds?.includes(notif.id)
                ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                : notif
            ),
          })),
        }
      })
    }

    // 🔥 REGISTER SOCKET LISTENERS
    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)

    return () => {
      console.log('🔌 Main: Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
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

  console.log('🎯 Main Notifications state:', {
    selectedTab,
    totalCount,
    unreadCount,
    counselingCount,
    isLoading,
    socketConnected: notificationSocket.isSocketConnected()
  })

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