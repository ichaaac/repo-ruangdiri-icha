// src/components/shared/layout/TopRightControl.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "@/components/shared/notifications/lib/api";
import notificationSocket from "@/components/shared/notifications/lib/socket";
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown";
import PushNotificationBanner from "@/components/shared/notifications/PushNotificationBanner";
import { LuBell, LuHeadphones } from "react-icons/lu";
import { useAuth } from "../../../hooks/useAuth";

const TopRightControl = ({ transparent = false }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketRetryCount, setSocketRetryCount] = useState(0);
  const [fallbackAvatar, setFallbackAvatar] = useState(false);
  const [openAvatarDropdown, setOpenAvatarDropdown] = useState(false);
  const notifRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user: userData, getUserRole, logout } = useAuth?.() || { user: {}, getUserRole: () => null, logout: { mutateAsync: () => {} } };

  // ── Unread count query ──────────────────────────────────────────────────
  const { data: unreadData, isLoading } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 3,
  });

  const unreadCount =
    (unreadData?.generalCount || 0) + (unreadData?.counselingCount || 0);

  // ── Socket setup ────────────────────────────────────────────────────────
  useEffect(() => {
    let isComponentMounted = true;
    let statusCheckInterval = null;

    const initializeSocket = async () => {
      try {
        await notificationSocket.connect();
        if (isComponentMounted) {
          setIsSocketConnected(true);
          setSocketRetryCount(0);
        }
      } catch {
        if (isComponentMounted) {
          setIsSocketConnected(false);
          setSocketRetryCount((prev) => prev + 1);
        }
      }
    };

    initializeSocket();

    statusCheckInterval = setInterval(() => {
      if (isComponentMounted) {
        const actualStatus = notificationSocket.isSocketConnected();
        setIsSocketConnected((prev) => {
          if (prev !== actualStatus) return actualStatus;
          return prev;
        });
      }
    }, 5000);

    const handleRealtimeUpdate = () => {
      if (!isComponentMounted) return;
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
        refetchType: "active",
      });
    };

    const createdHandler = () => handleRealtimeUpdate();
    const readHandler = () => handleRealtimeUpdate();
    const markAllReadHandler = () => handleRealtimeUpdate();

    const handleConnect = () => {
      if (isComponentMounted) {
        setIsSocketConnected(true);
        setSocketRetryCount(0);
      }
    };
    const handleDisconnect = () => {
      if (isComponentMounted) setIsSocketConnected(false);
    };
    const handleReconnected = () => {
      if (isComponentMounted) {
        setIsSocketConnected(true);
        setSocketRetryCount(0);
        queryClient.invalidateQueries({
          queryKey: ["notifications-unread-count"],
        });
      }
    };

    notificationSocket.on("notification:created", createdHandler);
    notificationSocket.on("notification:read", readHandler);
    notificationSocket.on("notification:mark-all-read", markAllReadHandler);
    notificationSocket.on("socket:reconnected", handleReconnected);

    if (notificationSocket.socket) {
      notificationSocket.socket.on("connect", handleConnect);
      notificationSocket.socket.on("disconnect", handleDisconnect);
    }

    return () => {
      isComponentMounted = false;
      if (statusCheckInterval) clearInterval(statusCheckInterval);
      notificationSocket.off("notification:created", createdHandler);
      notificationSocket.off("notification:read", readHandler);
      notificationSocket.off("notification:mark-all-read", markAllReadHandler);
      notificationSocket.off("socket:reconnected", handleReconnected);
      if (notificationSocket.socket) {
        notificationSocket.socket.off("connect", handleConnect);
        notificationSocket.socket.off("disconnect", handleDisconnect);
      }
    };
  }, [queryClient]);

  // ── Force reconnect ─────────────────────────────────────────────────────
  const handleForceReconnect = () => {
    notificationSocket
      .forceReconnect()
      .then(() => setIsSocketConnected(true))
      .catch(() => setIsSocketConnected(false));
  };

  // ── Badge format ────────────────────────────────────────────────────────
  const formatBadgeCount = (count) => {
    if (isLoading || count === 0) return null;
    if (count > 99) return "99+";
    return count.toString();
  };
  const displayCount = formatBadgeCount(unreadCount);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotif(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setOpenAvatarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close dropdowns on route change ─────────────────────────────────────
  useEffect(() => {
    setOpenNotif(false);
    setOpenAvatarDropdown(false);
  }, [location.pathname]);

  // ── View all handler ────────────────────────────────────────────────────
  const handleViewAllNotifications = (toFromChild) => {
    setOpenNotif(false);
    if (location.pathname.includes("/screening")) {
      const fallback = (() => {
        const path = location.pathname;
        if (path.includes("/organization/school"))
          return "/organization/school/notifications";
        if (path.includes("/organization/company"))
          return "/organization/company/notifications";
        return "/notifications";
      })();
      const to = toFromChild || fallback;
      window.dispatchEvent(
        new CustomEvent("rd:attempt-navigation", { detail: { to } })
      );
      return;
    }
    if (toFromChild) {
      navigate(toFromChild);
      return;
    }
    const isSchool = location.pathname.includes("/organization/school");
    const isCompany = location.pathname.includes("/organization/company");
    if (isSchool) navigate("/organization/school/notifications");
    else if (isCompany) navigate("/organization/company/notifications");
    else navigate("/notifications");
  };

  // ── Avatar helper ───────────────────────────────────────────────────────
  const getInitial = () => {
    const name = userData?.fullName || userData?.name || "";
    return name.charAt(0).toUpperCase() || "U";
  };

  return (
    <>
    <PushNotificationBanner userId={userData?.id} />
    <div
      style={{
        width: "100%",
        height: 64,
        backgroundColor: transparent ? "transparent" : "#FFFFFF",
        borderBottom: transparent ? "none" : "1px solid #ECEEF0",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 40px",
        fontFamily: "'Plus Jakarta Sans', 'Public Sans', sans-serif",
        position: "sticky",
        top: 0,
        zIndex: 60,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, height: 48 }}>
        {/* Support link */}
        <button
          onClick={() => {}}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#0F172B",
            fontSize: 14,
            fontWeight: 500,
            padding: "12px 0",
            height: 48,
          }}
        >
          <LuHeadphones size={20} strokeWidth={2} />
          <span>Support</span>
        </button>

        {/* Bell button */}
        <div className="relative" ref={notifRef}>
          <button
            aria-label="Notifications"
            onClick={() => setOpenNotif(!openNotif)}
            onDoubleClick={handleForceReconnect}
            style={{
              width: 48,
              height: 48,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 8px",
              position: "relative",
            }}
          >
            <LuBell size={20} strokeWidth={2} color="#0F172B" />

            {/* Badge count */}
            {displayCount && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9999,
                  backgroundColor: "#EE4266",
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  lineHeight: 1,
                }}
              >
                {displayCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {openNotif && (
            <NotificationDropdown
              onViewAll={handleViewAllNotifications}
              onClose={() => setOpenNotif(false)}
            />
          )}
        </div>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={avatarRef}>
          <div
            onClick={() => setOpenAvatarDropdown((prev) => !prev)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 100,
              overflow: "hidden",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            {(userData?.profilePictureUrl || userData?.profilePicture) && !fallbackAvatar ? (
              <img
                src={userData.profilePictureUrl || userData.profilePicture}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={() => setFallbackAvatar(true)}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#488BBE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {getInitial()}
              </div>
            )}
          </div>

          {/* Avatar Dropdown */}
          {openAvatarDropdown && (
            <div
              style={{
                position: "absolute",
                top: 56,
                right: 0,
                width: 200,
                backgroundColor: "#FFFFFF",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                border: "1px solid #ECEEF0",
                zIndex: 50,
                overflow: "hidden",
                fontFamily: "'Plus Jakarta Sans', 'Public Sans', sans-serif",
              }}
            >
              <button
                onClick={() => {
                  const role = getUserRole() || "student";
                  setOpenAvatarDropdown(false);
                  navigate(`/user/${role}/profile`);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#0F172B",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span className="material-icons" style={{ fontSize: 18, color: "#64748B" }}>person</span>
                Profil
              </button>
              <div style={{ height: 1, backgroundColor: "#ECEEF0" }} />
              <button
                onClick={async () => {
                  setOpenAvatarDropdown(false);
                  try {
                    await logout.mutateAsync();
                  } catch {
                    // logout handled by useAuth onSettled
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#EF4444",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span className="material-icons" style={{ fontSize: 18, color: "#EF4444" }}>logout</span>
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default TopRightControl;
