// src/components/shared/notifications/NotificationDropdown.jsx - Fixed with max 999 display & functional tabs

import React, { useState } from "react"
import { useNotificationDropdown } from "./hooks/useNotificationDropdown"

const NotificationDropdown = ({ onViewAll, onClose }) => {
  // 🔥 NEW: Local state for dropdown tabs
  const [selectedTab, setSelectedTab] = useState('all')
  
  const { 
    notifications, 
    unreadCount,
    counselingCount,
    isLoading,
    refetch 
  } = useNotificationDropdown(selectedTab) // Pass selectedTab to hook

  // US-AC-Notif-1-2: Max 3 items in dropdown
  const displayNotifications = notifications.slice(0, 3)
  
  const getNotificationIcon = (type) => {
    const iconMap = {
      schedule_created: "event",
      schedule_updated: "event_available", 
      schedule_deleted: "event_busy",
      schedule_reminder: "schedule",
      system_announcement: "campaign",
      mental_health_alert: "psychology",
      system: "notifications", 
      general: "info"
    }
    return iconMap[type] || "notifications"
  }

  const formatTimeAgo = (timestamp) => {
    try {
      const now = new Date()
      const notifTime = new Date(timestamp)
      
      if (isNaN(notifTime.getTime())) {
        console.error('Invalid timestamp:', timestamp)
        return 'Baru saja'
      }
      
      const diffInMinutes = Math.floor((now - notifTime) / (1000 * 60))
      
      if (diffInMinutes < 1) {
        return 'Baru saja'
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} menit yang lalu`
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        return `${hours} jam yang lalu`
      } else {
        const days = Math.floor(diffInMinutes / 1440)
        return `${days} hari yang lalu`
      }
    } catch (error) {
      console.error('Error formatting time:', error, timestamp)
      return 'Baru saja'
    }
  }

  // 🔥 NEW: Format unread count for dropdown (max 999)
  const formatUnreadCount = (count) => {
    if (count > 999) return "999+";
    return count.toString();
  }

  // 🔥 NEW: Handle tab switching
  const handleTabChange = (tab) => {
    setSelectedTab(tab)
  }

  // 🔥 NEW: Get current count based on selected tab
  const getCurrentCount = () => {
    if (selectedTab === 'counseling') {
      return counselingCount || 0
    }
    return unreadCount || 0
  }

  return (
    <div className="absolute right-0 mt-2 w-[395px] max-h-[350px] overflow-y-auto bg-white shadow-lg rounded-b-xl z-50 p-5 flex flex-col gap-4">
      
      {/* Title */}
      <div className="text-[#488abe] font-semibold text-base">Notifikasi</div>

      {/* Filter Tabs with counts - 🔥 NOW FUNCTIONAL */}
      <div className="flex items-center gap-5 text-sm text-[#535353]">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-1 cursor-pointer transition-colors ${
            selectedTab === 'all' 
              ? "font-bold underline text-[#535353]" 
              : "font-normal text-[#8a8a8a] hover:text-[#535353]"
          }`}
        >
          <span>Semua</span>
          {selectedTab === 'all' && unreadCount > 0 && (
            <span className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {formatUnreadCount(unreadCount)}
            </span>
          )}
        </button>
        
        <button
          onClick={() => handleTabChange('counseling')}
          className={`flex items-center gap-1 cursor-pointer transition-colors ${
            selectedTab === 'counseling' 
              ? "font-bold underline text-[#535353]" 
              : "font-normal text-[#8a8a8a] hover:text-[#535353]"
          }`}
        >
          <span>Konseling</span>
          {selectedTab === 'counseling' && counselingCount > 0 && (
            <span className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {formatUnreadCount(counselingCount)}
            </span>
          )}
        </button>
      </div>

      {/* Date Separator */}
      <div className="text-xs text-[#8a8a8a]">Hari ini</div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <span className="material-icons animate-spin text-[#488BBE] text-lg">sync</span>
            <span className="text-[#488BBE] text-sm">Memuat...</span>
          </div>
        </div>
      )}

      {/* Notification List - US-AC-Notif-1-2: Max 3 items */}
      {!isLoading && (
        <div className="flex flex-col gap-4">
          {displayNotifications.length > 0 ? (
            displayNotifications.map((notification) => {
              const isRead = notification.isRead || !!notification.readAt
              
              if (!notification || !notification.id || !notification.title) {
                console.warn('Invalid notification in dropdown:', notification)
                return null
              }
              
              return (
                <div key={notification.id} className="flex gap-3 items-start">
                  <span 
                    className="material-icons text-[32px]"
                    style={{ color: notification.iconColor || "#535353" }}
                  >
                    {getNotificationIcon(notification.type || notification.subType)}
                  </span>
                  <div className="flex flex-col gap-1 flex-1">
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

      {/* US-AC-Notif-1-3: Footer "Lihat semua" button */}
      <button
        onClick={onViewAll}
        className="text-xs text-[#488abe] text-center mt-2 cursor-pointer hover:underline transition-colors py-2 hover:bg-gray-50 rounded"
      >
        Lihat semua
      </button>
    </div>
  )
}

export default NotificationDropdown