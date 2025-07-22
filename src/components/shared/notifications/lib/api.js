// src/components/shared/notifications/lib/api.js

import { apiClient } from '@/lib/api';

export const notificationsAPI = {
  /**
   * Get notifications. Handles 'all', 'counseling', and other types.
   * ALWAYS returns a consistent object: { notifications: [], total: 0 }
   */
  async getNotifications(params = {}) {
    // 🔥 FIXED: Handling for 'all' tab - pastikan mengambil SEMUA notifikasi
    if (params.type === 'all') {
      try {
        const [systemResponse, scheduleResponse, reportResponse] = await Promise.all([
          this._getNotificationsByType({ ...params, type: 'system' }),
          this._getNotificationsByType({ ...params, type: 'schedule' }),
          this._getNotificationsByType({ ...params, type: 'report' })
        ]);

        const allNotifications = [
          ...(systemResponse.notifications || []),
          ...(scheduleResponse.notifications || []),
          ...(reportResponse.notifications || [])
        ];
        
        // Sort by createdAt descending (newest first)
        allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const limit = parseInt(params.limit || 10, 10);
        const page = parseInt(params.page || 1, 10);
        const startIndex = (page - 1) * limit;
        const paginatedNotifications = allNotifications.slice(startIndex, startIndex + limit);
        
        return {
          notifications: paginatedNotifications,
          total: allNotifications.length
        };
      } catch (error) {
        console.error('❌ Failed to fetch ALL notifications:', error);
        return { notifications: [], total: 0 }; // Return consistent empty state on error
      }
    }
    
    // 🔥 FIXED: Handling for 'counseling' tab - ambil semua type schedule
    if (params.type === 'counseling') {
      return this._getNotificationsByType({
        ...params,
        type: 'schedule'
        // Tidak perlu subType: 'counseling' karena semua schedule masuk konseling
      });
    }
    
    // For other specific types
    return this._getNotificationsByType(params);
  },

  /**
   * Helper method. ALWAYS returns a clean object: { notifications: [], total: 0 }
   */
  async _getNotificationsByType(params = {}) {
    const requestData = {
      page: parseInt(params.page || 1, 10),
      limit: parseInt(params.limit || 10, 10),
    };

    if (params.type === 'schedule') {
      requestData.type = 'schedule';
    } else if (params.type === 'system') {
      requestData.type = 'system';
    } else if (params.type === 'report') {
      requestData.type = 'report';
    }

    // 🔥 REMOVED: subType filter untuk counseling karena semua schedule masuk konseling
    // if (params.subType) {
    //   requestData.subType = params.subType;
    // }
    
    const searchParams = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = `/notifications?${searchParams.toString()}`;
    
    try {
      const response = await apiClient.get(url);
      const data = response?.data?.data || response?.data || {};
      return {
        notifications: data.notifications || [],
        total: data.total || 0,
      };
    } catch (error) {
      console.error('❌ API Request Failed for', url, ':', error);
      return { notifications: [], total: 0 };
    }
  },

  /**
   * Get unread count. ALWAYS returns a clean object: { count: 0 }
   */
  async getUnreadCount() {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      const count = response?.data?.data?.count || 0;
      
      // 🔥 DEBUG: Log untuk tracking unread count
      console.log('🔢 API getUnreadCount response:', {
        count,
        rawResponse: response?.data
      });
      
      return { count };
    } catch (error) {
      console.error('❌ Unread Count Request Failed:', error);
      // Selalu kembalikan objek yang valid bahkan saat error
      return { count: 0 };
    }
  },

  /**
   * Mark notifications as read. Returns the backend response data directly.
   */
  async markAsRead(notificationIds) {
    try {
      const requestData = {
        notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
      };
      const response = await apiClient.post('/notifications/mark-as-read', requestData);
      
      console.log('✅ markAsRead success:', response?.data);
      return response?.data?.data || response?.data;
    } catch (error) {
      console.error('❌ Mark as Read Request Failed:', error);
      throw error;
    }
  },

  /**
   * Marks all notifications as read. Returns the backend response data directly.
   */
  async markallAsRead() {
    try {
      const response = await apiClient.post('/notifications/mark-all-as-read');
      
      console.log('✅ markAllAsRead success:', response?.data);
      return response?.data?.data || response?.data;
    } catch (error) {
      console.error('❌ Mark All as Read Request Failed:', error);
      throw error;
    }
  },
};