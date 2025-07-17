// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useEffect, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsAPI } from '../lib/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/id'
import { useWebSocket } from "@/components/shared/schedule/hooks/useWebSocket"

dayjs.extend(relativeTime)
dayjs.locale('id')

export const useNotificationDropdown = (selectedTab = 'all') => {
  const queryClient = useQueryClient()
  const MAX_DROPDOWN_ITEMS = 3

  // 🔥 PERBAIKAN: JANGAN PAKE useQuery BARU UNTUK DROPDOWN NOTIFIKASI
  // KITA AKAN BACA DARI CACHE UTAMA 'notifications'
  // const { data: dropdownData, isLoading, isError, error } = useQuery({ ... });

  // 🔥 OPTIMIZED: Unread count - shared query (tidak ada perubahan di sini)
  const {
    data: unreadData,
    isLoading: isUnreadLoading
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      console.log('📊 Fetching unread count for dropdown')
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

  const { socket, isConnected: isSocketConnected, on, off } = useWebSocket()

  // 🔥 PERBAIKAN: Handler socket hanya perlu invalidate, bukan update cache detail
  // Karena data detail notifikasi diurus oleh useNotifications (infinite query)
  // yang nanti akan me-refetch dan meng-update cache utama.

  useEffect(() => {
    if (!socket || !isSocketConnected) {
      console.log('🔗 Dropdown: Waiting for WebSocket connection to be established.')
      return
    }
    
    console.log('🔗 Dropdown: Setting up socket listeners')
    
    const handleNotificationCreated = useCallback((data) => {
      console.log('🔔 Dropdown: New notification created. Invalidating relevant queries.', data)
      // Invalidasi unread count
      queryClient.invalidateQueries(['notifications-unread-count']);
      // Invalidasi cache notifikasi utama (untuk semua tab)
      queryClient.invalidateQueries(['notifications']);
      // Jika ada kebutuhan update UI toast cepat, bisa dilakukan di sini,
      // tapi untuk data display dropdown, kita andalkan refetch cache utama.
    }, [queryClient]);

    const handleNotificationRead = useCallback((data) => {
      console.log('✅ Dropdown: Notification marked as read. Invalidating relevant queries.', data)
      // Invalidasi unread count
      queryClient.invalidateQueries(['notifications-unread-count']);
      // Invalidasi cache notifikasi utama (untuk semua tab)
      queryClient.invalidateQueries(['notifications']);
    }, [queryClient]);
    
    on('notification:created', handleNotificationCreated)
    on('notification:new', handleNotificationCreated)
    on('notification:read', handleNotificationRead)
    on('read', handleNotificationRead)

    return () => {
      console.log('🔌 Dropdown: Cleaning up socket listeners')
      off('notification:created', handleNotificationCreated)
      off('notification:new', handleNotificationCreated)
      off('notification:read', handleNotificationRead)
      off('read', handleNotificationRead)
    }
  }, [socket, isSocketConnected, on, off, queryClient]) // Perbaiki dependensi

  // 🔥 PERBAIKAN: Ambil notifikasi dari cache utama useNotifications
  const allMainNotificationsData = queryClient.getQueryData(['notifications', 'all']); // Coba ambil dari tab 'all'
  const counselingMainNotificationsData = queryClient.getQueryData(['notifications', 'counseling']); // Coba ambil dari tab 'counseling'

  const notifications = useMemo(() => {
    let sourceNotifications = [];
    if (selectedTab === 'all') {
        sourceNotifications = allMainNotificationsData?.pages?.flatMap(page => page.notifications) || [];
    } else if (selectedTab === 'counseling') {
        sourceNotifications = counselingMainNotificationsData?.pages?.flatMap(page => page.notifications) || [];
        // Fallback jika tab counseling belum ter-load, ambil dari 'all' lalu filter
        if (sourceNotifications.length === 0 && allMainNotificationsData) {
             sourceNotifications = allMainNotificationsData.pages.flatMap(page => page.notifications).filter(notification => {
                const isCounselingType = ['schedule_created', 'schedule_updated', 'schedule_deleted', 'schedule_reminder'].includes(notification.type) || (notification.type === 'counseling' || notification.type === 'schedule');
                return isCounselingType;
             });
        }
    }
    // Filter dan ambil hanya yang belum dibaca jika tab bukan 'all', atau ambil semua jika tab 'all'
    // Lalu ambil MAX_DROPDOWN_ITEMS yang terbaru
    return sourceNotifications
        // .filter(notif => selectedTab === 'all' ? true : (!notif.isRead && !notif.readAt)) // Tidak perlu filter unread di sini, biarkan UI component yang filter
        .slice(0, MAX_DROPDOWN_ITEMS);
  }, [allMainNotificationsData, counselingMainNotificationsData, selectedTab, queryClient]); // Tambahkan queryClient sebagai dependency

  const rawCount = unreadData?.count;
  const unreadCount = parseInt(rawCount, 10) || 0;

  // 🔥 PERBAIKAN: counselingCount juga ambil dari cache utama dan dihitung ulang
  const counselingCount = useMemo(() => {
    const allNotifs = allMainNotificationsData?.pages?.flatMap(page => page.notifications) || [];
    const count = allNotifs.filter(notification => {
      const isCounselingType = ['schedule_created', 'schedule_updated', 'schedule_deleted', 'schedule_reminder'].includes(notification.type) || (notification.type === 'counseling' || notification.type === 'schedule');
      const isUnread = !notification.readAt && !notification.isRead;
      return isCounselingType && isUnread;
    }).length;
    console.log(`💬 Counseling count (dropdown memo from main cache): ${count}`);
    return count;
  }, [allMainNotificationsData]);


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