// src/components/shared/layout/TopRightControl.jsx - FIXED: Restored original socket logic

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "@/components/shared/notifications/lib/api";
import notificationSocket from "@/components/shared/notifications/lib/socket";
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown";

// START: Language Switcher Component (No logic changes here)
const LanguageSwitcher = () => {
  const [selectedLang, setSelectedLang] = useState('ID');

  const handleSelectLang = (lang) => {
    setSelectedLang(lang);
  };

  const baseButtonClass = "w-14 h-full flex justify-center items-center gap-1.5 cursor-pointer transition-all duration-300 ease-in-out";
  const activeClass = "bg-white rounded-[20px] shadow-[-1px_0px_1px_0px_rgba(0,0,0,0.13)]";
  const inactiveClass = "text-white";
  
  const activeTextClass = "text-sm font-bold leading-tight";
  const inactiveTextClass = "text-sm font-normal leading-tight";

  return (
    <div 
      className="w-28 h-7 relative flex items-center rounded-[39px] outline outline-1 outline-[#488BBA]"
      style={{ backgroundColor: '#488BBA' }}
    >
      <div
        onClick={() => handleSelectLang('EN')}
        className={`${baseButtonClass} ${selectedLang === 'EN' ? activeClass : inactiveClass}`}
      >
        <img src="/icon/us-flag.png" alt="US Flag" className="w-4 h-4" />
        <span className={selectedLang === 'EN' ? "text-[#488BBA] " + activeTextClass : inactiveTextClass}>EN</span>
      </div>
      <div
        onClick={() => handleSelectLang('ID')}
        className={`${baseButtonClass} ${selectedLang === 'ID' ? activeClass : inactiveClass}`}
      >
        <img src="/icon/id-flag.png" alt="ID Flag" className="w-4 h-4" />
        <span className={selectedLang === 'ID' ? "text-[#488BBA] " + activeTextClass : inactiveTextClass}>ID</span>
      </div>
    </div>
  );
};
// END: Language Switcher Component


const TopRightControl = ({ className = "", isAbsolute = true }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketRetryCount, setSocketRetryCount] = useState(0);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 🔥 ORIGINAL LOGIC: Use the SAME query key as hooks with new structure
  const { data: unreadData, isLoading, error: unreadError } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 3,
  });

  // 🔥 ORIGINAL LOGIC: Use generalCount instead of count
  const unreadCount = (unreadData?.generalCount || 0) + (unreadData?.counselingCount || 0);

  // 🔥 ORIGINAL LOGIC: Socket setup dengan better connection monitoring. THIS IS THE RESTORED LOGIC.
  useEffect(() => {
    console.log('🔗 TopRightControl: Setting up socket connection')
    
    let isComponentMounted = true;
    let statusCheckInterval = null;

    const initializeSocket = async () => {
      try {
        await notificationSocket.connect();
        if (isComponentMounted) {
          console.log('✅ TopRightControl: Socket connected successfully');
          setIsSocketConnected(true);
          setSocketRetryCount(0);
        }
      } catch (err) {
        if (isComponentMounted) {
          console.error('❌ TopRightControl: Socket connection failed:', err);
          setIsSocketConnected(false);
          setSocketRetryCount(prev => prev + 1);
        }
      }
    };

    // Initial connection
    initializeSocket();

    // 🔥 ORIGINAL LOGIC: Better status monitoring
    statusCheckInterval = setInterval(() => {
      if (isComponentMounted) {
        const actualStatus = notificationSocket.isSocketConnected();
        if (actualStatus !== isSocketConnected) {
          // console.log('🔄 TopRightControl: Status sync - updating from', isSocketConnected, 'to', actualStatus);
          setIsSocketConnected(actualStatus);
        }
      }
    }, 5000); // Check every 5 seconds

    // 🔥 ORIGINAL LOGIC: MINIMAL REALTIME UPDATE HANDLERS
    // This part is crucial for refreshing the unread count.
    const handleRealtimeUpdate = (event, payload) => {
      if (!isComponentMounted) return;
      
      console.log(`🔔 TopRightControl: Received '${event}' event:`, payload);
      queryClient.invalidateQueries({ 
        queryKey: ['notifications-unread-count'],
        refetchType: 'active'
      });
    };

    const createdHandler = (payload) => handleRealtimeUpdate('notification:created', payload);
    const readHandler = (payload) => handleRealtimeUpdate('notification:read', payload);
    const markAllReadHandler = (payload) => handleRealtimeUpdate('notification:mark-all-read', payload);

    // 🔥 ORIGINAL LOGIC: Monitor socket connection status
    const handleConnect = () => {
      if (isComponentMounted) {
        console.log('🔗 TopRightControl: Socket connected');
        setIsSocketConnected(true);
        setSocketRetryCount(0);
      }
    }

    const handleDisconnect = () => {
      if (isComponentMounted) {
        console.log('❌ TopRightControl: Socket disconnected');
        setIsSocketConnected(false);
      }
    }

    const handleReconnected = () => {
      if (isComponentMounted) {
        console.log('🔄 TopRightControl: Socket reconnected');
        setIsSocketConnected(true);
        setSocketRetryCount(0);
        // Refresh unread count after reconnection
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      }
    }

    // 🔥 ORIGINAL LOGIC: ADD SOCKET LISTENERS
    notificationSocket.on('notification:created', createdHandler);
    notificationSocket.on('notification:read', readHandler);
    notificationSocket.on('notification:mark-all-read', markAllReadHandler);
    notificationSocket.on('socket:reconnected', handleReconnected);

    // Add connection listeners if socket exists
    if (notificationSocket.socket) {
      notificationSocket.socket.on('connect', handleConnect);
      notificationSocket.socket.on('disconnect', handleDisconnect);
    }

    // Check initial socket status
    const initialStatus = notificationSocket.isSocketConnected();
    if (isComponentMounted) {
      setIsSocketConnected(initialStatus);
    }

    return () => {
      isComponentMounted = false;
      
      // Clear intervals
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      
      // 🔥 ORIGINAL LOGIC: CLEANUP SOCKET LISTENERS
      notificationSocket.off('notification:created', createdHandler);
      notificationSocket.off('notification:read', readHandler);
      notificationSocket.off('notification:mark-all-read', markAllReadHandler);
      notificationSocket.off('socket:reconnected', handleReconnected);
      
      if (notificationSocket.socket) {
        notificationSocket.socket.off('connect', handleConnect);
        notificationSocket.socket.off('disconnect', handleDisconnect);
      }
      
      console.log('🧹 TopRightControl: Cleaned up listeners');
    }
  }, [queryClient])

  // 🔥 ORIGINAL LOGIC: FORCE RECONNECT FUNCTION
  const handleForceReconnect = () => {
    console.log('🔄 Force reconnecting socket...');
    notificationSocket.forceReconnect()
      .then(() => {
        console.log('✅ Force reconnect successful');
        setIsSocketConnected(true);
      })
      .catch(err => {
        console.error('❌ Force reconnect failed:', err);
        setIsSocketConnected(false);
      });
  };

  // 🔥 ORIGINAL LOGIC: SIMPLIFIED: Format badge count
  const formatBadgeCount = (count) => {
    if (isLoading || count === 0) return null
    if (count > 99) return "99+"
    return count.toString()
  }

  const displayCount = formatBadgeCount(unreadCount)

  // 🔥 ORIGINAL LOGIC: UPDATED DEBUG LOGGING with clean structure
  // console.log('🎯 TopRightControl CLEAN DEBUG:', {
  //   unreadCount: unreadCount,
  //   generalCount: unreadData?.generalCount,
  //   counselingCount: unreadData?.counselingCount,
  //   displayCount,
  //   isLoading,
  //   isSocketConnected,
  //   socketRetryCount,
  //   queryData: unreadData,
  //   unreadError: unreadError?.message || null,
  //   socketStatus: notificationSocket.getConnectionStatus(),
  //   hasToken: !!localStorage.getItem('token')
  // })

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown when navigating
  useEffect(() => {
    setOpenNotif(false);
  }, [location.pathname]);

  const handleViewAllNotifications = () => {
    setOpenNotif(false);
    const isSchool = location.pathname.includes('/organization/school');
    const isCompany = location.pathname.includes('/organization/company');
    
    if (isSchool) {
      navigate("/organization/school/notifications");
    } else if (isCompany) {
      navigate("/organization/company/notifications");
    } else {
      navigate("/notifications");
    }
  };

  const wrapperClass = isAbsolute
    ? "absolute top-[29px] right-[12px] z-50"
    : "flex justify-end w-full";

  // 🔥 ORIGINAL LOGIC: ENHANCED: Better status determination
  const getConnectionStatus = () => {
    if (isSocketConnected) return 'connected';
    if (socketRetryCount > 0) return 'retrying';
    return 'disconnected';
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className={`${wrapperClass} ${className} flex items-center gap-4 sm:gap-6`}>
      {/* Language Switch - INTEGRATED */}
      <LanguageSwitcher />

      {/* Notification Container */}
      <div className="relative" ref={notifRef}>
        <button
          aria-label="Notifications"
          onClick={() => setOpenNotif(!openNotif)}
          onDoubleClick={handleForceReconnect}
          className={`material-icons text-xl sm:text-2xl transition-colors relative inline-flex items-center justify-center ${
            connectionStatus === 'connected' 
              ? "text-zinc-500 hover:text-[#488BBE]" 
              : connectionStatus === 'retrying'
              ? "text-orange-400 hover:text-orange-500"
              : "text-red-400 hover:text-red-500"
          }`}
          title={
            connectionStatus === 'connected' 
              ? "Notifications (Connected)" 
              : connectionStatus === 'retrying'
              ? `Notifications (Retrying... ${socketRetryCount})`
              : "Notification service offline (Double-click to retry)"
          }
        >
          notifications
          
          {/* 🔥 ORIGINAL LOGIC: ENHANCED CONNECTION STATUS INDICATOR */}
          {connectionStatus !== 'connected' && (
            <span 
              className={`absolute flex items-center justify-center text-white font-bold rounded-full ${
                connectionStatus === 'retrying' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'
              }`}
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '8px',
                height: '8px',
                fontSize: '1px',
                zIndex: 10000,
              }}
              title={connectionStatus === 'retrying' ? 'Retrying...' : 'Offline'}
            />
          )}
          
          {/* 🔥 ORIGINAL LOGIC: SIMPLIFIED BADGE COUNT using generalCount */}
          {displayCount && (
            <span 
              className="absolute flex items-center justify-center text-white font-bold rounded-full bg-[#EE4266] animate-pulse"
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                minWidth: '20px',
                height: '20px',
                fontSize: '11px',
                lineHeight: '1',
                zIndex: 9999,
                textDecoration: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#EE4266',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {displayCount}
            </span>
          )}
        </button>

        {/* 🔥 ORIGINAL LOGIC: SIMPLIFIED DROPDOWN */}
        {openNotif && (
          <NotificationDropdown
            onViewAll={handleViewAllNotifications}
            onClose={() => setOpenNotif(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TopRightControl;