// src/components/shared/notifications/lib/api.js

import { apiClient } from '@/lib/api'

const notificationsAPI = {
  /**
   * Get notifications - SIMPLE WORKAROUND for Zod number validation
   * Backend needs to fix: use z.coerce.number() instead of z.number()
   */
  async getNotifications(params = {}) {
    const requestData = {
      page: parseInt(params.page || 1, 10),
      limit: parseInt(params.limit || 10, 10), 
      type: params.type === 'counseling' ? 'schedule' : 'system'
    }
    
    if (params.status) requestData.status = params.status
    if (params.isRead !== undefined) requestData.isRead = Boolean(params.isRead)
    if (params.from) requestData.from = params.from
    if (params.to) requestData.to = params.to

    // SIMPLE WORKAROUND: Build URL manually to bypass axios param serialization
    const searchParams = new URLSearchParams()
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const url = `/notifications?${searchParams.toString()}`
    console.log('🔧 Manual URL:', url)
    
    const response = await apiClient.get(url)
    return response.data
  },

  async getUnreadCount() {
    const response = await apiClient.get('/notifications/unread-count')
    return response.data
  },

  async markAsRead(notificationIds) {
    const response = await apiClient.post('/notifications/mark-as-read', {
      notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
    })
    return response.data
  },

  async getById(id) {
    const response = await apiClient.get(`/notifications/${id}`)
    return response.data
  },

  async delete(id) {
    const response = await apiClient.delete(`/notifications/${id}`)
    return response.data
  }
}

export default notificationsAPI