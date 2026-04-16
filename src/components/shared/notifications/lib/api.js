// src/components/shared/notifications/lib/api.js

import { apiClient } from '@/lib/api';

export const notificationsAPI = {
  /**
   * Get notifications. Handles 'all', 'counseling', and other types.
   * ALWAYS returns a consistent object: { notifications: [], total: 0 }
   */
  async getNotifications(params = {}) {
    const requestData = {
      page: parseInt(params.page || 1, 10),
      limit: parseInt(params.limit || 10, 10),
    };

    // 🔥 UPDATED: Handle new API structure
    if (params.type === 'counseling') {
      // For counseling tab, use type=schedule
      requestData.type = 'schedule';
    } else if (params.type === 'all') {
      // For all tab, don't send type parameter (backend will return all)
      // requestData.type is not set
    } else if (params.type) {
      // For other specific types
      requestData.type = params.type;
    }
    
    const searchParams = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = `/notifications?${searchParams.toString()}`;
    
    try {
      console.log('🔍 API Request:', url, requestData);
      const response = await apiClient.get(url);
      const data = response?.data?.data || response?.data || {};
      
      console.log('📊 API Response:', {
        url,
        notificationsCount: data.notifications?.length || 0,
        total: data.total || 0
      });
      
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
   * Get unread count with new backend structure
   * Returns: { generalCount: number, counselingCount: number }
   */
  async getUnreadCount() {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      const data = response?.data?.data || {};
      
      console.log('🔢 API getUnreadCount response:', {
        generalCount: data.generalCount || 0,
        counselingCount: data.counselingCount || 0,
        rawResponse: response?.data
      });
      
      return {
        generalCount: data.generalCount || 0,
        counselingCount: data.counselingCount || 0
      };
    } catch (error) {
      console.error('❌ Unread Count Request Failed:', error);
      return { 
        generalCount: 0, 
        counselingCount: 0 
      };
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

  async savePushSubscription(subscription) {
    try {
      await apiClient.post('/notifications/push-subscription', subscription);
    } catch (error) {
      console.error('Push subscription save failed:', error);
    }
  },

  async deletePushSubscription() {
    try {
      await apiClient.delete('/notifications/push-subscription');
    } catch {
      // silent — logout should not be blocked
    }
  },
};