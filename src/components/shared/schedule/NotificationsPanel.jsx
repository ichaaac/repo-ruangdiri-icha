// src/components/shared/schedule/NotificationsPanel.jsx - Backend Integration

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const NotificationPanel = ({ 
  containerWidth = 335,
  sidebarExpanded = false,
  notifications = [], // Real data from backend
  loading = false
}) => {
  const [displayNotifications, setDisplayNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Set the real notifications from backend
    setDisplayNotifications(notifications);
    setHasMore(notifications.length > 0);
  }, [notifications]);

  const loadMoreNotifications = () => {
    if (isLoading || !hasMore || loading) return;

    setIsLoading(true);
    // Simulate loading more (for pagination when implemented)
    setTimeout(() => {
      setHasMore(false);
      setIsLoading(false);
    }, 500);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      loadMoreNotifications();
    }
  };

  // Exact Figma dimensions: 335x293px
  const baseWidth = 335;
  const baseHeight = 293;
  const actualWidth = Math.min(baseWidth, containerWidth);
  const actualHeight = baseHeight;

  // Header height to match other components
  const headerHeight = 66;
  const contentHeight = actualHeight - headerHeight;

  // Custom scrollbar styles
  const scrollbarStyles = {
    scrollbarWidth: 'thin',
    scrollbarColor: '#CBD5E0 #F7FAFC',
  };

  // Add custom scrollbar CSS to document if not already added
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #F7FAFC;
        border-radius: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #CBD5E0;
        border-radius: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #A0AEC0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return "Baru saja";
    
    // If it's already formatted (e.g., "1 jam yang lalu"), return as is
    if (timeString.includes("yang lalu") || timeString.includes("ago")) {
      return timeString;
    }
    
    // If it's an ISO date, format it
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return "Baru saja";
      if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
      return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`;
    } catch {
      return timeString;
    }
  };

  // Get avatar URL
  const getAvatarUrl = (notification) => {
    // If there's a direct avatar URL, use it
    if (notification.avatar) return notification.avatar;
    
    // If there's user data with avatar
    if (notification.user?.avatar) return notification.user.avatar;
    
    // Generate placeholder avatar based on name
    const name = notification.user?.fullName || notification.name || "User";
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=488BBA&color=fff&size=256`;
  };

  return (
    <div 
      className="rounded-md border border-zinc-500 bg-white transition-all duration-300"
      style={{ 
        width: `${actualWidth}px`, 
        height: `${actualHeight}px`
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header - matches CounselingQueue and ScheduleGrid style */}
        <div 
          className="flex items-center px-5 py-3 border-b border-zinc-200"
          style={{ height: `${headerHeight}px` }}
        >
          <div className="flex items-center gap-x-[15px]">
            <div className="w-[30px] h-[30px] bg-[#488BBE] rounded flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-white text-lg">notifications</span>
            </div>
            <h1 className="text-xl font-semibold text-[#488BBA]">
              Notifikasi
            </h1>
          </div>
          {loading && (
            <div className="ml-auto text-sm text-gray-500">Loading...</div>
          )}
        </div>

        {/* Notification Content */}
        <div 
          className="flex-1 overflow-hidden"
          style={{ height: `${contentHeight}px` }}
        >
          {loading && displayNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#488BBA] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-zinc-500">Memuat notifikasi...</p>
              </div>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-zinc-500">Belum ada notifikasi</p>
            </div>
          ) : (
            <div 
              className="h-full overflow-y-auto custom-scrollbar"
              onScroll={handleScroll}
              style={{ 
                ...scrollbarStyles,
                padding: '15px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {displayNotifications.map((notification, index) => (
                  <motion.div 
                    key={notification.id || index}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      width: '312px', 
                      height: '50px',  
                      backgroundColor: '#F3F3F3',
                      borderRadius: '5px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {/* Left side: Avatar + Name + Message */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      {/* Avatar */}
                      <div 
                        style={{ 
                          width: '18px', 
                          height: '18px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        <img 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          alt="Profile" 
                          src={getAvatarUrl(notification)}
                          onError={(e) => {
                            // Fallback to default avatar on error
                            e.target.src = "https://ui-avatars.com/api/?name=User&background=488BBA&color=fff&size=256";
                          }}
                        />
                      </div>

                      {/* Name + Message */}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span 
                          style={{ 
                            fontWeight: 'bold', 
                            color: '#535353', 
                            fontSize: '12px', 
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {notification.user?.fullName || notification.name || "Unknown User"}
                        </span>
                        <span 
                          style={{ 
                            color: '#535353', 
                            fontSize: '14px',
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {notification.action || notification.message || "Made an action"}
                        </span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      height: '100%', 
                      flexShrink: 0,
                      marginLeft: '8px'
                    }}>
                      <span style={{ 
                        color: '#8B8B8B', 
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatTime(notification.time || notification.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                    <div style={{
                      width: '20px',
                      height: '20px', 
                      border: '2px solid #488BBA',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                )}

                {/* No more notifications */}
                {!hasMore && displayNotifications.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Semua notifikasi telah dimuat
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;