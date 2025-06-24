// src/components/shared/schedule/NotificationsPanel.jsx - Fixed Layout and Sizing

import { motion } from "framer-motion"

const NotificationPanel = ({ 
  containerWidth = 335,
  sidebarExpanded = false 
}) => {
  // Sample notification data - in real app this would come from props or API
  const notifications = [];

  // Base dimensions (Figma: 335x293)
  const baseWidth = 335;
  const baseHeight = 293;
  const actualWidth = Math.min(baseWidth, containerWidth);
  const actualHeight = baseHeight;

  return (
    <div 
      className="rounded-md border border-zinc-500 bg-white transition-all duration-300"
      style={{ 
        width: `${actualWidth}px`, 
        height: `${actualHeight}px`
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header - integrated with content */}
        <div className="flex items-center p-3.5">
          <div className="w-[30px] h-[30px] bg-[#488BBE] rounded flex items-center justify-center">
            <span className="material-icons text-white text-lg">notifications</span>
          </div>
          <h2 
            className="text-xl font-semibold text-[#488BBA]" 
            style={{ marginLeft: '15px' }}
          >
            Notifikasi
          </h2>
        </div>

        {/* Notification Content */}
        <div className="flex-1 flex items-center justify-center px-3.5 pb-3.5">
          {notifications.length === 0 ? (
            <p className="text-xs text-zinc-500">Belum ada notifikasi</p>
          ) : (
            <div className="w-full space-y-3 max-h-[200px] overflow-y-auto scrollbar-custom">
              {notifications.map((notification, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-neutral-700 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-neutral-600 mb-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-neutral-500">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;