// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import "dayjs/locale/id"
import notificationSocket from "../lib/socket"
import { notificationsAPI } from "../lib/api"
import { getRelativeTime } from "../../schedule/utils/timezoneHandler"

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

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
  })

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-dropdown', selectedTab],
    queryFn: async () => {
      const filters = {
        page: 1,
        limit: 5, // Fetch a maximum of 5 notifications
        type: selectedTab,
      };
      return notificationsAPI.getNotifications(filters);
    },
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const notifications = notificationsData?.notifications || []
  const unreadCount = unreadData?.count || 0

  const counselingCount = notifications.filter(
    (notif) => notif.type === 'schedule' && notif.subType === 'counseling' && !notif.isRead && !notif.readAt
  ).length

  useEffect(() => {
    notificationSocket.connect()

    const handleRealtimeUpdate = (event) => {
        console.log(`🔔 Dropdown: Received '${event}' event. Invalidating queries.`);
        // Invalidate specific queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['notifications-dropdown', 'all'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-dropdown', 'counseling'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        // Also invalidate the main page query so it's fresh when the user navigates there
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const createdHandler = () => handleRealtimeUpdate('notification:created');
    const readHandler = () => handleRealtimeUpdate('notification:read');
    
    notificationSocket.on('notification:created', createdHandler);
    notificationSocket.on('notification:read', readHandler);

    return () => {
      notificationSocket.off('notification:created', createdHandler);
      notificationSocket.off('notification:read', readHandler);
    }
  }, [queryClient])

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    try {
      const notificationTime = dayjs(timestamp);
      const now = dayjs();
      
      const diffSeconds = now.diff(notificationTime, 'second');
      if (diffSeconds < 10) return "Baru saja"; // Lebih spesifik untuk "baru saja"
      if (diffSeconds < 60) return `${diffSeconds} detik lalu`;

      const diffMinutes = now.diff(notificationTime, 'minute');
      if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

      const diffHours = now.diff(notificationTime, 'hour');
      if (diffHours < 24) return `${diffHours} jam lalu`;

      // Jika lebih dari sehari, tampilkan tanggal
      return notificationTime.format('DD MMM YYYY');
    } catch {
      return dayjs(timestamp).fromNow();
    }
  }

  const formatUnreadCount = (count) => {
    return count > 99 ? '99+' : count.toString();
  }

  return {
    notifications,
    unreadCount,
    counselingCount,
    isLoading,
    formatTimeAgo,
    formatUnreadCount,
  }
}