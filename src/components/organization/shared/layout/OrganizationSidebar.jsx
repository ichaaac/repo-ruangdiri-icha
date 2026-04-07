import { useState, useEffect, useRef, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import DashboardIcon from "../icons/DashboardIcon"
import PeopleIcon from "../icons/PeopleIcon"
import CalendarIcon from "../icons/CalendarIcon"

const EXPANDED_W = 280
const COLLAPSED_W = 60

const MENU_ITEMS = {
  school: [
    { label: "Dashboard", icon: DashboardIcon, path: "/organization/school/dashboard" },
    { label: "Daftar Siswa", icon: PeopleIcon, path: "/organization/school/student-list" },
    { label: "Jadwal", icon: CalendarIcon, path: "/organization/school/schedule" },
  ],
  company: [
    { label: "Dashboard", icon: DashboardIcon, path: "/organization/company/dashboard" },
    { label: "Daftar Karyawan", icon: PeopleIcon, path: "/organization/company/employee-list" },
    { label: "Jadwal", icon: CalendarIcon, path: "/organization/company/schedule" },
  ],
}

const OrganizationSidebar = ({
  expanded,
  setExpanded,
  onHoverChange,
  isMobile = false,
  organizationType = "school",
}) => {
  const location = useLocation()
  const navigate = useNavigate()

  const [hovered, setHovered] = useState(false)
  const expandTimeoutRef = useRef(null)
  const collapseTimeoutRef = useRef(null)
  const sidebarRef = useRef(null)
  const hoverAreaRef = useRef(null)

  const isOpen = expanded || hovered
  const sidebarWidth = isOpen ? EXPANDED_W : COLLAPSED_W
  const menuItems = useMemo(() => MENU_ITEMS[organizationType] || MENU_ITEMS.school, [organizationType])

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
          display: "flex",
          flexDirection: "column",
        }}
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        onMouseEnter={() => { document.body.style.overflow = "hidden" }}
        onMouseLeave={() => { document.body.style.overflow = "" }}
      >
        {/* Collapse / Expand toggle */}
        <button
          onClick={toggleSidebar}
          title={isOpen ? "Tutup sidebar" : "Buka sidebar"}
          style={{
            position: "absolute",
            top: 28,
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            {isOpen ? (
              <path fillRule="evenodd" clipRule="evenodd" d="M10.1657 4.23431C10.4781 4.54673 10.4781 5.05327 10.1657 5.36569L7.53138 8L10.1657 10.6343C10.4781 10.9467 10.4781 11.4533 10.1657 11.7657C9.85327 12.0781 9.34674 12.0781 9.03432 11.7657L5.83432 8.56569C5.5219 8.25327 5.5219 7.74673 5.83432 7.43431L9.03432 4.23431C9.34674 3.9219 9.85327 3.9219 10.1657 4.23431Z" fill="#081021" />
            ) : (
              <path fillRule="evenodd" clipRule="evenodd" d="M5.83432 4.23431C5.5219 4.54673 5.5219 5.05327 5.83432 5.36569L8.46863 8L5.83432 10.6343C5.5219 10.9467 5.5219 11.4533 5.83432 11.7657C6.14674 12.0781 6.65327 12.0781 6.96569 11.7657L10.1657 8.56569C10.4781 8.25327 10.4781 7.74673 10.1657 7.43431L6.96569 4.23431C6.65327 3.9219 6.14674 3.9219 5.83432 4.23431Z" fill="#081021" />
            )}
          </svg>
        </button>

        {/* Inner content */}
        <div
          style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
        >
          {/* Logo */}
          <div
            style={{
              padding: "24px 24px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: isOpen ? "flex-start" : "center",
              flexShrink: 0,
              minHeight: 60,
              gap: 10,
            }}
          >
            <img
              src="/logo/ruang-diri-logo-new.png"
              alt="Ruang Diri"
              style={{
                height: 36,
                width: 36,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            {isOpen && (
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#488BBE",
                  whiteSpace: "nowrap",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: "0.3px",
                }}
              >
                Ruang Diri
              </span>
            )}
          </div>

          {/* Gap */}
          <div style={{ height: 32, flexShrink: 0 }} />

          {/* Menu items */}
          <div style={{ padding: isOpen ? "0 24px" : "0 6px", display: "flex", flexDirection: "column", gap: 12, transition: "padding 250ms ease" }}>
            {menuItems.map((item, idx) => {
              const active = isActive(item.path)
              const IconComponent = item.icon
              return (
                <div
                  key={idx}
                  onClick={() => handleMenuItemClick(item)}
                  title={!isOpen ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 48,
                    paddingLeft: isOpen ? 16 : 0,
                    paddingRight: isOpen ? 16 : 0,
                    paddingTop: 12,
                    paddingBottom: 12,
                    gap: isOpen ? 8 : 0,
                    cursor: "pointer",
                    borderRadius: active ? 0 : 99,
                    background: active ? "#ECF9FC" : "transparent",
                    position: "relative",
                    justifyContent: isOpen ? "flex-start" : "center",
                    overflow: "hidden",
                    transition: "background-color 150ms ease, padding 250ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "#F8FAFC"
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  {/* Active left indicator */}
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 2,
                        height: 48,
                        background: "#155DFC",
                        borderRadius: "0 2px 2px 0",
                      }}
                    />
                  )}

                  <IconComponent
                    size={24}
                    color={active ? "#E8655B" : "#64748B"}
                  />

                  <span
                    style={{
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      opacity: isOpen ? 1 : 0,
                      maxWidth: isOpen ? 180 : 0,
                      transition: "opacity 200ms ease, max-width 250ms ease",
                      fontSize: 16,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#E8655B" : "#64748B",
                      lineHeight: "22.4px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>

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

      {/* Hover trigger area */}
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

export default OrganizationSidebar
