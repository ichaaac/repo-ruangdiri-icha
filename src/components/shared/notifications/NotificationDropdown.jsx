// src/components/shared/notifications/NotificationDropdown.jsx

import React, { useState } from "react"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/id'
import { useNotificationDropdown } from "./hooks/useNotificationDropdown"

// Configure dayjs
dayjs.extend(relativeTime)
dayjs.locale('id')

const NotificationDropdown = ({ onViewAll, onClose, onMarkAsRead, onMarkAllAsRead }) => {
  const [selectedTab, setSelectedTab] = useState('all')
  
  // 🔥 GUNAKAN HOOK YANG SUDAH DIPERBAIKI
  const { 
    notifications, 
    unreadCount, 
    counselingCount, 
    isLoading, 
    formatTimeAgo, 
    formatUnreadCount 
  } = useNotificationDropdown(selectedTab)

  // 🔥 ICON LOGIC BASED ON TITLE INCLUDES
  const getNotificationIcon = (notification) => {
    const title = notification.title?.toLowerCase() || ''
    const message = notification.message?.toLowerCase() || ''
    const text = `${title} ${message}`
    
    // Schedule/Counseling related
    if (text.includes('jadwal') || text.includes('schedule') || text.includes('konseling') || text.includes('appointment')) {
      if (text.includes('membuat') || text.includes('baru') || text.includes('created')) {
        return 'event'
      }
      if (text.includes('mengubah') || text.includes('ubah') || text.includes('updated')) {
        return 'event_available'
      }
      if (text.includes('menghapus') || text.includes('hapus') || text.includes('deleted')) {
        return 'event_busy'
      }
      if (text.includes('reminder') || text.includes('pengingat')) {
        return 'schedule'
      }
      return 'check_circle' // Default schedule icon
    }
    
    // System notifications
    if (text.includes('system') || text.includes('sistem')) {
      return 'settings'
    }
    
    // Mental health
    if (text.includes('mental') || text.includes('psikolog')) {
      return 'psychology'
    }
    
    // Announcements
    if (text.includes('pengumuman') || text.includes('announcement')) {
      return 'campaign'
    }
    
    // Default fallback
    return 'notifications'
  }

  // 🔥 ICON COLOR BASED ON TITLE
  const getNotificationIconColor = (notification) => {
    const title = notification.title?.toLowerCase() || ''
    const message = notification.message?.toLowerCase() || ''
    const text = `${title} ${message}`
    
    // Schedule/Counseling - Green
    if (text.includes('jadwal') || text.includes('schedule') || text.includes('konseling') || text.includes('appointment')) {
      return '#9BCA61'
    }
    
    // System - Gray
    if (text.includes('system') || text.includes('sistem')) {
      return '#535353'
    }
    
    // Mental health - Purple
    if (text.includes('mental') || text.includes('psikolog')) {
      return '#9986ff'
    }
    
    // Announcements - Blue
    if (text.includes('pengumuman') || text.includes('announcement')) {
      return '#488BBE'
    }
    
    // Default
    return '#535353'
  }

  // 🔥 HANDLE TAB CHANGE
  const handleTabChange = (tab) => {
    setSelectedTab(tab)
  }

  // 🔥 GET CURRENT COUNT BASED ON TAB
  const getCurrentCount = () => {
    if (selectedTab === 'counseling') {
      return counselingCount
    }
    return unreadCount
  }

  console.log('🎯 Dropdown state:', {
    selectedTab,
    notifications: notifications.length,
    unreadCount,
    counselingCount,
    isLoading
  })

  return (
    <div className="absolute right-0 mt-2 w-[395px] max-h-[350px] overflow-y-auto bg-white shadow-lg rounded-b-xl z-50 p-5 flex flex-col gap-4">
      
      {/* Title */}
      <div className="text-[#488abe] font-semibold text-base">Notifikasi</div>

      {/* Filter Tabs with counts */}
      <div className="flex items-center gap-5 text-sm text-[#535353]">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-1 cursor-pointer transition-colors ${
            selectedTab === 'all' 
              ? "font-bold text-[#535353]" 
              : "font-normal text-[#8a8a8a] hover:text-[#535353]"
          }`}
        >
          <span>Semua</span>
          {/* 🔥 FIXED: TAMPILKAN COUNT UNTUK TAB SEMUA */}
          {unreadCount > 0 && (
            <span className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {formatUnreadCount(unreadCount)}
            </span>
          )}
        </button>
        
        <button
          onClick={() => handleTabChange('counseling')}
          className={`flex items-center gap-1 cursor-pointer transition-colors ${
            selectedTab === 'counseling' 
              ? "font-bold text-[#535353]" 
              : "font-normal text-[#8a8a8a] hover:text-[#535353]"
          }`}
        >
          <span>Konseling</span>
          {/* 🔥 FIXED: TAMPILKAN COUNT UNTUK TAB KONSELING */}
          {counselingCount > 0 && (
            <span className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {formatUnreadCount(counselingCount)}
            </span>
          )}
        </button>
      </div>

      {/* Date Separator */}
      <div className="text-xs text-[#8a8a8a]">Terbaru</div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <span className="material-icons animate-spin text-[#488BBE] text-lg">sync</span>
            <span className="text-[#488BBE] text-sm">Memuat...</span>
          </div>
        </div>
      )}

      {/* Notification List */}
      {!isLoading && (
        <div className="flex flex-col gap-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const isRead = notification.isRead || !!notification.readAt
              
              if (!notification || !notification.id || !notification.title) {
                return null
              }
              
              return (
                <div 
                  key={notification.id} 
                  className="flex gap-3 items-start cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => onMarkAsRead && onMarkAsRead(notification.id)}
                >
                  <span 
                    className="material-icons text-[32px] flex-shrink-0"
                    style={{ color: getNotificationIconColor(notification) }}
                  >
                    {getNotificationIcon(notification)}
                  </span>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className={`text-sm font-semibold line-clamp-2 ${
                      isRead ? "text-gray-500" : "text-[#535353]"
                    }`}>
                      {notification.title}
                    </p>
                    <p className="text-[10px] text-[#8a8a8a] flex items-center gap-1">
                      {notification.message && (
                        <>
                          <span className={`font-medium ${
                            isRead ? "text-gray-400" : "text-[#535353]"
                          }`}>
                            {notification.message.length > 20 
                              ? `${notification.message.substring(0, 20)}...` 
                              : notification.message
                            }
                          </span>
                          <span className="mx-1">|</span>
                        </>
                      )}
                      <span>{formatTimeAgo(notification.createdAt)}</span>
                    </p>
                  </div>
                  
                  {/* Unread indicator */}
                  {!isRead && (
                    <div className="w-2 h-2 bg-[#488BBE] rounded-full mt-1 flex-shrink-0"></div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              {selectedTab === 'counseling' 
                ? "Tidak ada notifikasi konseling" 
                : "Tidak ada notifikasi baru"
              }
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="border-t pt-2 flex justify-center items-center">
        <button
          onClick={onViewAll}
          className="text-xs text-[#488abe] hover transition-colors"
        >
          Lihat semua
        </button>
      </div>
    </div>
  )
}

export default NotificationDropdown