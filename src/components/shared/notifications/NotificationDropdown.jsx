// src/components/shared/notifications/NotificationDropdown.jsx

import React, { useState, useEffect } from "react"
import { useNotificationDropdown } from "./hooks/useNotificationDropdown"

const NotificationDropdown = ({ onViewAll, onClose, onMarkAsRead, onMarkAllAsRead }) => {
  const [selectedTab, setSelectedTab] = useState('all')
  
  // 🔥 GUNAKAN HOOK YANG SUDAH DIPERBAIKI DENGAN REALTIME SOCKET
  const { 
    notifications, 
    unreadCount, 
    counselingCount, 
    isLoading, 
    formatTimeAgo, 
    formatUnreadCount 
  } = useNotificationDropdown(selectedTab)

  // 🔥 DEBUG LOG UNTUK MEMASTIKAN DATA TER-UPDATE
  useEffect(() => {
    console.log('🎯 Dropdown render with data:', {
      selectedTab,
      notifications: notifications.length,
      unreadCount,
      counselingCount,
      notificationIds: notifications.map(n => n.id),
      firstNotification: notifications[0]
    })
  }, [notifications, unreadCount, counselingCount, selectedTab])

  // 🔥 ENHANCED ICON LOGIC BASED ON TYPE & SUBTYPE
  const getNotificationIcon = (notification) => {
    const { type, subType } = notification
    
    // Schedule notifications
    if (type === 'schedule') {
      // Check for specific schedule subtypes if available
      if (notification.title?.toLowerCase().includes('buat') || notification.title?.toLowerCase().includes('created')) {
        return 'event'
      }
      if (notification.title?.toLowerCase().includes('ubah') || notification.title?.toLowerCase().includes('updated')) {
        return 'event_available'
      }
      if (notification.title?.toLowerCase().includes('hapus') || notification.title?.toLowerCase().includes('deleted')) {
        return 'event_busy'
      }
      if (notification.title?.toLowerCase().includes('reminder') || notification.title?.toLowerCase().includes('pengingat')) {
        return 'schedule'
      }
      // Default schedule icon - check_circle as requested
      return 'check_circle'
    }
    
    // System notifications
    if (type === 'system') {
      return 'settings'
    }
    
    // Report notifications
    if (type === 'report') {
      return 'assessment'
    }
    
    // Counseling subtype
    if (subType === 'counseling') {
      return 'psychology'
    }
    
    // Default fallback
    return 'notifications'
  }

  // 🔥 ENHANCED ICON COLOR BASED ON TYPE
  const getNotificationIconColor = (notification) => {
    const { type, subType } = notification
    
    // Schedule - Green (as requested for jadwal)
    if (type === 'schedule') {
      return '#9BCA61'
    }
    
    // System - Gray
    if (type === 'system') {
      return '#535353'
    }
    
    // Report - Blue
    if (type === 'report') {
      return '#488BBE'
    }
    
    // Counseling subtype - Purple
    if (subType === 'counseling') {
      return '#9986ff'
    }
    
    // Default
    return '#535353'
  }

  // 🔥 HANDLE TAB CHANGE
  const handleTabChange = (tab) => {
    console.log('🔄 Dropdown: Changing tab to:', tab)
    setSelectedTab(tab)
  }

  // 🔥 HANDLE MARK AS READ WITH LOGGING
  const handleMarkAsRead = (notificationId) => {
    console.log('✏️ Dropdown: Marking as read:', notificationId)
    if (onMarkAsRead) {
      onMarkAsRead([notificationId]) // Pass as array
    }
  }

  console.log('🎯 Dropdown final render state:', {
    selectedTab,
    notifications: notifications.length,
    unreadCount,
    counselingCount,
    isLoading,
    hasOnMarkAsRead: !!onMarkAsRead
  })

  return (
    <div className="absolute right-0 mt-2 w-[395px] max-h-[400px] overflow-hidden bg-white shadow-lg rounded-b-xl z-50 border border-gray-200">
      
      {/* 🔥 HEADER SECTION */}
      <div className="p-5 pb-0">
        {/* Title */}
        <div className="text-[#488abe] font-semibold text-base mb-4">Notifikasi</div>

        {/* Filter Tabs with counts */}
        <div className="flex items-center gap-5 text-sm text-[#535353] mb-4">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              selectedTab === 'all' 
                ? "font-bold text-[#535353]" 
                : "font-normal text-[#8a8a8a] hover:text-[#535353]"
            }`}
          >
            <span>Semua</span>
            {/* 🔥 TAMPILKAN COUNT UNTUK TAB SEMUA */}
            {unreadCount > 0 && (
              <span className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[18px] text-center">
                {formatUnreadCount(unreadCount)}
              </span>
            )}
          </button>
          
          <button
            onClick={() => handleTabChange('counseling')}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              selectedTab === 'counseling' 
                ? "font-bold text-[#535353]" 
                : "font-normal text-[#8a8a8a] hover:text-[#535353]"
            }`}
          >
            <span>Konseling</span>
            {/* 🔥 TAMPILKAN COUNT UNTUK TAB KONSELING */}
            {counselingCount > 0 && (
              <span className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[18px] text-center">
                {formatUnreadCount(counselingCount)}
              </span>
            )}
          </button>
        </div>

        {/* Date Separator */}
        <div className="text-xs text-[#8a8a8a] pb-4 border-b border-gray-100">Terbaru</div>
      </div>

      {/* 🔥 CONTENT SECTION WITH SCROLL */}
      <div className="max-h-[250px] overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2">
              <span className="material-icons animate-spin text-[#488BBE] text-lg">sync</span>
              <span className="text-[#488BBE] text-sm">Memuat...</span>
            </div>
          </div>
        )}

        {/* Notification List */}
        {!isLoading && (
          <div className="p-5 pt-4">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const isRead = notification.isRead || !!notification.readAt
                  
                  if (!notification || !notification.id || !notification.title) {
                    return null
                  }
                  
                  return (
                    <div 
                      key={notification.id} 
                      className={`flex gap-3 items-start p-3 rounded-lg transition-all cursor-pointer ${
                        isRead 
                          ? "bg-gray-50 opacity-70" 
                          : "bg-white hover:bg-blue-50 border border-gray-100"
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <span 
                        className="material-icons text-[28px] flex-shrink-0 mt-1"
                        style={{ color: getNotificationIconColor(notification) }}
                      >
                        {getNotificationIcon(notification)}
                      </span>
                      
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <p className={`text-sm font-semibold line-clamp-2 leading-tight ${
                          isRead ? "text-gray-500" : "text-[#535353]"
                        }`}>
                          {notification.title}
                        </p>
                        
                        <div className="flex items-center text-[10px] text-[#8a8a8a]">
                          {notification.message && (
                            <>
                              <span className={`font-medium ${
                                isRead ? "text-gray-400" : "text-[#535353]"
                              }`}>
                                {notification.message.length > 30 
                                  ? `${notification.message.substring(0, 30)}...` 
                                  : notification.message
                                }
                              </span>
                              <span className="mx-1.5">•</span>
                            </>
                          )}
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="flex-shrink-0 mt-1">
                        {!isRead ? (
                          <div className="w-2 h-2 bg-[#488BBE] rounded-full animate-pulse"></div>
                        ) : (
                          <span className="material-icons text-gray-400 text-sm">done</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <span className="material-icons text-4xl text-gray-300 mb-2 block">notifications_none</span>
                {selectedTab === 'counseling' 
                  ? "Tidak ada notifikasi konseling" 
                  : "Tidak ada notifikasi baru"
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🔥 FOOTER SECTION */}
      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <button
          onClick={onViewAll}
          className="w-full text-sm text-[#488abe] hover:text-[#3399E9] transition-colors font-medium"
        >
          Lihat Semua Notifikasi
        </button>
      </div>
    </div>
  )
}

export default NotificationDropdown