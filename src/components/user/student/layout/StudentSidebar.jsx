import { useState, useEffect, useRef, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useChats } from "../../../shared/chats/hooks/useChats"

const EXPANDED_W = 280
const COLLAPSED_W = 60

const MENU_ITEMS_BY_ROLE = {
  student: [
    { label: "Dashboard", icon: "dashboard_customize", path: "/user/student/dashboard" },
    { label: "Pesan", icon: "chat_bubble_outline", path: "/user/student/chat", hasUnreadBadge: true },
  ],
  employee: [
    { label: "Dashboard", icon: "dashboard_customize", path: "/user/employee/dashboard" },
    { label: "Pesan", icon: "chat_bubble_outline", path: "/user/employee/chat", hasUnreadBadge: true },
  ],
  client: [
    { label: "Dashboard", icon: "dashboard_customize", path: "/user/client/dashboard" },
    { label: "Pesan", icon: "chat_bubble_outline", path: "/user/client/chat", hasUnreadBadge: true },
  ],
  school: [
    { label: "Dashboard", icon: "bar_chart", path: "/organization/school/dashboard", hasDropdown: true, dropdownItems: [
      { label: "Dashboard Home", path: "/organization/school/dashboard" },
      { label: "Dashboard Tab Laporan", path: "/organization/school/detail-laporan" },
    ]},
    { label: "Daftar Siswa", icon: "table_chart", path: "/organization/school/student-list" },
    { label: "Jadwal", icon: "calendar_month", path: "/organization/school/schedule" },
    { label: "Pengaturan", icon: "brightness_5", path: "/organization/school/profile" },
  ],
  company: [
    { label: "Dashboard", icon: "bar_chart", path: "/organization/company/dashboard", hasDropdown: true, dropdownItems: [
      { label: "Dashboard Home", path: "/organization/company/dashboard" },
      { label: "Dashboard Tab Laporan", path: "/organization/company/detail-laporan" },
    ]},
    { label: "Daftar Karyawan", icon: "table_chart", path: "/organization/company/employee-list" },
    { label: "Jadwal", icon: "calendar_month", path: "/organization/company/schedule" },
    { label: "Pengaturan", icon: "brightness_5", path: "/organization/company/profile" },
  ],
}

const LOGO_BY_ROLE = {
  student: { src: "/logo/sekolahku.png", alt: "Sekolahku" },
  employee: { src: "/logo/ruang-diri-logo.svg", alt: "Ruang Diri" },
  client: { src: "/logo/ruang-diri-logo.svg", alt: "Ruang Diri" },
  school: { src: "/logo/sekolahku.png", alt: "Sekolahku" },
  company: { src: "/logo/sekolahku.png", alt: "Sekolahku" },
}

const SECTION_LABEL_BY_ROLE = {
  student: "Asesmen Ruang Diri",
  employee: "Asesmen Ruang Diri",
  client: "Asesmen Ruang Diri",
  school: "Menu Sekolah",
  company: "Menu Perusahaan",
}

const StudentSidebar = ({
  expanded,
  setExpanded,
  onHoverChange,
  isMobile = false,
  userType = "student",
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalUnreadCount, serverTotalUnreadCount } = useChats()

  const [hovered, setHovered] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(true)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const expandTimeoutRef = useRef(null)
  const collapseTimeoutRef = useRef(null)
  const sidebarRef = useRef(null)
  const hoverAreaRef = useRef(null)

  const isOpen = expanded || hovered
  const sidebarWidth = isOpen ? EXPANDED_W : COLLAPSED_W

  const menuItems = useMemo(() => MENU_ITEMS_BY_ROLE[userType] || MENU_ITEMS_BY_ROLE.student, [userType])

  const displayUnreadCount = useMemo(() => {
    const count = totalUnreadCount || serverTotalUnreadCount || 0
    return count > 99 ? "99+" : count > 0 ? count.toString() : null
  }, [totalUnreadCount, serverTotalUnreadCount])

  const isActive = (path) => {
    if (path.includes("/dashboard")) return location.pathname.includes("/dashboard")
    return location.pathname === path
  }

  const handleMenuItemClick = (item) => {
    if (location.pathname.includes("/screening") && !item.path.includes("/screening")) {
      window.dispatchEvent(new CustomEvent("rd:attempt-navigation", { detail: { to: item.path } }))
      return
    }
    navigate(item.path)
    if (isMobile) setExpanded(false)
  }

  const handleHoverEnter = () => {
    if (!expanded && !isMobile) {
      clearTimeout(collapseTimeoutRef.current)
      expandTimeoutRef.current = setTimeout(() => {
        setHovered(true)
        onHoverChange?.(true)
      }, 100)
    }
  }

  const handleHoverLeave = () => {
    if (!expanded && !isMobile) {
      clearTimeout(expandTimeoutRef.current)
      collapseTimeoutRef.current = setTimeout(() => {
        setHovered(false)
        onHoverChange?.(false)
      }, 300)
    }
  }

  const toggleSidebar = () => {
    setExpanded(!expanded)
    onHoverChange?.(!expanded)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current && !sidebarRef.current.contains(event.target) &&
        (!hoverAreaRef.current || !hoverAreaRef.current.contains(event.target)) &&
        expanded && !isMobile
      ) {
        setExpanded(false)
        onHoverChange?.(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      clearTimeout(expandTimeoutRef.current)
      clearTimeout(collapseTimeoutRef.current)
    }
  }, [expanded, isMobile, setExpanded, onHoverChange])

  return (
    <>
      <motion.div
        ref={sidebarRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          background: "#FFFFFF",
          borderRight: "1px solid #ECEEF0",
          zIndex: 40,
          overflow: "visible",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        onMouseEnter={() => { document.body.style.overflow = "hidden" }}
        onMouseLeave={() => { document.body.style.overflow = "" }}
      >
        {/* ── Collapse / Expand toggle ─────────────────────────── */}
        <button
          onClick={toggleSidebar}
          title={isOpen ? "Tutup sidebar" : "Buka sidebar"}
          style={{
            position: "absolute",
            top: 36,
            right: -14,
            width: 28,
            height: 28,
            borderRadius: 9999,
            border: "1px solid #E2E8F0",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 50,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            padding: 0,
          }}
        >
          <span
            className="material-icons-outlined"
            style={{ fontSize: 16, color: "#475569" }}
          >
            {isOpen ? "chevron_left" : "chevron_right"}
          </span>
        </button>

        {/* ── Inner content (clipped) ──────────────────────────── */}
        <div
          style={{
            overflow: "hidden",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
        >
          {/* ── Logo ── */}
          <div
            style={{
              paddingTop: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: isOpen ? "flex-start" : "center",
              paddingLeft: isOpen ? 20 : 0,
              flexShrink: 0,
              minHeight: isOpen ? 80 : 60,
              transition: "padding-left 250ms ease, min-height 250ms ease",
            }}
          >
            <img
              src={LOGO_BY_ROLE[userType]?.src || LOGO_BY_ROLE.student.src}
              alt={LOGO_BY_ROLE[userType]?.alt || LOGO_BY_ROLE.student.alt}
              style={{
                height: isOpen ? 52 : 36,
                width: "auto",
                objectFit: "contain",
                transition: "height 250ms ease",
              }}
            />
          </div>

          {/* ── Gap between logo and section ── */}
          <div style={{ height: 32, flexShrink: 0 }} />

          {/* ── Section header: Asesmen Ruang Diri ── */}
          <div
            onClick={() => setSectionOpen((prev) => !prev)}
            style={{
              margin: isOpen ? "0 16px" : "0 6px",
              padding: isOpen ? "10px 14px" : "10px 0",
              background: "#EBF5FF",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: isOpen ? 10 : 0,
              cursor: "pointer",
              justifyContent: isOpen ? "flex-start" : "center",
              flexShrink: 0,
              minHeight: 46,
              transition: "margin 250ms ease, padding 250ms ease",
            }}
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: 24, color: "#E8655B", flexShrink: 0 }}
            >
              person
            </span>
            <span
              style={{
                overflow: "hidden",
                whiteSpace: "nowrap",
                opacity: isOpen ? 1 : 0,
                maxWidth: isOpen ? 180 : 0,
                transition: "opacity 200ms ease, max-width 250ms ease",
                fontSize: 15,
                fontWeight: 600,
                color: "#E8655B",
                flex: 1,
              }}
            >
              {SECTION_LABEL_BY_ROLE[userType] || "Asesmen Ruang Diri"}
            </span>
            <span
              className="material-icons-outlined"
              style={{
                fontSize: 22,
                color: "#E8655B",
                flexShrink: 0,
                overflow: "hidden",
                opacity: isOpen ? 1 : 0,
                maxWidth: isOpen ? 24 : 0,
                transition: "opacity 200ms ease, max-width 250ms ease",
              }}
            >
              {sectionOpen ? "expand_less" : "expand_more"}
            </span>
          </div>

          {/* ── Menu items ── */}
          <AnimatePresence initial={false}>
            {(sectionOpen || !isOpen) && (
              <motion.div
                key="menu-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden", flexShrink: 0 }}
              >
                <div
                  style={{
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {menuItems.map((item, idx) => {
                    const active = isActive(item.path)
                    return (
                      <div key={idx}>
                        <div
                          onClick={() => {
                            if (item.hasDropdown) {
                              setActiveDropdown(activeDropdown === item.path ? null : item.path)
                            } else {
                              handleMenuItemClick(item)
                            }
                          }}
                          title={!isOpen ? item.label : undefined}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: 46,
                            marginLeft: isOpen ? 16 : 4,
                            marginRight: isOpen ? 16 : 4,
                            paddingLeft: isOpen ? 16 : 0,
                            paddingRight: isOpen ? 12 : 0,
                            gap: isOpen ? 10 : 0,
                            cursor: "pointer",
                            borderLeft: active
                              ? "4px solid #E8655B"
                              : "4px solid transparent",
                            position: "relative",
                            justifyContent: isOpen ? "flex-start" : "center",
                            transition:
                              "margin 250ms ease, padding 250ms ease, background-color 150ms ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!active)
                              e.currentTarget.style.backgroundColor = "#F8FAFC"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent"
                          }}
                        >
                          <span
                            className="material-icons-outlined"
                            style={{
                              fontSize: 22,
                              color: active ? "#E8655B" : "#64748B",
                              flexShrink: 0,
                              width: 24,
                              textAlign: "center",
                            }}
                          >
                            {item.icon}
                          </span>

                          <span
                            style={{
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              opacity: isOpen ? 1 : 0,
                              maxWidth: isOpen ? 180 : 0,
                              transition:
                                "opacity 200ms ease, max-width 250ms ease",
                              fontSize: 15,
                              fontWeight: active ? 600 : 500,
                              color: active ? "#E8655B" : "#1E293B",
                              flex: 1,
                            }}
                          >
                            {item.label}
                          </span>

                          {item.hasDropdown && isOpen && (
                            <span
                              className="material-icons-outlined"
                              style={{
                                fontSize: 18,
                                color: active ? "#E8655B" : "#64748B",
                                flexShrink: 0,
                              }}
                            >
                              {activeDropdown === item.path ? "expand_less" : "expand_more"}
                            </span>
                          )}

                          {item.hasUnreadBadge && displayUnreadCount && (
                            <span
                              style={{
                                position: "absolute",
                                top: 4,
                                right: isOpen ? 12 : -4,
                                minWidth: 20,
                                height: 20,
                                borderRadius: 9999,
                                backgroundColor: "#EE4266",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 4px",
                                border: "2px solid #fff",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                              }}
                            >
                              {displayUnreadCount}
                            </span>
                          )}
                        </div>

                        {/* Dropdown sub-items */}
                        <AnimatePresence>
                          {item.hasDropdown && activeDropdown === item.path && isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: "hidden" }}
                            >
                              {item.dropdownItems.map((sub, subIdx) => {
                                const subActive = location.pathname === sub.path
                                return (
                                  <div
                                    key={subIdx}
                                    onClick={() => {
                                      navigate(sub.path)
                                      if (isMobile) setExpanded(false)
                                    }}
                                    style={{
                                      paddingLeft: 60,
                                      paddingRight: 16,
                                      height: 38,
                                      display: "flex",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      fontSize: 14,
                                      fontWeight: subActive ? 600 : 400,
                                      color: subActive ? "#E8655B" : "#64748B",
                                      transition: "background-color 150ms ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "#F8FAFC"
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "transparent"
                                    }}
                                  >
                                    {sub.label}
                                  </div>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ flex: 1 }} />
        </div>

        {/* Mobile overlay */}
        {isMobile && expanded && (
          <motion.div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: -1,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          />
        )}
      </motion.div>

      {/* Hover trigger area next to collapsed sidebar */}
      {!expanded && !isMobile && (
        <div
          ref={hoverAreaRef}
          style={{
            position: "fixed",
            top: 80,
            left: sidebarWidth,
            width: 20,
            height: 250,
            zIndex: 30,
          }}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
        />
      )}
    </>
  )
}

export default StudentSidebar
