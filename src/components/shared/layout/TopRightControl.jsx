// src/components/shared/layout/TopRightControl.jsx - FINAL FIXED VERSION

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query"; // 1. Import useQuery
import notificationsAPI from "@/components/shared/notifications/lib/api"; // 2. Import API
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown";

const TopRightControl = ({ className = "", isAbsolute = true }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 3. 🔥 AMBIL DATA LANGSUNG, JANGAN LEWAT HOOK
  // Ini membuat komponen mandiri dan hanya mengambil data yang dibutuhkan.
  const { data: unreadData, isLoading: isCountLoading } = useQuery({
    queryKey: ['notifications-unread-count'], // Kunci query yang sama untuk caching
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: 15000, // Konsisten dengan hook lain
    refetchInterval: 15000, // Agar data tetap fresh
    keepPreviousData: true, // Memastikan data sebelumnya tetap ada saat loading
  });

  // 4. Proses data langsung dari hasil query
  const unreadCount = parseInt(unreadData?.count, 10) || 0;

  // 5. Fungsi format sekarang menggunakan status loading-nya sendiri
  const formatUnreadCount = (count) => {
    if (isCountLoading || !count || count === 0) return null;
    if (count > 99) return "99+";
    return count.toString();
  };

  const displayCount = formatUnreadCount(unreadCount);
  // const

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
    ? "absolute top-[29px] right-[12px]"
    : "flex justify-end w-full";

  return (
    <div className={`${wrapperClass} ${className} flex items-center gap-4 sm:gap-6`}>
      {/* Language Switch */}
      <div className="flex items-center">
        <span className="font-bold text-primary text-sm sm:text-base">ID</span>
        <span className="mx-2 text-primary text-sm sm:text-base">/</span>
        <span className="text-zinc-500 text-sm sm:text-base">EN</span>
      </div>

      {/* Notification Container */}
      <div className="relative" ref={notifRef}>
        <button
          aria-label="Notifications"
          onClick={() => setOpenNotif(!openNotif)}
          className="material-icons text-zinc-500 text-xl sm:text-2xl hover:text-[#488BBE] transition-colors relative"
        >
          notifications
          
          {/* Badge indicator sekarang akan bekerja dengan benar */}
          {displayCount && (
            <span className="absolute top-0 -right-1 w-6 h-[11px] bg-[#EE4266] text-white text-[8px] font-bold rounded-xl flex items-center justify-center transform-gpu">
              {displayCount}
            </span>
          )}
        </button>

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