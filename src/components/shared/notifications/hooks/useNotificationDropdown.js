// src/components/shared/notifications/hooks/useNotificationDropdown.js - Fixed with tab support

import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'

export const useNotificationDropdown = (selectedTab = 'system') => { // Default to 'system' instead of 'all'
  const queryClient = useQueryClient()
  const MAX_DROPDOWN_ITEMS = 3

  // Socket real-time updates
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

  // 🔥 FIXED: Query for dropdown notifications - don't send 'all' directly
  const {
    data: dropdownData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications-dropdown', selectedTab],
    queryFn: () => {
      console.log(`📡 Fetching dropdown notifications for tab: ${selectedTab}`)
      return notificationsAPI.getNotifications({
        page: 1,
        limit: MAX_DROPDOWN_ITEMS,
        type: selectedTab // This will be handled correctly in API
      })
    },
    staleTime: 10000,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('❌ Dropdown notifications query failed:', error)
    }
  })

  // 🔥 FIXED: Separate query for all notifications - use valid type
  const {
    data: allNotificationsData,
    isLoading: isAllLoading
  } = useQuery({
    queryKey: ['notifications-dropdown-all-for-counts'],
    queryFn: () => {
      console.log('📡 Fetching all notifications for counts')
      return notificationsAPI.getNotifications({
        page: 1,
        limit: 100,
        type: 'all' // API will handle this by fetching both system and schedule
      })
    },
    staleTime: 10000,
    refetchInterval: 30000,
    onError: (error) => {
      console.error('❌ All notifications for counts query failed:', error)
    }
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
    keepPreviousData: true,
  })

  // Extract data
  const notifications = dropdownData?.notifications || []
  const allNotifications = allNotificationsData?.notifications || []
  const rawCount = unreadData?.count;
  const unreadCount = parseInt(rawCount, 10) || 0;

  // 🔥 NEW: Calculate counseling count from all notifications
  const counselingCount = useMemo(() => {
    const counselingNotifications = allNotifications.filter(notification => {
      const isCounselingType = [
        'schedule_created',
        'schedule_updated', 
        'schedule_deleted',
        'schedule_reminder'
      ].includes(notification.type)
      
      const isUnread = !notification.readAt && !notification.isRead
      
      return isCounselingType && isUnread
    })
    
    console.log(`💬 Counseling count: ${counselingNotifications.length}`)
    return counselingNotifications.length
  }, [allNotifications])

  console.log('🎯 Dropdown state:', {
    selectedTab,
    notifications: notifications.length,
    unreadCount,
    counselingCount,
    isLoading: isLoading || isUnreadLoading || isAllLoading,
    dropdownData,
    unreadData
  })

return {
    notifications,
    unreadCount,
    counselingCount, 
    isListLoading: isLoading || isAllLoading, // Status loading untuk list
    isUnreadCountLoading: isUnreadLoading, // Status loading spesifik untuk count
    isError,
    error,
    refetch,
  }
}

export default useNotificationDropdown