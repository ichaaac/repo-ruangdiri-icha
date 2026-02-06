// src/components/shared/notifications/Notifications.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// REVAMPED Notification Page — UI uses MOCK DATA for now.
// Old API integration is COMMENTED OUT below. Uncomment when ready to integrate.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import {
  LuSettings,
  LuCircleCheck,
  LuCircleAlert,
  LuOctagonAlert,
  LuBell,
  LuClock,
} from "react-icons/lu"

// ╔═══════════════════════════════════════════════════════════════════════════════
// ║ OLD INTEGRATION — COMMENTED OUT (uncomment when API is ready)
// ╚═══════════════════════════════════════════════════════════════════════════════
// import { useNotifications } from "./hooks/useNotifications"

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Berhasil Mengubah Password",
    description: "Anda berhasil mengubah password login pada akun ini",
    type: "settings",
    isRead: false,
    timeLabel: "10 menit yang lalu",
    category: "all",
  },
  {
    id: "2",
    title: "Konseling Selesai",
    description: "Sesi konseling dengan Eberto telah selesai",
    type: "success",
    isRead: false,
    timeLabel: "20 menit yang lalu",
    category: "counseling",
  },
  {
    id: "3",
    title: "Konseling Tertunda",
    description: "Sesi konseling dengan Conman telah ditunda hingga pemberitahuan lebih lanjut",
    type: "warning",
    isRead: false,
    timeLabel: "1 jam yang lalu",
    category: "counseling",
  },
  {
    id: "4",
    title: "Siswa Membutuhkan Perhatian",
    description: "Terdapat siswa dengan hasil skrining yang perlu ditindaklanjuti.",
    type: "danger",
    isRead: false,
    timeLabel: "Kemarin, 19.00",
    category: "all",
  },
  {
    id: "5",
    title: "Permintaan Konseling",
    description: "Berthold mengajukan permintaan sesi konseling pribadi",
    type: "request",
    isRead: true,
    timeLabel: "Rabu 19 Jan 2026, 19.00",
    category: "counseling",
  },
]

// ─── Icon Config: type → { Icon, bgColor, iconColor } ───────────────────────
const ICON_MAP = {
  settings: {
    Icon: LuSettings,
    bgColor: "#EAF2FF",
    iconColor: "#155DFC",
  },
  success: {
    Icon: LuCircleCheck,
    bgColor: "#EAFBF0",
    iconColor: "#16A34A",
  },
  warning: {
    Icon: LuCircleAlert,
    bgColor: "#FFF4E5",
    iconColor: "#F59E0B",
  },
  danger: {
    Icon: LuOctagonAlert,
    bgColor: "#FFECEE",
    iconColor: "#EF4444",
  },
  request: {
    Icon: LuBell,
    bgColor: "#EAF2FF",
    iconColor: "#155DFC",
  },
}

const getIconConfig = (type) => ICON_MAP[type] || ICON_MAP.request

// ─── NotificationIcon ────────────────────────────────────────────────────────
const NotificationIcon = ({ type }) => {
  const { Icon, bgColor, iconColor } = getIconConfig(type)
  return (
    <div
      style={{
        width: 44,
        height: 44,
        minWidth: 44,
        borderRadius: 9999,
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={20} strokeWidth={2} color={iconColor} />
    </div>
  )
}

// ─── NotificationItem ────────────────────────────────────────────────────────
const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { id, title, description, type, isRead, timeLabel } = notification
  const [hovered, setHovered] = useState(false)

  const handleClick = () => {
    if (!isRead) onMarkAsRead(id)
  }

  const getBgColor = () => {
    if (isRead) return hovered ? "#F8FAFC" : "#FFFFFF"
    return hovered ? "#EDF3FF" : "#F4F7FF"
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        minHeight: 72,
        backgroundColor: getBgColor(),
        cursor: isRead ? "default" : "pointer",
        transition: "background-color 0.15s ease",
        gap: 16,
      }}
    >
      {/* Circle icon */}
      <NotificationIcon type={type} />

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: "#0B0F1A",
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "#6F7480",
            lineHeight: 1.4,
            margin: "4px 0 0 0",
          }}
        >
          {description}
        </p>
      </div>

      {/* Timestamp */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginLeft: 16,
        }}
      >
        <LuClock size={16} strokeWidth={2} color="#6F7480" />
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "#6F7480",
            whiteSpace: "nowrap",
          }}
        >
          {timeLabel}
        </span>
      </div>
    </div>
  )
}

// ─── NotificationTabs ────────────────────────────────────────────────────────
const TAB_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "counseling", label: "Konseling" },
]

const NotificationTabs = ({ selectedTab, onTabChange, hasUnread, onMarkAllRead }) => (
  <div
    style={{
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-between",
      borderBottom: "1px solid #ECEEF0",
      paddingLeft: 0,
      paddingRight: 20,
    }}
  >
    {/* Tab buttons — no left padding so active bg touches card edge */}
    <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
      {TAB_OPTIONS.map(({ key, label }) => {
        const isActive = selectedTab === key
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              padding: "14px 24px",
              fontSize: 16,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "#155DFC" : "#0F172B",
              background: isActive ? "#F4F7FF" : "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid #155DFC" : "2px solid transparent",
              cursor: "pointer",
              transition: "color 0.15s ease, background-color 0.15s ease",
              marginBottom: -1,
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        )
      })}
    </div>

    {/* Mark all as read */}
    {hasUnread && (
      <button
        onClick={onMarkAllRead}
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#E8655B",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "14px 0",
          transition: "opacity 0.15s ease",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Sudah dibaca semua
      </button>
    )}
  </div>
)

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div style={{ textAlign: "center", padding: "48px 24px" }}>
    <LuBell size={40} strokeWidth={1.5} color="#CBD5E1" />
    <p style={{ color: "#6F7480", fontSize: 15, marginTop: 12 }}>
      Tidak ada notifikasi
    </p>
  </div>
)

// ═════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════════
const Notifications = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (() => {
    const tab = (searchParams.get("tab") || "").toLowerCase()
    return tab === "counseling" ? "counseling" : "all"
  })()

  const [selectedTab, setSelectedTab] = useState(initialTab)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  // ── Tab handler (syncs URL query param) ──────────────────────────────────
  const handleTabChange = useCallback(
    (tab) => {
      setSelectedTab(tab)
      try {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set("tab", tab)
            return next
          },
          { replace: true }
        )
      } catch {
        // ignore navigation errors
      }
    },
    [setSearchParams]
  )

  // ── Mark single as read ──────────────────────────────────────────────────
  const handleMarkAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }, [])

  // ── Mark all as read ─────────────────────────────────────────────────────
  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  // ── Filtered list by tab ─────────────────────────────────────────────────
  const filteredNotifications =
    selectedTab === "counseling"
      ? notifications.filter((n) => n.category === "counseling")
      : notifications

  const hasUnread = notifications.some((n) => !n.isRead)

  // ╔═════════════════════════════════════════════════════════════════════════════
  // ║ OLD INTEGRATION — COMMENTED OUT (uncomment when API is ready)
  // ║
  // ║ const {
  // ║   groupedNotifications,
  // ║   totalCount,
  // ║   unreadCount,
  // ║   counselingCount,
  // ║   selectedTab,
  // ║   isLoading,
  // ║   isError,
  // ║   error,
  // ║   hasNextPage,
  // ║   isFetchingNextPage,
  // ║   handleTabChange,
  // ║   handleMarkAsRead,
  // ║   handleMarkAllAsRead,
  // ║   fetchNextPage,
  // ║   getDateLabel,
  // ║   formatTimeAgo,
  // ║   formatCount,
  // ║   isMarkingAsRead,
  // ║   isMarkingAllAsRead,
  // ║ } = useNotifications();
  // ║
  // ║ const totalUnreadAllCount = unreadCount + counselingCount;
  // ╚═════════════════════════════════════════════════════════════════════════════

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "'Plus Jakarta Sans', 'Public Sans', sans-serif",
      }}
    >
      <div style={{ padding: "32px 40px 40px 40px" }}>
        {/* ── Breadcrumb ───────────────────────────────────────────────── */}
        <nav style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 400, color: "#6F7480" }}>
            Dashboard
          </span>
          <span style={{ fontSize: 15, color: "#6F7480" }}>/</span>
          <span style={{ fontSize: 15, fontWeight: 500, color: "#E8655B" }}>
            Notifikasi
          </span>
        </nav>

        {/* ── Heading ──────────────────────────────────────────────────── */}
        <h1 style={{ fontSize: 24, fontWeight: 500, color: "#0B0F1A", margin: "0 0 6px 0" }}>
          Notifikasi
        </h1>
        <p style={{ fontSize: 15, fontWeight: 400, color: "#6F7480", margin: "0 0 32px 0", lineHeight: 1.5 }}>
          Pantau pembaruan penting seputar skrining, konseling, dan aktivitas siswa secara real-time.
        </p>

        {/* ── Card container ───────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Tabs */}
          <NotificationTabs
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            hasUnread={hasUnread}
            onMarkAllRead={handleMarkAllAsRead}
          />

          {/* Notification list */}
          <div>
            {filteredNotifications.length === 0 ? (
              <EmptyState />
            ) : (
              filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  {index > 0 && (
                    <div
                      style={{
                        height: 1,
                        backgroundColor: "#ECEEF0",
                      }}
                    />
                  )}
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
