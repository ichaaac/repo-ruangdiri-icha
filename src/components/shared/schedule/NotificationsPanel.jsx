// src/components/shared/schedule/NotificationsPanel.jsx - Exact Figma Design

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const NotificationPanel = ({ 
  containerWidth = 335,
  sidebarExpanded = false 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Sample notification data - matches figma design exactly
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
    // Load initial notifications
    setNotifications(sampleNotifications.slice(0, 4));
  }, []);

  const loadMoreNotifications = () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      const currentCount = notifications.length;
      const newNotifications = sampleNotifications.slice(currentCount, currentCount + 2);
      
      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setHasMore(false);
      }
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
              className="h-full overflow-y-auto"
              onScroll={handleScroll}
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E0 #F7FAFC',
                padding: '15px' // 15px margin from sides
              }}
            >
              <div className="space-y-[3px]"> {/* 3px gap between notifications */}
                {notifications.map((notification, index) => (
                  <motion.div 
                    key={notification.id}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      width: '312px', // Fixed width as per Figma
                      height: '50px',  // Fixed height as per Figma
                      backgroundColor: '#F3F3F3', // Background color as per Figma
                      borderRadius: '5px',
                      padding: '12px' // 12px padding from all sides
                    }}
                  >
                    <div className="flex items-center gap-3 h-full">
                      {/* Profile Image - circular */}
                      <div 
                        className="rounded-full overflow-hidden flex-shrink-0"
                        style={{ width: '18px', height: '18px' }} // Adjusted for 50px height with 12px padding
                      >
                        <img 
                          className="w-full h-full object-cover" 
                          alt="Profile" 
                          src={notification.avatar}
                        />
                      </div>
                      
                      {/* Content - Name, Message, and Time layout as per Figma */}
                      <div className="flex-1 min-w-0 h-full flex flex-col justify-center">
                        {/* Name (bold) on first line */}
                        <div className="text-xs leading-tight">
                          <span className="font-bold text-[#535353] block">
                            {notification.name}
                          </span>
                        </div>
                        {/* Message and Time on same line, aligned with name */}
                        <div className="flex items-center justify-between text-xs leading-tight mt-0.5">
                          <span className="text-[#535353] truncate">
                            {notification.message}
                          </span>
                          <span className="text-[#8B8B8B] ml-2 flex-shrink-0">
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-center py-3">
                    <div className="w-5 h-5 border-2 border-[#488BBA] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* No more notifications */}
                {!hasMore && notifications.length > 0 && (
                  <div className="text-center py-3">
                    <span className="text-xs text-gray-400">Tidak ada notifikasi lagi</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Custom scrollbar styling */
        div::-webkit-scrollbar {
          width: 4px;
        }
        
        div::-webkit-scrollbar-track {
          background: #F7FAFC;
          border-radius: 2px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 2px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }
      `}</style>
    </div>
  );
};

export default NotificationPanel;