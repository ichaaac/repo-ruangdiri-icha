// src/components/shared/notifications/Notifications.jsx

import { useCallback } from "react"
import { useLocation } from "react-router-dom"
import Breadcrumb from "../Breadcrumb"
import {
  LuSettings,
  LuCircleCheck,
  LuCircleAlert,
  LuOctagonAlert,
  LuBell,
  LuClock,
  LuCalendarCheck,
  LuFileText,
} from "react-icons/lu"
import { useNotifications } from "./hooks/useNotifications"

// ─── Icon Config: real API type → { Icon, bgColor, iconColor } ───────────────
const ICON_MAP = {
  schedule: {
    Icon: LuCalendarCheck,
    bgColor: "#EAFBF0",
    iconColor: "#16A34A",
  },
  system: {
    Icon: LuSettings,
    bgColor: "#EAF2FF",
    iconColor: "#155DFC",
  },
  report: {
    Icon: LuFileText,
    bgColor: "#EAF2FF",
    iconColor: "#488BBE",
  },
  counseling: {
    Icon: LuCircleCheck,
    bgColor: "#F3F0FF",
    iconColor: "#9986ff",
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
  default: {
    Icon: LuBell,
    bgColor: "#EAF2FF",
    iconColor: "#155DFC",
  },
}

const getIconConfig = (notification) => {
  if (notification.subType === "counseling") return ICON_MAP.counseling
  return ICON_MAP[notification.type] || ICON_MAP.default
}

const isNotifRead = (n) => n.status === "read" || n.isRead || !!n.readAt

// ─── NotificationIcon ────────────────────────────────────────────────────────
const NotificationIcon = ({ notification }) => {
  const { Icon, bgColor, iconColor } = getIconConfig(notification)
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
const NotificationItem = ({ notification, onMarkAsRead, formatTimeAgo, isMarkingAsRead }) => {
  const isRead = isNotifRead(notification)

  const handleClick = () => {
    if (!isRead && !isMarkingAsRead) onMarkAsRead(notification.id)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        minHeight: 72,
        backgroundColor: isRead ? "#FFFFFF" : "#F4F7FF",
        cursor: isRead ? "default" : "pointer",
        transition: "background-color 0.15s ease",
        gap: 16,
        opacity: isMarkingAsRead ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isRead) e.currentTarget.style.backgroundColor = "#EDF3FF"
      }}
      onMouseLeave={(e) => {
        if (!isRead) e.currentTarget.style.backgroundColor = "#F4F7FF"
      }}
    >
      <NotificationIcon notification={notification} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: isRead ? "#6F7480" : "#0B0F1A",
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "#6F7480",
              lineHeight: 1.4,
              margin: "4px 0 0 0",
            }}
          >
            {notification.message}
          </p>
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginLeft: 16,
        }}
      >
        {!isRead && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#488BBE",
              flexShrink: 0,
            }}
          />
        )}
        <LuClock size={16} strokeWidth={2} color="#6F7480" />
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "#6F7480",
            whiteSpace: "nowrap",
          }}
        >
          {formatTimeAgo(notification.createdAt)}
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

const NotificationTabs = ({ selectedTab, onTabChange, hasUnread, onMarkAllRead, isMarkingAllAsRead }) => (
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

    {hasUnread && (
      <button
        onClick={onMarkAllRead}
        disabled={isMarkingAllAsRead}
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#E8655B",
          background: "none",
          border: "none",
          cursor: isMarkingAllAsRead ? "not-allowed" : "pointer",
          padding: "14px 0",
          opacity: isMarkingAllAsRead ? 0.5 : 1,
          transition: "opacity 0.15s ease",
          fontFamily: "inherit",
        }}
      >
        {isMarkingAllAsRead ? "Memproses..." : "Sudah dibaca semua"}
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

// ─── Loading State ────────────────────────────────────────────────────────────
const LoadingState = () => (
  <div style={{ textAlign: "center", padding: "48px 24px" }}>
    <p style={{ color: "#6F7480", fontSize: 15 }}>Memuat notifikasi...</p>
  </div>
)

// ─── Error State ──────────────────────────────────────────────────────────────
const ErrorState = ({ onRetry }) => (
  <div style={{ textAlign: "center", padding: "48px 24px" }}>
    <p style={{ color: "#EF4444", fontSize: 15, marginBottom: 12 }}>
      Gagal memuat notifikasi.
    </p>
    <button
      onClick={onRetry}
      style={{
        fontSize: 14,
        color: "#155DFC",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      Coba lagi
    </button>
  </div>
)

// ═════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════════
const Notifications = () => {
  const location = useLocation()
  const basePath = location.pathname.replace(/\/notifications$/, "")

  const {
    groupedNotifications,
    unreadCount,
    counselingCount,
    selectedTab,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    handleTabChange,
    handleMarkAsRead,
    handleMarkAllAsRead,
    fetchNextPage,
    getDateLabel,
    formatTimeAgo,
    isMarkingAsRead,
    isMarkingAllAsRead,
    refetchNotifications,
  } = useNotifications()

  const hasUnread = (unreadCount + counselingCount) > 0

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "'Plus Jakarta Sans', 'Public Sans', sans-serif",
      }}
    >
      <div style={{ padding: "32px 40px 40px 40px" }}>
        <Breadcrumb items={[
          { label: "Dashboard", to: `${basePath}/dashboard` },
          { label: "Notifikasi" },
        ]} />

        <h1 style={{ fontSize: 24, fontWeight: 500, color: "#0B0F1A", margin: "0 0 6px 0" }}>
          Notifikasi
        </h1>
        <p style={{ fontSize: 15, fontWeight: 400, color: "#6F7480", margin: "0 0 32px 0", lineHeight: 1.5 }}>
          Pantau pembaruan penting seputar skrining, konseling, dan aktivitas siswa secara real-time.
        </p>

        <div
          style={{
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          }}
        >
          <NotificationTabs
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            hasUnread={hasUnread}
            onMarkAllRead={handleMarkAllAsRead}
            isMarkingAllAsRead={isMarkingAllAsRead}
          />

          <div>
            {isLoading ? (
              <LoadingState />
            ) : isError ? (
              <ErrorState onRetry={refetchNotifications} />
            ) : Object.keys(groupedNotifications).length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {Object.entries(groupedNotifications).map(([dateKey, notifs]) => (
                  <div key={dateKey}>
                    {/* Date group label */}
                    <div
                      style={{
                        padding: "8px 20px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#6F7480",
                        backgroundColor: "#F8FAFC",
                        borderBottom: "1px solid #ECEEF0",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {getDateLabel(dateKey)}
                    </div>

                    {notifs.map((notification, index) => (
                      <div key={notification.id}>
                        {index > 0 && (
                          <div style={{ height: 1, backgroundColor: "#ECEEF0" }} />
                        )}
                        <NotificationItem
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          formatTimeAgo={formatTimeAgo}
                          isMarkingAsRead={isMarkingAsRead}
                        />
                      </div>
                    ))}
                  </div>
                ))}

                {hasNextPage && (
                  <div style={{ padding: "16px 20px", textAlign: "center", borderTop: "1px solid #ECEEF0" }}>
                    <button
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#155DFC",
                        background: "none",
                        border: "none",
                        cursor: isFetchingNextPage ? "not-allowed" : "pointer",
                        opacity: isFetchingNextPage ? 0.5 : 1,
                        fontFamily: "inherit",
                      }}
                    >
                      {isFetchingNextPage ? "Memuat..." : "Muat lebih banyak"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
