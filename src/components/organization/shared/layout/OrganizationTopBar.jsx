import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationsAPI } from "@/components/shared/notifications/lib/api"
import notificationSocket from "@/components/shared/notifications/lib/socket"
import NotificationDropdown from "@/components/shared/notifications/NotificationDropdown"
import { useAuth } from "../../../../hooks/useAuth"
import GlobeIcon from "../icons/GlobeIcon"
import BellIcon from "../icons/BellIcon"

const OrganizationTopBar = () => {
  const [openNotif, setOpenNotif] = useState(false)
  const [fallbackAvatar, setFallbackAvatar] = useState(false)
  const [openAvatarDropdown, setOpenAvatarDropdown] = useState(false)
  const notifRef = useRef(null)
  const avatarRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user: userData, logout } = useAuth?.() || { user: {}, logout: { mutateAsync: () => {} } }

  const { data: unreadData, isLoading } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 3,
  })

  const unreadCount = (unreadData?.generalCount || 0) + (unreadData?.counselingCount || 0)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try { await notificationSocket.connect() } catch {}
    }
    init()

    const handleUpdate = () => {
      if (!mounted) return
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"], refetchType: "active" })
    }
    const onCreated = () => handleUpdate()
    const onRead = () => handleUpdate()
    const onMarkAll = () => handleUpdate()
    const onReconnected = () => {
      if (mounted) queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
    }

    notificationSocket.on("notification:created", onCreated)
    notificationSocket.on("notification:read", onRead)
    notificationSocket.on("notification:mark-all-read", onMarkAll)
    notificationSocket.on("socket:reconnected", onReconnected)

    return () => {
      mounted = false
      notificationSocket.off("notification:created", onCreated)
      notificationSocket.off("notification:read", onRead)
      notificationSocket.off("notification:mark-all-read", onMarkAll)
      notificationSocket.off("socket:reconnected", onReconnected)
    }
  }, [queryClient])

  const handleForceReconnect = () => {
    notificationSocket.forceReconnect().catch(() => {})
  }

  const formatBadge = (count) => {
    if (isLoading || count === 0) return null
    return count > 99 ? "99+" : count.toString()
  }
  const displayCount = formatBadge(unreadCount)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotif(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setOpenAvatarDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setOpenNotif(false)
    setOpenAvatarDropdown(false)
  }, [location.pathname])

  const handleViewAllNotifications = (toFromChild) => {
    setOpenNotif(false)
    if (location.pathname.includes("/screening")) {
      const fallback = location.pathname.includes("/organization/school")
        ? "/organization/school/notifications"
        : "/organization/company/notifications"
      const to = toFromChild || fallback
      window.dispatchEvent(new CustomEvent("rd:attempt-navigation", { detail: { to } }))
      return
    }
    if (toFromChild) { navigate(toFromChild); return }
    const isSchool = location.pathname.includes("/organization/school")
    navigate(isSchool ? "/organization/school/notifications" : "/organization/company/notifications")
  }

  const getInitial = () => {
    const name = userData?.fullName || userData?.name || ""
    return name.charAt(0).toUpperCase() || "U"
  }

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #ECEEF0",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "24px 40px",
        fontFamily: "'Plus Jakarta Sans', 'Public Sans', sans-serif",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {/* Language selector (static) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "default" }}>
          <GlobeIcon size={24} color="#3F4555" />
          <span style={{ color: "#3F4555", fontSize: 16, fontWeight: 400, lineHeight: "22.4px" }}>
            Indonesia
          </span>
        </div>

        {/* Bell notification */}
        <div className="relative" ref={notifRef}>
          <button
            aria-label="Notifications"
            onClick={() => setOpenNotif(!openNotif)}
            onDoubleClick={handleForceReconnect}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#FDFEFF",
              boxShadow: "0 0 4px rgba(31,31,31,0.2)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: 0,
            }}
          >
            <BellIcon size={20} color="#0F172B" />
            {displayCount && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  right: -2,
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
              width: 44,
              height: 44,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            {userData?.profilePicture && !fallbackAvatar ? (
              <img
                src={userData.profilePicture}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => setFallbackAvatar(true)}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#D9D9D9",
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

          {openAvatarDropdown && (
            <div
              style={{
                position: "absolute",
                top: 52,
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
                  setOpenAvatarDropdown(false)
                  const isSchool = location.pathname.includes("/organization/school")
                  navigate(isSchool ? "/organization/school/profile" : "/organization/company/profile")
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
                  setOpenAvatarDropdown(false)
                  try { await logout.mutateAsync() } catch {}
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
  )
}

export default OrganizationTopBar
