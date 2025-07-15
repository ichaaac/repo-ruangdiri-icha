// src/components/shared/notifications/lib/api.js - FIXED VERSION

import { apiClient } from '@/lib/api'

const notificationsAPI = {
  /**
   * Get notifications - FIXED: Handle nested response structure
   * Backend response: {status, data: {notifications, total}, message}
   * Frontend expects: {notifications, total}
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

    // Build URL manually to bypass axios param serialization
    const searchParams = new URLSearchParams()
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const url = `/notifications?${searchParams.toString()}`
    console.log('🔧 Manual URL:', url)
    
    const response = await apiClient.get(url)
    
    // 🔥 FIX: Extract the nested data structure
    // Backend returns: {status: "success", data: {notifications: [...], total: 3}, message: "..."}
    // We need to return: {notifications: [...], total: 3}
    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data // Return the nested data object
    }
    
    // Fallback for different response structures
    return response.data || { notifications: [], total: 0 }
  },

  async getUnreadCount() {
    const response = await apiClient.get('/notifications/unread-count')
    
    // 🔥 FIX: Handle nested response for unread count
    // Backend returns: {status: "success", data: {count: 3}, message: "..."}
    // We need to return: {count: 3}
    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data
    }
    
    // Fallback
    return response.data || { count: 0 }
  },

  async markAsRead(notificationIds) {
    const response = await apiClient.post('/notifications/mark-as-read', {
      notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
    })
    
    // 🔥 FIX: Handle nested response
    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data
    }
    
    return response.data
  },

  async getById(id) {
    const response = await apiClient.get(`/notifications/${id}`)
    
    // 🔥 FIX: Handle nested response
    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data
    }
    
    return response.data
  },

  async delete(id) {
    const response = await apiClient.delete(`/notifications/${id}`)
    
    // 🔥 FIX: Handle nested response
    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data
    }
    
    return response.data
  }
}

export default notificationsAPI