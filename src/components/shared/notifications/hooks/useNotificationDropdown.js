// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'

export const useNotificationDropdown = () => {
  const queryClient = useQueryClient()
  const MAX_DROPDOWN_ITEMS = 3

  // Socket real-time updates
  useEffect(() => {
    notificationSocket.ensureConnection()

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

  // Query for dropdown notifications
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
      type: 'all'
    }),
    staleTime: 10000,
    refetchInterval: 30000,
  })

  // Query for unread count
  const {
    data: unreadData,
    isLoading: isUnreadLoading
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    staleTime: 5000,
    refetchInterval: 15000,
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