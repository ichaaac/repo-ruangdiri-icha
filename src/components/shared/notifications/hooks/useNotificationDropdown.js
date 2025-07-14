// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'

/**
 * Hook untuk dropdown notifications
 * US-AC-Notif-1-2: Max 3 items di dropdown
 */
export const useNotificationDropdown = () => {
  const queryClient = useQueryClient()
  
  // US-AC-Notif-1-2: Max 3 items untuk dropdown
  const MAX_DROPDOWN_ITEMS = 3

  // Connect socket untuk real-time updates
  useEffect(() => {
    notificationSocket.ensureConnection()

    // Listen real-time events untuk dropdown
    const handleNotificationCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    }

    const handleNotificationRead = () => {
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

  // Query untuk dropdown notifications (latest 3)
  const {
    data: dropdownData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications-dropdown'],
    queryFn: () => notificationsAPI.getNotifications({
      page: 1,
      limit: MAX_DROPDOWN_ITEMS,
      type: 'all' // Always show all types in dropdown
    }),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Query untuk unread count
  const {
    data: unreadData,
    isLoading: isUnreadLoading
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    staleTime: 5000, // 5 seconds
    refetchInterval: 15000, // Refetch every 15 seconds
  })

  const notifications = dropdownData?.notifications || []
  const unreadCount = unreadData?.count || 0

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