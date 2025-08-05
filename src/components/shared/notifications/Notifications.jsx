// src/components/shared/notifications/Notifications.jsx

import React, { useCallback, useRef, forwardRef } from "react"
import { useNotifications } from "./hooks/useNotifications"

const LoadingState = () => (
  <div className="flex justify-center items-center py-12">
    <span className="material-icons animate-spin text-[#488BBE] text-3xl mr-3">sync</span>
    <span className="text-[#488BBE]">Memuat notifikasi...</span>
  </div>
)

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

const EmptyState = () => (
  <div className="text-center py-12">
    <span className="material-icons text-gray-400 text-5xl mb-4 block">notifications_none</span>
    <p className="text-gray-500 text-lg mb-2">Tidak ada notifikasi</p>
    <p className="text-gray-400 text-sm">Notifikasi akan muncul di sini saat ada aktivitas baru</p>
  </div>
)

const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="flex items-center gap-2">
    <span className="material-icons animate-spin text-[#488BBE] text-lg">sync</span>
    <span className="text-[#488BBE] text-sm">{text}</span>
  </div>
)

const NotificationHeader = ({ unreadCount, onMarkAllAsRead, isMarkingAllAsRead }) => (
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
      <h1 className="text-xl font-semibold text-[#488BBE]">Notifikasi</h1>     
      {/* {unreadCount > 0 && (
        <button
          onClick={onMarkAllAsRead}
          disabled={isMarkingAllAsRead}
          className="text-sm text-[#488BBE] hover:text-[#3399E9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-start sm:self-auto"
        >
          {isMarkingAllAsRead && <span className="material-icons animate-spin text-sm">sync</span>}
          {isMarkingAllAsRead ? "Menandai..." : "Tandai Semua Dibaca"}
        </button>
      )} */}
    </div>
  </div>
)

const NotificationTabs = ({ selectedTab, unreadCount, counselingCount, onTabChange, formatCount }) => {
  return (
    <div className="flex items-center gap-6 sm:gap-10 mb-6 overflow-x-auto">
      <button
        onClick={() => onTabChange("all")}
        className={`flex items-center gap-1 whitespace-nowrap ${
          selectedTab === "all" 
            ? "font-bold text-[#535353]" 
            : "font-normal text-[#8a8a8a] hover:text-[#535353]"
        } transition-colors`}
      >
        <span>Semua</span>
        {unreadCount > 0 && (
          <div className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] h-5 flex items-center justify-center">
            {formatCount(unreadCount)}
          </div>
        )}
      </button>

      <button
        onClick={() => onTabChange("counseling")}
        className={`flex items-center gap-1 whitespace-nowrap ${
          selectedTab === "counseling" 
            ? "font-bold text-[#535353]" 
            : "font-normal text-[#8a8a8a] hover:text-[#535353]"
        } transition-colors`}
      >
        <span>Konseling</span>
        {counselingCount > 0 && (
          <div className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] h-5 flex items-center justify-center">
            {formatCount(counselingCount)}
          </div>
        )}
      </button>
    </div>
  )
}

const getNotificationIcon = (notification) => {
  const { type, subType } = notification
  
  if (type === 'schedule') {
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
    return 'check_circle'
  }
  
  if (type === 'system') {
    return 'settings'
  }
  
  if (type === 'report') {
    return 'assessment'
  }
  
  if (subType === 'counseling') {
    return 'psychology'
  }
  
  return 'notifications'
}

const getNotificationIconColor = (notification) => {
  const { type, subType } = notification
  
  if (type === 'schedule') {
    return '#9BCA61'
  }
  
  if (type === 'system') {
    return '#535353'
  }
  
  if (type === 'report') {
    return '#488BBE'
  }
  
  if (subType === 'counseling') {
    return '#9986ff'
  }
  
  return '#535353'
}

const isNotificationRead = (notification) => {
  return notification.status === 'read' || notification.isRead || notification.readAt;
}

const NotificationItem = forwardRef(({ notification, onMarkAsRead, isMarkingAsRead, formatTimeAgo }, ref) => {
  const handleClick = () => {
    if (!isNotificationRead(notification) && !isMarkingAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const isRead = isNotificationRead(notification)

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`h-auto min-h-[45px] px-4 py-3 rounded-md flex items-start gap-4 transition-all duration-200 ${
        isRead 
          ? "bg-[#f2f2f2] cursor-default opacity-70" 
          : "bg-white border border-gray-100 cursor-pointer hover:bg-gray-50 hover:shadow-sm"
      } ${isMarkingAsRead ? "opacity-50" : ""}`}
    >
      <div className="flex-shrink-0 flex items-center justify-center">
        <span 
          className="material-icons"
          style={{ 
            color: getNotificationIconColor(notification),
            fontSize: '35px'
          }}
        >
          {getNotificationIcon(notification)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1">
          <p className={`text-sm font-semibold leading-tight ${
            isRead ? "text-gray-500" : "text-[#535353]"
          }`}>
            {notification.title}
          </p>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs">
            {notification.message && (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#9986ff] rounded-full flex-shrink-0"></div>
                  <span className={`font-medium ${isRead ? "text-gray-400" : "text-[#535353]"}`}>
                    {notification.message}
                  </span>
                </div>
                <span className={`hidden sm:inline mx-1 ${isRead ? "text-gray-400" : "text-[#535353]"}`}>|</span>
              </>
            )}
            <span className="text-[#8a8a8a] font-light">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {!isRead && (
        <div className="flex-shrink-0 w-2 h-2 bg-[#488BBE] rounded-full mt-2 animate-pulse"></div>
      )}
      
      {isRead && (
        <div className="flex-shrink-0 mt-2">
          <span className="material-icons text-gray-400 text-sm">done</span>
        </div>
      )}
    </div>
  )
})

NotificationItem.displayName = "NotificationItem"

const NotificationList = ({ 
  groupedNotifications, 
  hasNextPage, 
  isFetchingNextPage, 
  onMarkAsRead, 
  onFetchNextPage, 
  getDateLabel,
  formatTimeAgo,
  isMarkingAsRead 
}) => {
  const observer = useRef()
  
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
      <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-2">
        {Object.entries(groupedNotifications).map(([dateKey, notifications], groupIndex) => {
          const isLastGroup = groupIndex === Object.keys(groupedNotifications).length - 1
          
          return (
            <div key={dateKey} className="space-y-1">
              
              <div className="text-xs font-normal text-[#8a8a8a] mb-1 sticky top-0 bg-white py-2 z-10">
                {getDateLabel(dateKey)}
              </div>

              <div className="space-y-1">
                {notifications.map((notification, index) => {
                  const isLastItem = isLastGroup && index === notifications.length - 1
                  
                  return (
                    <NotificationItem
                      key={notification.id}
                      ref={isLastItem ? lastElementRef : null}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      isMarkingAsRead={isMarkingAsRead}
                      formatTimeAgo={formatTimeAgo}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <LoadingSpinner text="Memuat notifikasi lainnya..." />
          </div>
        )}
        
        {!hasNextPage && hasNotifications && (
          <div className="text-center py-4 text-gray-400 text-sm">
            Semua notifikasi telah dimuat
          </div>
        )}
      </div>
    </div>
  )
}

const Notifications = ({ sidebarExpanded = false }) => {
  const {
    groupedNotifications,
    totalCount,
    unreadCount, // This is generalCount from the hook
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
  } = useNotifications();

  // 🔥 ADDED: Calculate the total unread count for the "All" tab
  const totalUnreadAllCount = unreadCount + counselingCount;

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-white">
      <div className="px-4 sm:px-6 lg:px-8 pt-[100px] pb-8">
        <div className="max-w-full lg:max-w-6xl xl:max-w-7xl mx-auto">
          
          {/* 🔥 UPDATED: Pass total count to the header */}
          <NotificationHeader 
            unreadCount={totalUnreadAllCount}
            onMarkAllAsRead={handleMarkAllAsRead}
            isMarkingAllAsRead={isMarkingAllAsRead}
          />

          {/* 🔥 UPDATED: Pass total to "unreadCount" and keep counselingCount separate */}
          <NotificationTabs
            selectedTab={selectedTab}
            unreadCount={totalUnreadAllCount} 
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
              onMarkAsRead={handleMarkAsRead}
              onFetchNextPage={fetchNextPage}
              getDateLabel={getDateLabel}
              formatTimeAgo={formatTimeAgo}
              isMarkingAsRead={isMarkingAsRead}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default Notifications;