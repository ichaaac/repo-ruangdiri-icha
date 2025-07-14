// src/components/shared/notifications/lib/api.js

import { apiClient } from '@/lib/api'

/**
 * Notifications API - menggunakan base apiClient untuk auth & config
 */
const notificationsAPI = {
  /**
   * Get notifications dengan filtering & pagination
   * US-AC-Notif-2-2: Max 10 items per page
   */
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams()
    
    // Pagination
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    
    // Filter berdasarkan type
    if (params.type === 'counseling') {
      queryParams.append('type', 'schedule_created')
    }
    // Untuk 'all' tidak ada filter type
    
    // Filter lainnya
    if (params.status) queryParams.append('status', params.status)
    if (params.isRead !== undefined) queryParams.append('isRead', params.isRead)
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)

    const response = await apiClient.get(`/notifications?${queryParams}`)
    return response.data
  },

  /**
   * Get unread count untuk badge - US-AC-Notif-1-1
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count')
    return response.data
  },

  /**
   * Mark notifications as read - US-AC-Notif-3-1
   */
  markAsRead: async (notificationIds) => {
    const response = await apiClient.post('/notifications/mark-as-read', {
      notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
    })
    return response.data
  },

  /**
   * Get notification by ID
   */
  getById: async (id) => {
    const response = await apiClient.get(`/notifications/${id}`)
    return response.data
  },

  /**
   * Delete notification (soft delete)
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/notifications/${id}`)
    return response.data
  }
}

export default notificationsAPI