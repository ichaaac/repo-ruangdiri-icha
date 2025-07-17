// src/components/shared/notifications/Notifications.jsx

import React, { useCallback, useRef, forwardRef } from "react"
import { useNotifications } from "./hooks/useNotifications"

// Loading State Component
const LoadingState = () => (
  <div className="flex justify-center items-center py-12">
    <span className="material-icons animate-spin text-[#488BBE] text-3xl mr-3">sync</span>
    <span className="text-[#488BBE]">Memuat notifikasi...</span>
  </div>
)

// Error State Component
const ErrorState = ({ error }) => (
  <div className="text-center py-12">
    <span className="material-icons text-red-500 text-5xl mb-4 block">error_outline</span>
    <p className="text-red-500 font-semibold mb-2">Gagal memuat notifikasi</p>
    <p className="text-gray-600 mb-4 text-sm">
      {error?.message || "Terjadi kesalahan saat mengambil data notifikasi."}
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-[#488BBE] text-white rounded-full hover:bg-[#3399E9] text-sm transition-colors"
    >
      Coba Lagi
    </button>
  </div>
)

// Empty State Component
const EmptyState = () => (
  <div className="text-center py-12">
    <span className="material-icons text-gray-400 text-5xl mb-4 block">notifications_none</span>
    <p className="text-gray-500 text-lg mb-2">Tidak ada notifikasi</p>
    <p className="text-gray-400 text-sm">Notifikasi akan muncul di sini saat ada aktivitas baru</p>
  </div>
)

// Loading Spinner Component
const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="flex items-center gap-2">
    <span className="material-icons animate-spin text-[#488BBE] text-lg">sync</span>
    <span className="text-[#488BBE] text-sm">{text}</span>
  </div>
)

// Header Component
const NotificationHeader = ({ unreadCount, onMarkAllAsRead, isMarkingAllAsRead }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-xl font-semibold text-[#488BBE]">Notifikasi</h1>
      
      {/* US-AC-Notif-3-1: Mark All as Read */}
      {unreadCount > 0 && (
        <button
          onClick={onMarkAllAsRead}
          disabled={isMarkingAllAsRead}
          className="text-sm text-[#488BBE] hover:text-[#3399E9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isMarkingAllAsRead && <span className="material-icons animate-spin text-sm">sync</span>}
          {isMarkingAllAsRead ? "Menandai..." : "Tandai Semua Dibaca"}
        </button>
      )}
    </div>
  </div>
)

// Tabs Component - 🔥 ENHANCED: Uses formatCount from context
const NotificationTabs = ({ selectedTab, totalCount, counselingCount, onTabChange, formatCount }) => (
  <div className="flex items-center gap-10 mb-6">
    {/* US-AC-Notif-3-2: Tab Semua */}
    <button
      onClick={() => onTabChange("all")}
      className={`flex items-center gap-1 ${
        selectedTab === "all" 
          ? "font-bold text-[#535353]" 
          : "font-normal text-[#8a8a8a] hover:text-[#535353]"
      } transition-colors`}
    >
      <span>Semua</span>
      {selectedTab === "all" && totalCount > 0 && (
        <div className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] h-5 flex items-center justify-center">
          {formatCount(totalCount)}
        </div>
      )}
    </button>

    {/* US-AC-Notif-3-2: Tab Konseling */}
    <button
      onClick={() => onTabChange("counseling")}
      className={`flex items-center gap-1 ${
        selectedTab === "counseling" 
          ? "font-bold text-[#535353]" 
          : "font-normal text-[#8a8a8a] hover:text-[#535353]"
      } transition-colors`}
    >
      <span>Konseling</span>
      {selectedTab === "counseling" && counselingCount > 0 && (
        <div className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] h-5 flex items-center justify-center">
          {formatCount(counselingCount)}
        </div>
      )}
    </button>
  </div>
)

// Individual Notification Item
const NotificationItem = forwardRef(({ notification, onMarkAsRead, isMarkingAsRead, formatTimeAgo }, ref) => {
  const handleClick = () => {
    // US-AC-Notif-3-1: Mark as read when clicked
    if (!notification.isRead && !notification.readAt && !isMarkingAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const isRead = notification.isRead || notification.readAt

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`h-auto min-h-[45px] px-4 py-3 rounded-md flex items-start gap-4 transition-all duration-200 ${
        isRead 
          ? "bg-[#f2f2f2] cursor-default opacity-70" // US-AC-Notif-3-1: Abu-abu untuk yang sudah dibaca
          : "bg-white border border-gray-100 cursor-pointer hover:bg-gray-50 hover:shadow-sm"
      } ${isMarkingAsRead ? "opacity-50" : ""}`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#d9d9d9" }}
        >
          <span 
            className="material-icons text-lg"
            style={{ color: getNotificationIconColor(notification) }}
          >
            {getNotificationIcon(notification)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1">
          <p className={`text-sm font-semibold leading-tight ${
            isRead ? "text-gray-500" : "text-[#535353]"
          }`}>
            {notification.title}
          </p>
          
          <div className="flex items-center gap-1 text-xs">
            {notification.message && (
              <>
                <div className="w-2 h-2 bg-[#9986ff] rounded-full flex-shrink-0"></div>
                <span className={`font-medium ${isRead ? "text-gray-400" : "text-[#535353]"}`}>
                  {notification.message}
                </span>
                <span className={`mx-1 ${isRead ? "text-gray-400" : "text-[#535353]"}`}>|</span>
              </>
            )}
            {/* 🔥 USE CONTEXT FORMAT TIME AGO WITH DAYJS */}
            <span className="text-[#8a8a8a] font-light">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Unread Indicator */}
      {!isRead && (
        <div className="flex-shrink-0 w-2 h-2 bg-[#488BBE] rounded-full mt-2 animate-pulse"></div>
      )}
      
      {/* Read Indicator */}
      {isRead && (
        <div className="flex-shrink-0 mt-2">
          <span className="material-icons text-gray-400 text-sm">done</span>
        </div>
      )}
    </div>
  )
})

NotificationItem.displayName = "NotificationItem"

// Notification List with Infinite Scroll
const NotificationList = ({ 
  groupedNotifications, 
  hasNextPage, 
  isFetchingNextPage, 
  onMarkAsRead, // 🔥 PASTIKAN INI DITERIMA SEBAGAI PROP
  onFetchNextPage, 
  getDateLabel,
  formatTimeAgo,
  isMarkingAsRead // 🔥 PASTIKAN INI DITERIMA SEBAGAI PROP
}) => {
  const observer = useRef()
  
  // US-AC-Notif-3-4: Infinite scroll
  const lastElementRef = useCallback((node) => {
    if (isFetchingNextPage) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        onFetchNextPage()
      }
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px 100px 0px"
    })
    
    if (node) observer.current.observe(node)
  }, [isFetchingNextPage, hasNextPage, onFetchNextPage])

  const hasNotifications = Object.keys(groupedNotifications).length > 0
  
  if (!hasNotifications) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* US-AC-Notif-3-3: Vertical scroll */}
      <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-2">
        {Object.entries(groupedNotifications).map(([dateKey, notifications], groupIndex) => {
          const isLastGroup = groupIndex === Object.keys(groupedNotifications).length - 1
          
          return (
            <div key={dateKey} className="space-y-1">
              
              {/* Date Separator - 🔥 ENHANCED WITH DAYJS */}
              <div className="text-xs font-normal text-[#8a8a8a] mb-1 sticky top-0 bg-white py-2 z-10">
                {getDateLabel(dateKey)}
              </div>

              {/* Notifications */}
              <div className="space-y-1">
                {notifications.map((notification, index) => {
                  const isLastItem = isLastGroup && index === notifications.length - 1
                  
                  return (
                    <NotificationItem
                      key={notification.id}
                      ref={isLastItem ? lastElementRef : null}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead} // 🔥 PENTING: TERUSKAN PROP INI!
                      isMarkingAsRead={isMarkingAsRead} // 🔥 PENTING: TERUSKAN PROP INI!
                      formatTimeAgo={formatTimeAgo}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {/* Loading untuk infinite scroll */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <LoadingSpinner text="Memuat notifikasi lainnya..." />
          </div>
        )}
        
        {/* End indicator */}
        {!hasNextPage && hasNotifications && (
          <div className="text-center py-4 text-gray-400 text-sm">
            Semua notifikasi telah dimuat
          </div>
        )}
      </div>
    </div>
  )
}

// Utility functions - 🔥 ICON LOGIC BASED ON TITLE INCLUDES
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

// Main Notifications Component
const Notifications = ({ sidebarExpanded = false }) => {
  // 🔥 USE ENHANCED HOOK WITH CONTEXT
  const {
    groupedNotifications,
    totalCount,
    unreadCount,
    counselingCount,
    selectedTab,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    handleTabChange,
    handleMarkAsRead,
    handleMarkAllAsRead,
    fetchNextPage,
    getDateLabel,
    formatTimeAgo,
    formatCount,
    isMarkingAsRead,
    isMarkingAllAsRead,
  } = useNotifications()

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-white">

      <div className="px-4 sm:px-6 lg:px-6 pt-[100px] pb-8">
        <div className="max-w-4xl">
          
          <NotificationHeader 
            unreadCount={unreadCount}
            onMarkAllAsRead={handleMarkAllAsRead}
            isMarkingAllAsRead={isMarkingAllAsRead}
          />

          <NotificationTabs
            selectedTab={selectedTab}
            totalCount={totalCount}
            counselingCount={counselingCount}
            onTabChange={handleTabChange}
            formatCount={formatCount}
          />

          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} />
          ) : (
            <NotificationList
              groupedNotifications={groupedNotifications}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onMarkAsRead={handleMarkAsRead} // 🔥 PENTING: TERUSKAN PROP INI DARI HOOK!
              onFetchNextPage={fetchNextPage}
              getDateLabel={getDateLabel}
              formatTimeAgo={formatTimeAgo}
              isMarkingAsRead={isMarkingAsRead} // 🔥 PENTING: TERUSKAN PROP INI DARI HOOK!
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default Notifications