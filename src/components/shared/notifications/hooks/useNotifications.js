// src/components/shared/notifications/hooks/useNotifications.js

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'

/**
 * Main hook untuk notification page dengan real-time updates
 * US-AC-Notif-2-2: Max 10 items per page
 * US-AC-Notif-3-4: Infinite scroll
 */
export const useNotifications = () => {
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('all')

  // US-AC-Notif-2-2: Pagination dengan 10 items per page
  const ITEMS_PER_PAGE = 10

  // Connect socket untuk real-time updates
  useEffect(() => {
    notificationSocket.ensureConnection()

    // Listen real-time events
    const handleNotificationCreated = (data) => {
      // Invalidate queries untuk refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }

    const handleNotificationRead = (data) => {
      // Update cache optimistically
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              notifications: page.notifications.map(notification => 
                data.notificationIds.includes(notification.id)
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

  // Infinite query untuk notifications
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
      const totalPages = Math.ceil(lastPage.total / ITEMS_PER_PAGE)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    staleTime: 30000, // 30 seconds
  })

  // Flatten semua pages jadi array tunggal
  const notifications = useMemo(() => {
    return data?.pages?.flatMap(page => page.notifications) || []
  }, [data])

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    return notifications.reduce((groups, notification) => {
      const dateKey = getDateKey(notification.createdAt)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(notification)
      return groups
    }, {})
  }, [notifications])

  // Get counts
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
      // Update cache optimistically
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
      
      // Update related caches
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

  // Utility functions
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
    // Data
    notifications,
    groupedNotifications,
    
    // Counts
    totalCount,
    unreadCount,
    counselingCount,
    
    // State
    selectedTab,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    
    // Actions
    handleTabChange,
    handleMarkAsRead,
    handleMarkAllAsRead,
    fetchNextPage,
    refetch,
    
    // Utilities
    getDateLabel,
    
    // Loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  }
}

export default useNotifications