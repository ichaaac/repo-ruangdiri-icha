// src/components/shared/notifications/hooks/useNotificationDropdown.js

import { useEffect, useCallback } from "react"; // 🔥 ADDED: useCallback
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // 🔥 ADDED: useMutation
import notificationSocket from "../lib/socket";
import { notificationsAPI } from "../lib/api";
import { formatTimeAgoDropdown, isNotificationFromToday } from "../lib/timezoneUtils";

export const useNotificationDropdown = (selectedTab = 'all') => {
  const queryClient = useQueryClient();

  // --- (Query yang sudah ada, tidak perlu diubah) ---
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-dropdown', selectedTab],
    queryFn: async () => {
      const filters = {
        page: 1,
        limit: 10, // 🔥 UPDATED: Ambil lebih banyak notifikasi untuk dropdown
        type: selectedTab,
      };
      return await notificationsAPI.getNotifications(filters);
    },
    staleTime: 0,
    cacheTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const notifications = notificationsData?.notifications || [];
  const generalCount = unreadData?.generalCount || 0;
  const counselingCount = unreadData?.counselingCount || 0;

  // 🔥 ADDED: Mutation untuk menandai notifikasi sebagai dibaca
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => notificationsAPI.markAsRead([notificationId]), // API call Anda mungkin menerima array
    onMutate: async (notificationId) => {
      // 1. Batalkan query yang sedang berjalan agar tidak menimpa state kita
      await queryClient.cancelQueries({ queryKey: ['notifications-dropdown', selectedTab] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });

      // 2. Simpan data sebelumnya untuk rollback jika terjadi error
      const previousNotificationsData = queryClient.getQueryData(['notifications-dropdown', selectedTab]);
      const previousUnreadData = queryClient.getQueryData(['notifications-unread-count']);

      // 3. Lakukan optimistic update pada UI secara langsung
      // Update daftar notifikasi dropdown
      queryClient.setQueryData(['notifications-dropdown', selectedTab], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif =>
            notif.id === notificationId
              ? { ...notif, status: 'read', readAt: new Date().toISOString() }
              : notif
          ),
        };
      });

      // Update jumlah notifikasi belum dibaca
      queryClient.setQueryData(['notifications-unread-count'], (oldData) => {
          if (!oldData) return oldData;
          const notificationToUpdate = previousNotificationsData?.notifications.find(n => n.id === notificationId);
          const isCounseling = notificationToUpdate?.subType === 'counseling';
          return {
              ...oldData,
              generalCount: isCounseling ? oldData.generalCount : Math.max(0, oldData.generalCount - 1),
              counselingCount: isCounseling ? Math.max(0, oldData.counselingCount - 1) : oldData.counselingCount,
          };
      });


      // 4. Kembalikan data sebelumnya dalam context
      return { previousNotificationsData, previousUnreadData };
    },
    onError: (err, notificationId, context) => {
      // Jika mutasi gagal, kembalikan data ke kondisi semula
      queryClient.setQueryData(['notifications-dropdown', selectedTab], context.previousNotificationsData);
      queryClient.setQueryData(['notifications-unread-count'], context.previousUnreadData);
    },
    onSettled: () => {
      // 5. Setelah selesai (baik sukses atau gagal), segarkan data dari server
      // untuk memastikan konsistensi data
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      // Juga segarkan query untuk halaman notifikasi utama
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 🔥 ADDED: Fungsi yang akan dipanggil dari komponen
  const handleMarkAsRead = useCallback((notificationId) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);


  // --- (Socket useEffect, tidak perlu diubah) ---
  useEffect(() => {
    // ... kode socket Anda yang sudah ada
  }, [queryClient]);


  // --- (Fungsi format, tidak perlu diubah) ---
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    return formatTimeAgoDropdown(timestamp);
  }

  const formatUnreadCount = (count) => {
    return count > 99 ? '99+' : count.toString();
  }

  // 🔥 UPDATED: Kembalikan fungsi dan state yang baru
  return {
    notifications,
    unreadCount: generalCount,
    counselingCount,
    isLoading,
    formatTimeAgo,
    formatUnreadCount,
    isNotificationFromToday,
    handleMarkAsRead, // <-- Fungsi baru untuk diekspor
    isMarkingAsRead: markAsReadMutation.isPending, // <-- State loading baru untuk diekspor
  }
}