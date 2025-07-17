// src/components/shared/notifications/context/NotificationContext.jsx - FIXED WITH REACT QUERY

import React, { createContext, useContext } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/id'
import { useEffect } from 'react'

// Configure dayjs
dayjs.extend(relativeTime)
dayjs.locale('id')

// Context
const NotificationContext = createContext()

// Provider component - KEEP REACT QUERY BUT OPTIMIZE
export const NotificationProvider = ({ children }) => {
  const queryClient = useQueryClient()

  // 🔥 OPTIMIZED: Initial notifications fetch with NO REFETCH
  const { 
    data: notificationsData, 
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
    error: notificationsError
  } = useQuery({
    queryKey: ['notifications-initial'],
    queryFn: () => {
      console.log('🚀 Initial notifications fetch - ONCE ONLY')
      return notificationsAPI.getNotifications({ 
        page: 1, 
        limit: 100, 
        type: 'all' 
      })
    },
    staleTime: Infinity, // 🔥 NEVER REFETCH - socket will handle updates
    cacheTime: Infinity, // Keep in cache forever
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // 🔥 OPTIMIZED: Unread count with NO REFETCH INTERVAL
  const { 
    data: unreadData, 
    isLoading: isUnreadLoading 
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => {
      console.log('📊 Initial unread count fetch - ONCE ONLY')
      return notificationsAPI.getUnreadCount()
    },
    staleTime: Infinity, // 🔥 NEVER REFETCH - backend will update this
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // 🔥 SOCKET SETUP - REAL-TIME UPDATES
  useEffect(() => {
    if (!notificationsData) return // Wait for initial data

    console.log('🔗 Setting up socket listeners')
    notificationSocket.ensureConnection()

    const handleNotificationCreated = (data) => {
      console.log('🔔 New notification received via socket:', data)
      
      // Add to notifications cache
      queryClient.setQueryData(['notifications-initial'], (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          notifications: [data, ...oldData.notifications]
        }
      })

      // Update unread count (+1)
      queryClient.setQueryData(['notifications-unread-count'], (oldData) => {
        const currentCount = parseInt(oldData?.count || 0, 10)
        return { count: currentCount + 1 }
      })
    }

    const handleNotificationRead = (data) => {
      console.log('✅ Notification read via socket:', data)
      
      // Update notifications cache
      queryClient.setQueryData(['notifications-initial'], (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          notifications: oldData.notifications.map(notification => 
            data.notificationIds?.includes(notification.id)
              ? { ...notification, readAt: dayjs().toISOString(), isRead: true }
              : notification
          )
        }
      })

      // Update unread count from socket data
      if (data.newUnreadCount !== undefined) {
        queryClient.setQueryData(['notifications-unread-count'], () => ({
          count: data.newUnreadCount
        }))
      }
    }

    // Subscribe to socket events
    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)

    return () => {
      console.log('🔌 Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
    }
  }, [notificationsData, queryClient])

  // 🔥 MARK AS READ MUTATION - USE BACKEND RESPONSE
  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => {
      console.log('✏️ Marking as read (backend call):', notificationIds)
      return notificationsAPI.markAsRead(notificationIds)
    },
    onSuccess: (response, notificationIds) => {
      console.log('✅ Mark as read success:', response)
      
      // Update notifications cache
      queryClient.setQueryData(['notifications-initial'], (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          notifications: oldData.notifications.map(notification => 
            (Array.isArray(notificationIds) ? notificationIds : [notificationIds])
              .includes(notification.id)
              ? { ...notification, readAt: dayjs().toISOString(), isRead: true }
              : notification
          )
        }
      })

      // 🔥 USE BACKEND RESPONSE FOR UNREAD COUNT
      if (response?.unreadCount !== undefined) {
        queryClient.setQueryData(['notifications-unread-count'], () => ({
          count: response.unreadCount
        }))
      }
    },
    onError: (error) => {
      console.error('❌ Mark as read failed:', error)
    }
  })

  // 🔥 MARK ALL AS READ MUTATION
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      console.log('✏️ Marking all as read (backend call)')
      return notificationsAPI.markallAsRead()
    },
    onSuccess: (response) => {
      console.log('✅ Mark all as read success:', response)
      
      // Update all notifications to read
      queryClient.setQueryData(['notifications-initial'], (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          notifications: oldData.notifications.map(notification => ({
            ...notification,
            readAt: notification.readAt || dayjs().toISOString(),
            isRead: true
          }))
        }
      })

      // 🔥 USE BACKEND RESPONSE FOR UNREAD COUNT (should be 0)
      queryClient.setQueryData(['notifications-unread-count'], () => ({
        count: response?.unreadCount || 0
      }))
    },
    onError: (error) => {
      console.error('❌ Mark all as read failed:', error)
    }
  })

  // Extract data
  const notifications = notificationsData?.notifications || []
  const unreadCount = parseInt(unreadData?.count, 10) || 0

  // Helper functions
  const isCounselingNotification = (notification) => {
    return [
      'schedule_created',
      'schedule_updated', 
      'schedule_deleted',
      'schedule_reminder'
    ].includes(notification.type)
  }

  const getNotificationsByType = (type = 'all') => {
    if (type === 'all') {
      return notifications
    }
    
    if (type === 'counseling' || type === 'schedule') {
      return notifications.filter(n => isCounselingNotification(n))
    }
    
    if (type === 'system') {
      return notifications.filter(n => !isCounselingNotification(n))
    }
    
    return notifications
  }

  const counselingCount = notifications.filter(n => 
    isCounselingNotification(n) && !n.readAt && !n.isRead
  ).length

  // 🔥 FORMAT TIME WITH DAYJS
  const formatTimeAgo = (timestamp) => {
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
  }

  // 🔥 GET DATE KEY WITH DAYJS
  const getDateKey = (timestamp) => {
    const date = dayjs(timestamp)
    const today = dayjs()
    const yesterday = today.subtract(1, 'day')
    
    if (date.isSame(today, 'day')) return 'today'
    if (date.isSame(yesterday, 'day')) return 'yesterday'
    return date.format('YYYY-MM-DD')
  }

  // 🔥 GET DATE LABEL WITH DAYJS
  const getDateLabel = (dateKey) => {
    switch(dateKey) {
      case 'today': return 'Hari ini'
      case 'yesterday': return 'Kemarin'
      default: {
        const date = dayjs(dateKey)
        return date.format('dddd, DD MMMM YYYY')
      }
    }
  }

  const contextValue = {
    // State
    notifications,
    unreadCount,
    counselingCount,
    isInitialLoading: isNotificationsLoading || isUnreadLoading,
    isError: isNotificationsError,
    error: notificationsError,
    
    // Actions
    markAsRead: (notificationIds) => markAsReadMutation.mutate(notificationIds),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    
    // Loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    
    // Selectors
    getNotificationsByType,
    
    // Utilities
    formatTimeAgo,
    getDateKey,
    getDateLabel,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

// Custom hook to use notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}

export default NotificationContext