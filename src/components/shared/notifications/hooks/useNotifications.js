// src/components/shared/notifications/hooks/useNotifications.js

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"
import { 
  formatTimeAgoDetailed, 
  getDateLabel, 
  groupNotificationsByDate 
} from "../lib/timezoneUtils"

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (() => {
    const tab = (searchParams.get('tab') || '').toLowerCase()
    return tab === 'counseling' ? 'counseling' : 'all'
  })()
  const [selectedTab, setSelectedTab] = useState(initialTab)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  })

  const generalCount = unreadData?.generalCount || 0
  const counselingCount = unreadData?.counselingCount || 0

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['notifications', selectedTab],
    queryFn: async ({ pageParam = 1 }) => {
      const filters = {
        page: pageParam,
        limit: 10,
        type: selectedTab,
      };
      
      const result = await notificationsAPI.getNotifications(filters);
      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      const lastPageTotal = lastPage?.total || 0
      const lastPageNotificationsCount = lastPage?.notifications?.length || 0

      if (!lastPage || lastPageNotificationsCount === 0) {
        return undefined
      }

      const totalFetched = allPages.reduce((acc, page) => {
        return acc + (page?.notifications?.length || 0)
      }, 0)

      if (totalFetched >= lastPageTotal) {
        return undefined
      }
      
      return allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const notifications = data?.pages.flatMap(page => page.notifications) || []
  const totalCount = data?.pages[0]?.total || 0

  // 🔥 UPDATED: Use utility function for grouping
  const groupedNotifications = groupNotificationsByDate(notifications);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => notificationsAPI.markAsRead(notificationIds),
    onSuccess: (response, notificationIds) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: (error) => console.error('❌ Main: Mark as read failed:', error),
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markallAsRead,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: (error) => console.error('❌ Main: Mark all as read failed:', error),
  })

  useEffect(() => {
    notificationSocket.connect().catch(err => {
      console.error('❌ Socket connection failed:', err);
    });

    const handleRealtimeUpdate = (event) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    };

    const createdHandler = () => handleRealtimeUpdate('notification:created');
    const readHandler = () => handleRealtimeUpdate('notification:read');
    const markAllReadHandler = () => handleRealtimeUpdate('notification:mark-all-read');
    
    notificationSocket.on('notification:created', createdHandler)
    notificationSocket.on('notification:read', readHandler)
    notificationSocket.on('notification:mark-all-read', markAllReadHandler)

    return () => {
      notificationSocket.off('notification:created', createdHandler)
      notificationSocket.off('notification:read', readHandler)
      notificationSocket.off('notification:mark-all-read', markAllReadHandler)
    }
  }, [queryClient])

  const handleTabChange = useCallback((tab) => {
    setSelectedTab(tab)
    // sync tab to URL so deep-linking and back/forward behave as expected
    try {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.set('tab', tab)
        return next
      }, { replace: true })
    } catch {}
  }, [setSearchParams])

  const handleMarkAsRead = useCallback((notificationId) => {
    markAsReadMutation.mutate([notificationId])
  }, [markAsReadMutation])

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  // 🔥 UPDATED: Use utility function
  const formatDateLabel = useCallback((dateString) => {
    return getDateLabel(dateString);
  }, [])

  // 🔥 DETAILED FORMAT untuk main page - dengan timestamp pukul
  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "";
    return formatTimeAgoDetailed(timestamp);
  }, []);

  const formatCount = useCallback((count) => {
    return count > 999 ? '999+' : count.toString()
  }, [])

  return {
    groupedNotifications,
    totalCount,
    unreadCount: generalCount,
    counselingCount,
    selectedTab,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    handleTabChange,
    handleMarkAsRead,
    handleMarkAllAsRead,
    fetchNextPage,
    getDateLabel: formatDateLabel,
    formatTimeAgo,
    formatCount,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    refetchNotifications: refetch,
  }
}
