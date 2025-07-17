// src/components/shared/notifications/lib/api.js - FINAL CLEAN VERSION

import { apiClient } from '@/lib/api'

const notificationsAPI = {
  /**
   * Get notifications - Handle backend enum validation
   * Backend only accepts: 'schedule' | 'system' | 'report'
   * For 'all', fetch both system and schedule notifications
   */
  async getNotifications(params = {}) {
    // Special handling for 'all' type
    if (params.type === 'all') {
      try {
        // Fetch system notifications
        const systemResponse = await this._getNotificationsByType({
          ...params,
          type: 'system'
        })
        
        // Fetch schedule notifications  
        const scheduleResponse = await this._getNotificationsByType({
          ...params,
          type: 'schedule'
        })
        
        // Combine results
        const allNotifications = [
          ...(systemResponse.notifications || []),
          ...(scheduleResponse.notifications || [])
        ]
        
        // Sort by createdAt (newest first)
        allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        // Apply pagination limit
        const limit = parseInt(params.limit || 10, 10)
        const page = parseInt(params.page || 1, 10)
        const startIndex = (page - 1) * limit
        const paginatedNotifications = allNotifications.slice(startIndex, startIndex + limit)
        
        return {
          notifications: paginatedNotifications,
          total: allNotifications.length
        }
        
      } catch (error) {
        console.error('❌ Failed to fetch ALL notifications:', error)
        throw error
      }
    }
    
    // For specific types, use the helper method
    return this._getNotificationsByType(params)
  },

  /**
   * Helper method to fetch notifications by specific type
   * NEVER sends 'all' - only valid enum values
   */
  async _getNotificationsByType(params = {}) {
    const requestData = {
      page: parseInt(params.page || 1, 10),
      limit: parseInt(params.limit || 10, 10)
    }
    
    // Map frontend types to valid backend enum values ONLY
    if (params.type === 'counseling' || params.type === 'schedule') {
      requestData.type = 'schedule'
    } else if (params.type === 'system') {
      requestData.type = 'system'
    } else if (params.type === 'report') {
      requestData.type = 'report'
    } else {
      // CRITICAL: Never send 'all' - default to system
      requestData.type = 'system'
    }
    
    // Add optional parameters only if they exist
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
    
    try {
      const response = await apiClient.get(url)
      
      // Handle nested response structure
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      
      // Fallback for different response structures
      return response.data || { notifications: [], total: 0 }
    } catch (error) {
      console.error('❌ API Request Failed:', error)
      throw error
    }
  },

  async getUnreadCount() {
    try {
      const response = await apiClient.get('/notifications/unread-count')
      
      // Handle nested response for unread count
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      
      // Fallback
      return response.data || { count: 0 }
    } catch (error) {
      console.error('❌ Unread Count Request Failed:', error)
      throw error
    }
  },

  async markAsRead(notificationIds) {
    try {
      const requestData = {
        notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
      }
      
      const response = await apiClient.post('/notifications/mark-as-read', requestData)
      
      // Handle nested response
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error) {
      console.error('❌ Mark as Read Request Failed:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      const response = await apiClient.get(`/notifications/${id}`)
      
      // Handle nested response
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error) {
      console.error('❌ Get By ID Request Failed:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      const response = await apiClient.delete(`/notifications/${id}`)
      
      // Handle nested response
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error) {
      console.error('❌ Delete Request Failed:', error)
      throw error
    }
  },

  async markallAsRead() {
    try {
      const response = await apiClient.post('/notifications/mark-all-as-read')
      
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data
      }
      
      return response.data
    } catch (error) {
      console.error('❌ Mark All as Read Request Failed:', error)
      throw error
    }
  }

}

export default notificationsAPI