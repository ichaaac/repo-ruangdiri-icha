// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsAPI } from '../lib/api'
import notificationSocket from '../lib/socket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/id'

dayjs.extend(relativeTime)
dayjs.locale('id')

export const useNotificationDropdown = (selectedTab = 'all') => {
  const queryClient = useQueryClient()
  const MAX_DROPDOWN_ITEMS = 3

  // 🔥 SHARED UNREAD COUNT QUERY
  const {
    data: unreadData,
    isLoading: isUnreadLoading,
    isError: isUnreadError,
    error: unreadError
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      console.log('📊 Dropdown: Fetching unread count')
      const response = await notificationsAPI.getUnreadCount()
      return response.data?.data || response.data
    },
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
  })

  // 🔥 SOCKET SETUP - FIXED: NO useCallback INSIDE useEffect
  useEffect(() => {
    console.log('🔗 Dropdown: Setting up socket listeners')
    
    notificationSocket.connect()
    
    const handleNotificationCreated = (payload) => {
      console.log('🔔 Dropdown: New notification created via socket:', payload)
      
      // 🔥 UPDATE UNREAD COUNT FROM BACKEND
      if (payload.data?.unreadCount !== undefined) {
        const newCount = parseInt(payload.data.unreadCount, 10) || 0
        console.log('📊 Dropdown: Setting unread count from backend:', newCount)
        queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
      }
      
      queryClient.invalidateQueries(['notifications-unread-count'])
      queryClient.invalidateQueries(['notifications'])
    }

    const handleNotificationRead = (payload) => {
      console.log('✅ Dropdown: Notification read via socket:', payload)
      
      // 🔥 UPDATE UNREAD COUNT FROM BACKEND
      if (payload.data?.unreadCount !== undefined) {
        const newCount = parseInt(payload.data.unreadCount, 10) || 0
        console.log('📊 Dropdown: Setting unread count from backend after read:', newCount)
        queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
      }
      
      queryClient.invalidateQueries(['notifications-unread-count'])
      queryClient.invalidateQueries(['notifications'])
    }
    
    // 🔥 REGISTER SOCKET LISTENERS
    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)

    return () => {
      console.log('🔌 Dropdown: Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
    }
  }, [queryClient])

  // 🔥 AMBIL DARI CACHE UTAMA
  const allMainNotificationsData = queryClient.getQueryData(['notifications', 'all'])
  const counselingMainNotificationsData = queryClient.getQueryData(['notifications', 'counseling'])

  const notifications = useMemo(() => {
    let sourceNotifications = []
    
    if (selectedTab === 'all') {
      sourceNotifications = allMainNotificationsData?.pages?.flatMap(page => page.notifications) || []
    } else if (selectedTab === 'counseling') {
      sourceNotifications = counselingMainNotificationsData?.pages?.flatMap(page => page.notifications) || []
      
      // Fallback: ambil dari 'all' lalu filter
      if (sourceNotifications.length === 0 && allMainNotificationsData) {
        sourceNotifications = allMainNotificationsData.pages.flatMap(page => page.notifications).filter(notification => {
          const isCounselingType = ['schedule_created', 'schedule_updated', 'schedule_deleted', 'schedule_reminder'].includes(notification.type) || 
                                 (notification.type === 'counseling' || notification.type === 'schedule')
          return isCounselingType
        })
      }
    }
    
    return sourceNotifications.slice(0, MAX_DROPDOWN_ITEMS)
  }, [allMainNotificationsData, counselingMainNotificationsData, selectedTab])

  // 🔥 UNREAD COUNT
  const rawCount = unreadData?.count
  const unreadCount = parseInt(rawCount, 10) || 0

  // 🔥 COUNSELING COUNT
  const counselingCount = useMemo(() => {
    const allNotifs = allMainNotificationsData?.pages?.flatMap(page => page.notifications) || []
    const count = allNotifs.filter(notification => {
      const isCounselingType = ['schedule_created', 'schedule_updated', 'schedule_deleted', 'schedule_reminder'].includes(notification.type) || 
                             (notification.type === 'counseling' || notification.type === 'schedule')
      const isUnread = !notification.readAt && !notification.isRead
      return isCounselingType && isUnread
    }).length
    console.log(`💬 Counseling count (dropdown): ${count}`)
    return count
  }, [allMainNotificationsData])

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

  const formatUnreadCount = (count) => {
    if (count > 999) return "999+"
    return count.toString()
  }

  console.log('🎯 Dropdown state:', {
    selectedTab,
    notifications: notifications.length,
    unreadCount,
    counselingCount,
    isLoading: isUnreadLoading,
    socketConnected: notificationSocket.isSocketConnected()
  })

  return {
    notifications,
    unreadCount,
    counselingCount, 
    isLoading: isUnreadLoading,
    isError: isUnreadError,
    error: unreadError,
    formatTimeAgo,
    formatUnreadCount,
  }
}