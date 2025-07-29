// src/components/shared/notifications/NotificationDropdown.jsx

import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useNotificationDropdown } from "./hooks/useNotificationDropdown";

dayjs.extend(isToday);
dayjs.extend(utc);
dayjs.extend(timezone);

// Set timezone default ke Asia/Jakarta
dayjs.tz.setDefault('Asia/Jakarta');

const NotificationDropdown = ({ onViewAll, onClose }) => {
  const [selectedTab, setSelectedTab] = useState('all');
  
  const { 
    notifications, 
    unreadCount,      // This is now generalCount 
    counselingCount,  // This is counselingCount from backend
    isLoading, 
    formatTimeAgo, 
    formatUnreadCount 
  } = useNotificationDropdown(selectedTab);

  // 🔥 ENHANCED: Memoize notification grouping dengan timezone handling yang benar
  const { todayNotifications, previousNotifications } = useMemo(() => {
    const today = [];
    const previous = [];
    const nowLocal = dayjs().tz('Asia/Jakarta');
    
    notifications.forEach(notif => {
      try {
        // Parse sebagai UTC dan convert ke timezone lokal
        const notifTime = dayjs.utc(notif.createdAt).tz('Asia/Jakarta');
        
        if (notifTime.isSame(nowLocal, 'day')) {
          today.push(notif);
        } else {
          previous.push(notif);
        }
      } catch (error) {
        console.error('❌ Error parsing notification time:', notif.id, error);
        // Fallback ke parsing biasa
        if (dayjs(notif.createdAt).isToday()) {
          today.push(notif);
        } else {
          previous.push(notif);
        }
      }
    });
    return { todayNotifications: today, previousNotifications: previous };
  }, [notifications]);

  const getNotificationIcon = (notification) => {
    const { type, subType } = notification;
    if (type === 'schedule') return 'check_circle';
    if (type === 'system') return 'settings';
    if (type === 'report') return 'assessment';
    if (subType === 'counseling') return 'psychology';
    return 'notifications';
  };

  const getNotificationIconColor = (notification) => {
    const { type, subType } = notification;
    if (type === 'schedule') return '#9BCA61';
    if (type === 'system') return '#535353';
    if (type === 'report') return '#488BBE';
    if (subType === 'counseling') return '#9986ff';
    return '#535353';
  };

  // 🔥 CHECK IF NOTIFICATION IS READ
  const isNotificationRead = (notification) => {
    return notification.status === 'read' || notification.isRead || notification.readAt;
  };
  
  const NotificationItem = ({ notification }) => {
    const isRead = isNotificationRead(notification);
    
    return (
      <div 
        key={notification.id} 
        className={`flex gap-3 items-start p-3 rounded-lg transition-all ${
          isRead ? "bg-gray-100 opacity-60" : "bg-white"
        }`}
      >
        {/* Icon without background rounded, size 37px */}
        <span 
          className="material-icons flex-shrink-0"
          style={{ 
            color: getNotificationIconColor(notification),
            fontSize: '37px'
          }}
        >
          {getNotificationIcon(notification)}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold line-clamp-2 ${isRead ? "text-gray-400" : "text-[#535353]"}`}>
            {notification.title}
          </p>
          <span className={`text-xs ${isRead ? "text-gray-400" : "text-[#8a8a8a]"}`}>
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>
        {!isRead && (
          <div className="w-2 h-2 bg-[#488BBE] rounded-full mt-2 self-start flex-shrink-0"></div>
        )}
      </div>
    );
  };

  // 🔥 DEBUG: Log counts for debugging
  console.log('🎯 NotificationDropdown - COUNTS:', {
    selectedTab,
    unreadCount,      // generalCount from backend
    counselingCount,  // counselingCount from backend
    notificationsCount: notifications.length
  });

  return (
    <div className="absolute right-0 mt-2 w-[395px] max-h-[400px] overflow-hidden bg-white shadow-lg rounded-b-xl z-50 border border-gray-200 flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="p-5 pb-0">
        <div className="text-[#488abe] font-semibold text-base mb-4">Notifikasi</div>
        <div className="flex items-center gap-5 text-sm text-[#535353] mb-4">
          <button
            onClick={() => setSelectedTab('all')}
            className={`flex items-center gap-2 transition-colors ${selectedTab === 'all' ? "font-bold text-[#535353]" : "font-normal text-[#8a8a8a] hover:text-[#535353]"}`}
          >
            <span>Semua</span>
            {/* 🔥 UPDATED: Use generalCount (unreadCount) for "Semua" tab */}
            {unreadCount > 0 && (
              <span className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {formatUnreadCount(unreadCount)}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('counseling')}
            className={`flex items-center gap-2 transition-colors ${selectedTab === 'counseling' ? "font-bold text-[#535353]" : "font-normal text-[#8a8a8a] hover:text-[#535353]"}`}
          >
            <span>Konseling</span>
            {/* 🔥 UPDATED: Use counselingCount for "Konseling" tab */}
            {counselingCount > 0 && (
              <span className="bg-[#EE4266] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {formatUnreadCount(counselingCount)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONTENT SECTION (VIEW ONLY) */}
      <div className="flex-grow max-h-[290px] overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <span className="material-icons animate-spin text-[#488BBE]">sync</span>
          </div>
        )}
        {!isLoading && (
          <div className="px-5">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {/* Render "Hari Ini" section */}
                {todayNotifications.length > 0 && (
                  <div>
                    <div className="text-xs text-[#8a8a8a] pb-2 pt-4 border-b border-gray-100 sticky top-0 bg-white">
                      Hari Ini
                    </div>
                    <div className="space-y-3 pt-3">
                      {todayNotifications.map((notification) => (
                        <NotificationItem key={notification.id} notification={notification} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Render "Sebelumnya" section */}
                {previousNotifications.length > 0 && (
                  <div>
                    <div className="text-xs text-[#8a8a8a] pb-2 pt-4 border-b border-gray-100 sticky top-0 bg-white">
                      Sebelumnya
                    </div>
                    <div className="space-y-3 pt-3">
                      {previousNotifications.map((notification) => (
                        <NotificationItem key={notification.id} notification={notification} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm h-full flex flex-col justify-center items-center">
                <span className="material-icons text-4xl text-gray-300 mb-2">notifications_none</span>
                Tidak ada notifikasi
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER SECTION */}
      <div className="border-t border-gray-100 p-4 bg-gray-50 mt-auto">
        <button
          onClick={onViewAll}
          className="w-full text-sm text-[#488abe] hover:text-[#3399E9] font-medium"
        >
          Lihat Semua Notifikasi
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;