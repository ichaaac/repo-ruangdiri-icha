// src/components/shared/notifications/hooks/useNotifications.js - FIXED VERSION

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
      console.log('🔔 New notification created - invalidating queries')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }

    const handleNotificationRead = (data) => {
      console.log('✅ Notification marked as read:', data)
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

  // Infinite query with error handling - FIXED: Don't send 'all' directly  
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
      console.log(`📡 Fetching notifications - Page: ${pageParam}, Tab: ${selectedTab}`)
      return notificationsAPI.getNotifications({
        page: pageParam,
        limit: ITEMS_PER_PAGE,
        type: selectedTab // API will handle 'all' correctly
      })
    },
    getNextPageParam: (lastPage, allPages) => {
      console.log('📊 Pagination check:', { lastPage, totalPages: allPages.length })
      if (!lastPage || !lastPage.total) return undefined
      const totalPages = Math.ceil(lastPage.total / ITEMS_PER_PAGE)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    staleTime: 30000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('❌ Main notifications query failed:', error)
    }
  })

  // 🔥 FIX: Extract and validate notifications data
  const notifications = useMemo(() => {
    console.log('🔍 Processing notifications data:', data)
    
    if (!data || !data.pages) {
      console.log('❌ No data or pages found')
      return []
    }

    const allNotifications = data.pages.flatMap(page => {
      console.log('📄 Processing page:', page)
      
      // Handle both possible structures
      const notifications = page?.notifications || page?.data?.notifications || []
      console.log('📋 Page notifications:', notifications)
      
      return notifications
    })

    const filteredNotifications = allNotifications.filter(notification => {
      if (!notification) {
        console.log('⚠️ Found null/undefined notification')
        return false
      }
      
      // Validate required fields
      if (!notification.id || !notification.title || !notification.createdAt) {
        console.log('⚠️ Invalid notification structure:', notification)
        return false
      }
      
      return true
    })

    console.log(`✅ Final notifications count: ${filteredNotifications.length}`)
    return filteredNotifications
  }, [data])

  const groupedNotifications = useMemo(() => {
    console.log('🗂️ Grouping notifications by date:', notifications.length)
    
    const grouped = notifications.reduce((groups, notification) => {
      try {
        const dateKey = getDateKey(notification.createdAt)
        if (!groups[dateKey]) {
          groups[dateKey] = []
        }
        groups[dateKey].push(notification)
        return groups
      } catch (error) {
        console.error('❌ Error grouping notification:', error, notification)
        return groups
      }
    }, {})

    console.log('🗂️ Grouped notifications:', Object.keys(grouped).map(key => `${key}: ${grouped[key].length}`))
    return grouped
  }, [notifications, getDateKey])

  // 🔥 FIX: Handle nested total structure
  const totalCount = useMemo(() => {
    const count = data?.pages?.[0]?.total || data?.pages?.[0]?.data?.total || 0
    console.log('📊 Total count:', count)
    return count
  }, [data])

  const unreadCount = useMemo(() => {
    const count = notifications.filter(n => !n.readAt && !n.isRead).length
    console.log('🔴 Unread count:', count)
    return count
  }, [notifications])

  const counselingCount = useMemo(() => {
    const count = notifications.filter(n => 
      n.type === 'schedule_created' || 
      n.type === 'schedule_updated' || 
      n.type === 'schedule_deleted' ||
      n.type === 'schedule_reminder'
    ).length
    console.log('💬 Counseling count:', count)
    return count
  }, [notifications])

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => {
      console.log('✏️ Marking as read:', notificationIds)
      return notificationsAPI.markAsRead(notificationIds)
    },
    onSuccess: (data, notificationIds) => {
      console.log('✅ Mark as read success:', { data, notificationIds })
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
    },
    onError: (error) => {
      console.error('❌ Mark as read error:', error)
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      const unreadIds = notifications
        .filter(n => !n.readAt && !n.isRead)
        .map(n => n.id)
      console.log('✏️ Marking all as read:', unreadIds)
      return notificationsAPI.markAsRead(unreadIds)
    },
    onSuccess: () => {
      console.log('✅ Mark all as read success')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: (error) => {
      console.error('❌ Mark all as read error:', error)
    }
  })

  // Handlers
  const handleTabChange = useCallback((tab) => {
    console.log('🔄 Tab changed to:', tab)
    setSelectedTab(tab)
  }, [])

  const handleMarkAsRead = useCallback((notificationId) => {
    console.log('👆 Mark as read clicked:', notificationId)
    markAsReadMutation.mutate(notificationId)
  }, [markAsReadMutation])

  const handleMarkAllAsRead = useCallback(() => {
    console.log('👆 Mark all as read clicked')
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  // 🔥 DEBUG: Log final state
  useEffect(() => {
    console.log('🎯 Final state summary:', {
      notificationsCount: notifications.length,
      groupedKeys: Object.keys(groupedNotifications),
      totalCount,
      unreadCount,
      counselingCount,
      selectedTab,
      isLoading,
      isError
    })
  }, [notifications, groupedNotifications, totalCount, unreadCount, counselingCount, selectedTab, isLoading, isError])

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