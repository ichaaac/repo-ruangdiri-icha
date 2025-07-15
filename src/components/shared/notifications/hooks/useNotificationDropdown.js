// src/components/shared/notifications/hooks/useNotificationDropdown.js - FIXED VERSION

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'

export const useNotificationDropdown = () => {
  const queryClient = useQueryClient()
  const MAX_DROPDOWN_ITEMS = 3

// Socket real-time updatesi
  useEffect(() => {
    notificationSocket.ensureConnection()

    const handleNotificationCreated = () => {
      console.log('🔔 Dropdown: New notification created')
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }

    const handleNotificationRead = () => {
      console.log('✅ Dropdown: Notification marked as read')
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

  // Query for dropdown notifications
  const {
    data: dropdownData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications-dropdown'],
    queryFn: () => {
      console.log('📡 Fetching dropdown notifications')
      return notificationsAPI.getNotifications({
        page: 1,
        limit: MAX_DROPDOWN_ITEMS,
        type: 'all'
      })
    },
    staleTime: 10000,
    refetchInterval: 30000,
  })

  // Query for unread count
  const {
    data: unreadData,
    isLoading: isUnreadLoading
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => {
      console.log('📡 Fetching unread count')
      return notificationsAPI.getUnreadCount()
    },
    staleTime: 5000,
    refetchInterval: 15000,
  })

  // 🔥 FIX: Handle API response structure
  const notifications = dropdownData?.notifications || []
  const unreadCount = unreadData?.count || 0

  console.log('🎯 Dropdown state:', {
    notifications: notifications.length,
    unreadCount,
    isLoading: isLoading || isUnreadLoading,
    dropdownData,
    unreadData
  })

  return {
    notifications,
    unreadCount,
    isLoading: isLoading || isUnreadLoading,
    isError,
    error,
    refetch,
  }
}

export default useNotificationDropdown