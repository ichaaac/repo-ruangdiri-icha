// src/components/shared/notifications/hooks/useNotifications.js

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('all')
  const ITEMS_PER_PAGE = 10

  // Define utility functions FIRST
  const getDateKey = useCallback((dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'yesterday'
    } else {
      return date.toISOString().split('T')[0]
    }
  }, [])

  const getDateLabel = useCallback((dateKey) => {
    switch(dateKey) {
      case 'today': return 'Hari ini'
      case 'yesterday': return 'Kemarin'
      default: {
        const date = new Date(dateKey)
        return date.toLocaleDateString('id-ID', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      }
    }
  }, [])

  // Socket real-time updates
  useEffect(() => {
    notificationSocket.ensureConnection()

    const handleNotificationCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }

    const handleNotificationRead = (data) => {
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              notifications: page.notifications.map(notification => 
                data.notificationIds?.includes(notification.id)
                  ? { ...notification, readAt: new Date().toISOString(), isRead: true }
                  : notification
              )
            }))
          }
        }
      )
      
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }

    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)

    return () => {
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
    }
  }, [queryClient])

  // Infinite query
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['notifications', selectedTab],
    queryFn: ({ pageParam = 1 }) => {
      return notificationsAPI.getNotifications({
        page: pageParam,
        limit: ITEMS_PER_PAGE,
        type: selectedTab
      })
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !lastPage.total) return undefined
      const totalPages = Math.ceil(lastPage.total / ITEMS_PER_PAGE)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    staleTime: 30000,
  })

  // NOW we can use getDateKey safely
  const notifications = useMemo(() => {
    // 👇👇👇 PERBAIKAN DI SINI 👇👇👇
    const allNotifications = data?.pages?.flatMap(page => page?.notifications || []) || [];
    return allNotifications.filter(notification => notification);
  }, [data])

  const groupedNotifications = useMemo(() => {
    return notifications.reduce((groups, notification) => {
      const dateKey = getDateKey(notification.createdAt)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(notification)
      return groups
    }, {})
  }, [notifications, getDateKey])

  const totalCount = data?.pages?.[0]?.total || 0
  const unreadCount = notifications.filter(n => !n.readAt && !n.isRead).length
  const counselingCount = notifications.filter(n => 
    n.type === 'schedule_created' || 
    n.type === 'schedule_updated' || 
    n.type === 'schedule_deleted' ||
    n.type === 'schedule_reminder'
  ).length

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => notificationsAPI.markAsRead(notificationIds),
    onSuccess: (data, notificationIds) => {
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              notifications: page.notifications.map(notification => 
                (Array.isArray(notificationIds) ? notificationIds : [notificationIds])
                  .includes(notification.id)
                  ? { ...notification, readAt: new Date().toISOString(), isRead: true }
                  : notification
              )
            }))
          }
        }
      )
      
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      const unreadIds = notifications
        .filter(n => !n.readAt && !n.isRead)
        .map(n => n.id)
      return notificationsAPI.markAsRead(unreadIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }
  })

  // Handlers
  const handleTabChange = useCallback((tab) => {
    setSelectedTab(tab)
  }, [])

  const handleMarkAsRead = useCallback((notificationId) => {
    markAsReadMutation.mutate(notificationId)
  }, [markAsReadMutation])

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  return {
    notifications,
    groupedNotifications,
    totalCount,
    unreadCount,
    counselingCount,
    selectedTab,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    handleTabChange,
    handleMarkAsRead,
    handleMarkAllAsRead,
    fetchNextPage,
    refetch,
    getDateLabel,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  }
}

export default useNotifications