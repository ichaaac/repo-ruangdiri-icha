// src/components/shared/notifications/hooks/useNotificationDropdown.js - FIXED: KEEP REACT QUERY

import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import notificationsAPI from '../lib/api'
import notificationSocket from '../lib/socket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/id'

// Configure dayjs
dayjs.extend(relativeTime)
dayjs.locale('id')

export const useNotificationDropdown = (selectedTab = 'all') => {
  const queryClient = useQueryClient()
  const MAX_DROPDOWN_ITEMS = 3

  // 🔥 OPTIMIZED: Dropdown notifications - fetch ONCE, socket updates
  const {
    data: dropdownData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['notifications-dropdown', selectedTab],
    queryFn: () => {
      console.log(`📡 Fetching dropdown notifications for tab: ${selectedTab}`)
      return notificationsAPI.getNotifications({
        page: 1,
        limit: MAX_DROPDOWN_ITEMS,
        type: selectedTab
      })
    },
    staleTime: Infinity, // 🔥 NEVER REFETCH - socket will handle updates
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    onError: (error) => {
      console.error('❌ Dropdown notifications query failed:', error)
    }
  })

  // 🔥 OPTIMIZED: Unread count - shared query, no refetch
  const {
    data: unreadData,
    isLoading: isUnreadLoading
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => {
      console.log('📊 Fetching unread count for dropdown')
      return notificationsAPI.getUnreadCount()
    },
    staleTime: Infinity, // 🔥 NEVER REFETCH - mutations will update
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
  })

  // 🔥 SOCKET SETUP - REAL-TIME UPDATES FOR DROPDOWN
  useEffect(() => {
    console.log('🔗 Dropdown: Setting up socket listeners')
    notificationSocket.ensureConnection()

    const handleNotificationCreated = (data) => {
      console.log('🔔 Dropdown: New notification created')
      
      // Check if notification matches current tab
      const isCounselingNotification = [
        'schedule_created',
        'schedule_updated', 
        'schedule_deleted',
        'schedule_reminder'
      ].includes(data.type)

      const shouldUpdateDropdown = 
        selectedTab === 'all' || 
        (selectedTab === 'counseling' && isCounselingNotification) ||
        (selectedTab === 'system' && !isCounselingNotification)

      if (shouldUpdateDropdown) {
        // Add to dropdown cache - 🔥 FIXED: Better null checks
        queryClient.setQueryData(['notifications-dropdown', selectedTab], (oldData) => {
          if (!oldData || !oldData.notifications || !Array.isArray(oldData.notifications)) {
            console.log('⚠️ Invalid dropdown oldData structure:', oldData)
            return oldData
          }
          
          const newNotifications = [data, ...oldData.notifications].slice(0, MAX_DROPDOWN_ITEMS)
          return {
            ...oldData,
            notifications: newNotifications
          }
        })
      }

      // Update unread count
      queryClient.setQueryData(['notifications-unread-count'], (oldData) => {
        const currentCount = parseInt(oldData?.count || 0, 10)
        return { count: currentCount + 1 }
      })
    }

    const handleNotificationRead = (data) => {
      console.log('✅ Dropdown: Notification marked as read')
      
      // Update dropdown cache - 🔥 FIXED: Better null checks
      queryClient.setQueryData(['notifications-dropdown', selectedTab], (oldData) => {
        if (!oldData || !oldData.notifications || !Array.isArray(oldData.notifications)) {
          console.log('⚠️ Invalid dropdown oldData structure for read:', oldData)
          return oldData
        }
        
        return {
          ...oldData,
          notifications: oldData.notifications.map(notification => 
            data.notificationIds?.includes(notification.id)
              ? { ...notification, readAt: dayjs().toISOString(), isRead: true }
              : notification
          )
        }
      })

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
      console.log('🔌 Dropdown: Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
    }
  }, [queryClient, selectedTab])

  // Extract data
  const notifications = dropdownData?.notifications || []
  const rawCount = unreadData?.count;
  const unreadCount = parseInt(rawCount, 10) || 0;

  // 🔥 CALCULATE COUNSELING COUNT FROM CURRENT NOTIFICATIONS
  const counselingCount = useMemo(() => {
    // Get all notifications to calculate counseling count
    const allNotificationsData = queryClient.getQueryData(['notifications-dropdown', 'all'])
    const allNotifications = allNotificationsData?.notifications || []
    
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
  }, [queryClient])

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

  // 🔥 FORMAT UNREAD COUNT FOR DROPDOWN (max 999)
  const formatUnreadCount = (count) => {
    if (count > 999) return "999+";
    return count.toString();
  }

  console.log('🎯 Dropdown state:', {
    selectedTab,
    notifications: notifications.length,
    unreadCount,
    counselingCount,
    isLoading: isLoading || isUnreadLoading
  })

  return {
    notifications,
    unreadCount,
    counselingCount, 
    isLoading: isLoading || isUnreadLoading,
    isError,
    error,
    formatTimeAgo,
    formatUnreadCount,
  }
}

export default useNotificationDropdown