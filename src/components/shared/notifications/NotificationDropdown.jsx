// src/components/shared/notifications/NotificationDropdown.jsx - ENHANCED WITH CONTEXT

import React, { useState } from "react"
import { useNotificationDropdown } from "./hooks/useNotificationDropdown"

const NotificationDropdown = ({ onViewAll, onClose }) => {
  // 🔥 LOCAL STATE FOR DROPDOWN TABS
  const [selectedTab, setSelectedTab] = useState('all')
  
  // 🔥 USE ENHANCED HOOK (NO MORE QUERIES!)
  const { 
    notifications, 
    unreadCount,
    counselingCount,
    isLoading,
    formatTimeAgo,
    formatUnreadCount
  } = useNotificationDropdown(selectedTab)

  // US-AC-Notif-1-2: Max 3 items in dropdown (handled in hook)
  const displayNotifications = notifications
  
  // 🔥 ENHANCED: Handle type + subType combinations for icons
  const getNotificationIcon = (type, subType) => {
    // 🔥 SPECIFIC COMBINATIONS based on backend data
    if (type === 'schedule' && subType === 'general') {
      return 'check_circle' // Green check circle for schedule notifications
    }
    
    if (type === 'system' && subType === 'general') {
      return 'settings' // Settings icon for system notifications
    }
    
    // Legacy icon mapping (fallback)
    const iconMap = {
      schedule_created: "event",
      schedule_updated: "event_available", 
      schedule_deleted: "event_busy",
      schedule_reminder: "schedule",
      system_announcement: "campaign",
      mental_health_alert: "psychology",
      system: "settings",
      schedule: "check_circle",
      general: "info"
    }
    
    return iconMap[type] || iconMap[subType] || "notifications"
  }

  // 🔥 ENHANCED: Get notification icon color
  const getNotificationIconColor = (type, subType) => {
    // 🔥 SPECIFIC COMBINATIONS based on backend data
    if (type === 'schedule' && subType === 'general') {
      return '#9BCA61' // Green color for schedule notifications
    }
    
    if (type === 'system' && subType === 'general') {
      return '#535353' // Default gray for system notifications
    }
    
    // Default color fallback
    return '#535353'
  }

  // 🔥 HANDLE TAB SWITCHING
  const handleTabChange = (tab) => {
    setSelectedTab(tab)
  }

  // 🔥 GET CURRENT COUNT BASED ON SELECTED TAB
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

      {/* Filter Tabs with counts - 🔥 ENHANCED WITH CONTEXT DATA */}
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

      {/* Loading State - 🔥 ONLY INITIAL LOADING */}
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
                    style={{ color: getNotificationIconColor(notification.type, notification.subType) }}
                  >
                    {getNotificationIcon(notification.type, notification.subType)}
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
                      {/* 🔥 USE CONTEXT FORMAT TIME AGO WITH DAYJS */}
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