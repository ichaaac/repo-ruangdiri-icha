// src/components/shared/notifications/hooks/useNotifications.js - FIXED: KEEP REACT QUERY + OPTIMIZE

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient, useQuery} from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/id'

// Configure dayjs
dayjs.extend(relativeTime)
dayjs.locale('id')

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('all')
  const ITEMS_PER_PAGE = 10

  // Define utility functions FIRST
  const getDateKey = useCallback((dateString) => {
    const date = dayjs(dateString)
    const today = dayjs()
    const yesterday = today.subtract(1, 'day')
    
    if (date.isSame(today, 'day')) return 'today'
    if (date.isSame(yesterday, 'day')) return 'yesterday'
    return date.format('YYYY-MM-DD')
  }, [])

  const getDateLabel = useCallback((dateKey) => {
    switch(dateKey) {
      case 'today': return 'Hari ini'
      case 'yesterday': return 'Kemarin'
      default: {
        const date = dayjs(dateKey)
        return date.format('dddd, DD MMMM YYYY')
      }
    }
  }, [])

  // 🔥 FORMAT TIME WITH DAYJS
  const formatTimeAgo = useCallback((timestamp) => {
    try {
      const time = dayjs(timestamp)
      if (!time.isValid()) {
        console.error('Invalid timestamp:', timestamp)
        return 'Baru saja'
      }
      
      const now = dayjs()
      const diffInMinutes = now.diff(time, 'minute')
      
      if (diffInMinutes < 1) return 'Baru saja'
      if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`
      
      const diffInDays = now.diff(time, 'day')
      return `${diffInDays} hari yang lalu`
      
    } catch (error) {
      console.error('Error formatting time:', error, timestamp)
      return 'Baru saja'
    }
  }, [])

  // 🔥 SOCKET SETUP - REAL-TIME UPDATES
  useEffect(() => {
    console.log('🔗 Main notifications: Setting up socket listeners')
    notificationSocket.ensureConnection()

    const handleNotificationCreated = (data) => {
      console.log('🔔 New notification created - updating main list')
      
      // Add to infinite query cache - 🔥 FIXED: Better null checks
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (oldData) => {
          if (!oldData || !oldData.pages || !Array.isArray(oldData.pages)) {
            console.log('⚠️ Invalid oldData structure for new notification:', oldData)
            return oldData
          }
          
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index === 0) {
                // Add to first page
                if (!page || !page.notifications || !Array.isArray(page.notifications)) {
                  console.log('⚠️ Invalid first page structure:', page)
                  return page
                }
                return {
                  ...page,
                  notifications: [data, ...page.notifications]
                }
              }
              return page
            })
          }
        }
      )

      // Update unread count
      queryClient.setQueryData(['notifications-unread-count'], (oldData) => {
        const currentCount = parseInt(oldData?.count || 0, 10)
        return { count: currentCount + 1 }
      })
    }

    const handleNotificationRead = (data) => {
      console.log('✅ Notification marked as read:', data)
      
      // Update infinite query cache - 🔥 FIXED: Better null checks
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (oldData) => {
          if (!oldData || !oldData.pages || !Array.isArray(oldData.pages)) {
            console.log('⚠️ Invalid oldData structure for read notification:', oldData)
            return oldData
          }
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              if (!page || !page.notifications || !Array.isArray(page.notifications)) {
                console.log('⚠️ Invalid page structure:', page)
                return page
              }
              
              return {
                ...page,
                notifications: page.notifications.map(notification => 
                  data.notificationIds?.includes(notification.id)
                    ? { ...notification, readAt: dayjs().toISOString(), isRead: true }
                    : notification
                )
              }
            })
          }
        }
      )
      
      // Update unread count
      if (data.newUnreadCount !== undefined) {
        queryClient.setQueryData(['notifications-unread-count'], () => ({
          count: data.newUnreadCount
        }))
      }
    }

    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)

    return () => {
      console.log('🔌 Main notifications: Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
    }
  }, [queryClient])

  // 🔥 OPTIMIZED: Infinite query - initial fetch only, socket for updates
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
        type: selectedTab
      })
    },
    getNextPageParam: (lastPage, allPages) => {
      console.log('📊 Pagination check:', { lastPage, totalPages: allPages.length })
      if (!lastPage || !lastPage.total) return undefined
      const totalPages = Math.ceil(lastPage.total / ITEMS_PER_PAGE)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    staleTime: 5 * 60 * 1000, // 🔥 REDUCED: 5 minutes instead of 30 seconds
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // 🔥 DISABLE: No refetch on focus
    refetchOnMount: false, // 🔥 DISABLE: No refetch on mount after initial
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('❌ Main notifications query failed:', error)
    }
  })

  // 🔥 GET UNREAD COUNT - SHARED QUERY
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => {
      console.log('📊 Fetching unread count for main page')
      return notificationsAPI.getUnreadCount()
    },
    staleTime: Infinity, // Never refetch - mutations will update
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
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
      
      const notifications = page?.notifications || page?.data?.notifications || []
      console.log('📋 Page notifications:', notifications)
      
      return notifications
    })

    const filteredNotifications = allNotifications.filter(notification => {
      if (!notification) {
        console.log('⚠️ Found null/undefined notification')
        return false
      }
      
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
    const count = parseInt(unreadData?.count, 10) || 0
    console.log('🔴 Unread count from query:', count)
    return count
  }, [unreadData])

  const counselingCount = useMemo(() => {
    const count = notifications.filter(n => 
      ['schedule_created', 'schedule_updated', 'schedule_deleted', 'schedule_reminder'].includes(n.type) &&
      !n.readAt && !n.isRead
    ).length
    console.log('💬 Counseling count:', count)
    return count
  }, [notifications])

  // 🔥 MARK AS READ MUTATION - USE BACKEND RESPONSE
  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => {
      console.log('✏️ Marking as read:', notificationIds)
      return notificationsAPI.markAsRead(notificationIds)
    },
    onSuccess: (response, notificationIds) => {
      console.log('✅ Mark as read success:', { response, notificationIds })
      
      // Update infinite query cache - 🔥 FIXED: Better null checks
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (oldData) => {
          if (!oldData || !oldData.pages || !Array.isArray(oldData.pages)) {
            console.log('⚠️ Invalid oldData structure for mark as read:', oldData)
            return oldData
          }
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              if (!page || !page.notifications || !Array.isArray(page.notifications)) {
                console.log('⚠️ Invalid page structure:', page)
                return page
              }
              
              return {
                ...page,
                notifications: page.notifications.map(notification => 
                  (Array.isArray(notificationIds) ? notificationIds : [notificationIds])
                    .includes(notification.id)
                    ? { ...notification, readAt: dayjs().toISOString(), isRead: true }
                    : notification
                )
              }
            })
          }
        }
      )

      // 🔥 USE BACKEND RESPONSE FOR UNREAD COUNT
      if (response?.unreadCount !== undefined) {
        queryClient.setQueryData(['notifications-unread-count'], () => ({
          count: response.unreadCount
        }))
      }
    },
    onError: (error) => {
      console.error('❌ Mark as read error:', error)
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      console.log('✏️ Marking all as read')
      return notificationsAPI.markallAsRead()
    },
    onSuccess: (response) => {
      console.log('✅ Mark all as read success:', response)
      
      // Update infinite query cache - 🔥 FIXED: Better null checks
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (oldData) => {
          if (!oldData || !oldData.pages || !Array.isArray(oldData.pages)) {
            console.log('⚠️ Invalid oldData structure for mark all as read:', oldData)
            return oldData
          }
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              if (!page || !page.notifications || !Array.isArray(page.notifications)) {
                console.log('⚠️ Invalid page structure:', page)
                return page
              }
              
              return {
                ...page,
                notifications: page.notifications.map(notification => ({
                  ...notification,
                  readAt: notification.readAt || dayjs().toISOString(),
                  isRead: true
                }))
              }
            })
          }
        }
      )

      // 🔥 USE BACKEND RESPONSE FOR UNREAD COUNT
      queryClient.setQueryData(['notifications-unread-count'], () => ({
        count: response?.unreadCount || 0
      }))
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

  // 🔥 FORMAT COUNT WITH NO LIMITS (can show thousands)
  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

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
    formatTimeAgo,
    formatCount,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  }
}

export default useNotifications