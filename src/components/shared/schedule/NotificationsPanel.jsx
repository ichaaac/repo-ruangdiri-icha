// src/components/shared/schedule/NotificationsPanel.jsx - Optimized without styled-jsx

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const NotificationPanel = ({ 
  containerWidth = 335,
  sidebarExpanded = false 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Sample notification data - 5 notifications as requested
  const sampleNotifications = [
    {
      id: 1,
      name: "Antony Martial",
      message: "Made a appointment",
      time: "1 Jam yang lalu",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      id: 2,
      name: "Jessica Chen", 
      message: "Made a appointment",
      time: "1 Jam yang lalu",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      id: 3,
      name: "David Kumar",
      message: "Made a appointment", 
      time: "1 Jam yang lalu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      id: 4,
      name: "Sarah Wilson",
      message: "Made a appointment",
      time: "1 Jam yang lalu", 
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      id: 5,
      name: "Michael Brown",
      message: "Made a appointment",
      time: "1 Jam yang lalu",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    }
  ];

  useEffect(() => {
    // Load all 5 notifications initially
    setNotifications(sampleNotifications);
  }, []);

  const loadMoreNotifications = () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      // Simulate loading more (for websocket preparation)
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
            <h2 className="text-xl font-semibold text-[#488BBA]">
              Notifikasi
            </h2>
          </div>
        </div>

        {/* Notification Content */}
        <div 
          className="flex-1 overflow-hidden"
          style={{ height: `${contentHeight}px` }}
        >
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-zinc-500">Belum ada notifikasi</p>
            </div>
          ) : (
            <div 
              className="h-full overflow-y-auto custom-scrollbar"
              onScroll={handleScroll}
              style={{ 
                ...scrollbarStyles,
                padding: '15px' // 15px margin from sides
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {notifications.map((notification, index) => (
                  <motion.div 
                    key={notification.id}
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
                          src={notification.avatar}
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
                          {notification.name}
                        </span>
                        <span 
                          style={{ 
                            color: '#535353', 
                            fontSize: '14px', // Increased from 12px to 14px
                            lineHeight: '1.2',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {notification.message}
                        </span>
                      </div>
                    </div>

                    {/* Timestamp (always centered in card) */}
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
                        {notification.time}
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
                {!hasMore && notifications.length > 0 && (
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