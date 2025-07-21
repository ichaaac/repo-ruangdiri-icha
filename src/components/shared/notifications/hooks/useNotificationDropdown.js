// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import "dayjs/locale/id"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"
import { getRelativeTime } from "../../schedule/utils/timezoneHandler"

// Configure dayjs
dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
dayjs.locale("id")

dayjs.updateLocale("id", {
  relativeTime: {
    future: "dalam %s",
    past: "%s lalu",
    s: "beberapa detik",
    m: "semenit",
    mm: "%d menit",
    h: "sejam",
    hh: "%d jam",
    d: "sehari",
    dd: "%d hari",
    M: "sebulan",
    MM: "%d bulan",
    y: "setahun",
    yy: "%d tahun",
  },
})

export const useNotificationDropdown = (selectedTab = 'all') => {
  const queryClient = useQueryClient()

  // 🔥 SHARED UNREAD COUNT QUERY  
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      console.log('📊 Dropdown: Fetching unread count from API')
      const response = await notificationsAPI.getUnreadCount()
      return response.data?.data || response.data
    },
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  })

  // 🔥 INVALIDATE NOTIFICATIONS ON PROFILE UPDATE
  // Call this from your profile update component:
  // queryClient.invalidateQueries(['notifications'])
  // queryClient.invalidateQueries(['notifications-dropdown'])
  // queryClient.invalidateQueries(['notifications-unread-count'])

  // 🔥 NOTIFICATIONS QUERY FOR DROPDOWN (LIMIT 5)
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-dropdown', selectedTab],
    queryFn: async () => {
      console.log('📋 Dropdown: Fetching notifications for tab:', selectedTab)
      const filters = {
        page: 1,
        limit: 5, // Only show 5 latest for dropdown
        type: selectedTab, // Pass the selectedTab directly ('all', 'counseling')
      }
      const response = await notificationsAPI.getNotifications(filters)
      return response.data?.data || response.data
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  const notifications = notificationsData?.notifications || []
  const unreadCount = parseInt(unreadData?.count, 10) || 0

  // 🔥 ENHANCED COUNSELING COUNT - USE TYPE & SUBTYPE
  const counselingCount = notifications.filter(
    (notif) => {
      const isCounselingType = notif.type === 'schedule' && notif.subType === 'counseling'
      const isUnread = !notif.isRead && !notif.readAt
      return isCounselingType && isUnread
    }
  ).length

  // 🔥 SOCKET SETUP FOR REALTIME UPDATES
  useEffect(() => {
    console.log('🔗 Dropdown: Setting up socket listeners')
    
    notificationSocket.connect()

    const handleNotificationCreated = (payload) => {
      console.log('🔔 Dropdown: New notification via socket:', payload)
      
      // 🔥 UPDATE UNREAD COUNT
      if (payload.data?.unreadCount !== undefined) {
        const newCount = parseInt(payload.data.unreadCount, 10) || 0
        console.log('📊 Dropdown: Setting count from backend (socket created):', newCount)
        queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
      } else {
        console.log('📊 Dropdown: Socket created event without unreadCount. Invalidating.')
        queryClient.invalidateQueries(['notifications-unread-count'])
      }

      // 🔥 UPDATE DROPDOWN NOTIFICATIONS
      queryClient.setQueriesData(['notifications-dropdown', selectedTab], (oldData) => {
        if (!oldData) return oldData

        const isCounselingNotification = payload.data?.type === 'schedule' && payload.data?.subType === 'counseling'
        const isSystemNotification = payload.data?.type === 'system'

        const shouldAdd = (selectedTab === 'all') ||
                          (selectedTab === 'counseling' && isCounselingNotification)

        if (!shouldAdd) {
          console.log('Dropdown: Skipping adding notification to current tab:', selectedTab)
          return oldData
        }

        const newNotification = {
          id: payload.data?.id || `temp-${Date.now()}`,
          title: payload.data?.title || '',
          message: payload.data?.message || '',
          createdAt: payload.data?.createdAt || new Date().toISOString(),
          isRead: false,
          type: payload.data?.type || 'system',
          subType: payload.data?.subType,
          recipientId: payload.data?.recipientId,
          readAt: null,
        }
        
        return {
          ...oldData,
          notifications: [newNotification, ...oldData.notifications].slice(0, 5), // Keep only 5 latest
          total: (oldData.total || 0) + 1,
        }
      })

      // 🔥 ALSO INVALIDATE MAIN NOTIFICATIONS QUERY
      queryClient.invalidateQueries(['notifications'])
    }

    const handleNotificationRead = (payload) => {
      console.log('✅ Dropdown: Notification read via socket:', payload)

      // 🔥 UPDATE UNREAD COUNT
      if (payload.data?.unreadCount !== undefined) {
        const newCount = parseInt(payload.data.unreadCount, 10) || 0
        console.log('📊 Dropdown: Setting count from backend (socket read):', newCount)
        queryClient.setQueryData(['notifications-unread-count'], { count: newCount })
      } else {
        console.log('📊 Dropdown: Socket read event without unreadCount. Invalidating.')
        queryClient.invalidateQueries(['notifications-unread-count'])
      }

      // 🔥 UPDATE DROPDOWN NOTIFICATIONS
      queryClient.setQueriesData(['notifications-dropdown'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif =>
            payload.data?.notificationIds?.includes(notif.id)
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          ),
        }
      })

      // 🔥 ALSO UPDATE MAIN NOTIFICATIONS QUERY
      queryClient.setQueriesData(['notifications'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.map(notif =>
              payload.data?.notificationIds?.includes(notif.id)
                ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                : notif
            ),
          })),
        }
      })
    }

    const handleMarkAllRead = (payload) => {
      console.log('✅ Dropdown: Mark all read via socket:', payload)
      
      // 🔥 UPDATE UNREAD COUNT TO 0
      queryClient.setQueryData(['notifications-unread-count'], { count: 0 })
      
      // 🔥 UPDATE ALL NOTIFICATIONS TO READ
      queryClient.setQueriesData(['notifications-dropdown'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
        }
      })

      // 🔥 ALSO UPDATE MAIN NOTIFICATIONS QUERY
      queryClient.setQueriesData(['notifications'], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.map(notif => ({
              ...notif,
              isRead: true,
              readAt: new Date().toISOString(),
            })),
          })),
        }
      })
    }

    // 🔥 REGISTER SOCKET LISTENERS
    notificationSocket.on('notification:created', handleNotificationCreated)
    notificationSocket.on('notification:read', handleNotificationRead)
    notificationSocket.on('notification:mark-all-read', handleMarkAllRead)

    return () => {
      console.log('🔌 Dropdown: Cleaning up socket listeners')
      notificationSocket.off('notification:created', handleNotificationCreated)
      notificationSocket.off('notification:read', handleNotificationRead)
      notificationSocket.off('notification:mark-all-read', handleMarkAllRead)
    }
  }, [queryClient, selectedTab])

  // 🔥 ENHANCED FORMAT FUNCTIONS - USE TIMEZONE HANDLER
  const formatTimeAgo = (timestamp) => {
    // Try to use timezone handler first, fallback to dayjs
    try {
      const result = getRelativeTime(timestamp)
      return result || dayjs(timestamp).fromNow()
    } catch {
      return dayjs(timestamp).fromNow()
    }
  }

  const formatUnreadCount = (count) => {
    if (count > 99) return '99+'
    return count.toString()
  }

  console.log('🎯 Dropdown state:', {
    selectedTab,
    notifications: notifications.length,
    unreadCount,
    counselingCount,
    isLoading,
    socketConnected: notificationSocket.isSocketConnected()
  })

  return {
    notifications,
    unreadCount,
    counselingCount,
    isLoading,
    formatTimeAgo,
    formatUnreadCount,
  }
}