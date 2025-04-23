"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"

const Sidebar = ({ expanded, setExpanded, onHoverChange }) => {
  const location = useLocation()
  const [hovered, setHovered] = useState(false)
  const hoverTimeoutRef = useRef(null)
  const expandTimeoutRef = useRef(null)
  const sidebarRef = useRef(null)

  // Handle hover state changes with delay
  const handleMouseEnter = (e) => {
    // Only apply hover effect if mouse enters below the divider
    if (e.clientY > 200) {
      clearTimeout(hoverTimeoutRef.current)
      setHovered(true)
      if (onHoverChange) {
        onHoverChange(true)
      }
    }
  }

  const handleMouseLeave = () => {
    // Add delay before collapsing (500ms for smoother transition)
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false)
      if (onHoverChange) {
        onHoverChange(false)
      }
    }, 500)
  }

  // Toggle sidebar expansion with delay
  const toggleSidebar = () => {
    clearTimeout(expandTimeoutRef.current)
    expandTimeoutRef.current = setTimeout(() => {
      setExpanded(!expanded)
    }, 100)
  }

  // Clean up timeouts
  useEffect(() => {
    return () => {
      clearTimeout(hoverTimeoutRef.current)
      clearTimeout(expandTimeoutRef.current)
    }
  }, [])

  // Menu items
  const menuItems = [
    {
      icon: "bar_chart",
      label: "Dashboard",
      path: "/school/dashboard",
    },
    {
      icon: "table_chart",
      label: "Daftar Karyawan",
      path: "/school/employees",
    },
    {
      icon: "calendar_month",
      label: "Jadwal",
      path: "/school/schedule",
    },
    {
      icon: "brightness_5",
      label: "Pengaturan",
      path: "/school/settings",
    },
  ]

  // Check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <motion.div
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen bg-[#F7F7F9] shadow-md z-40"
      initial={{ width: expanded ? 240 : 69 }}
      animate={{ width: expanded || hovered ? 240 : 69 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 flex justify-center">
          <motion.img
            src="/logo/ruang-diri-logo.png"
            alt="Ruang Diri Logo"
            animate={{
              width: expanded || hovered ? "64px" : "32px",
              height: expanded || hovered ? "54px" : "27px",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>

        {/* Admin Profile */}
        <div className="mt-9 px-4 flex items-center">
          <motion.div
            className="rounded-full overflow-hidden"
            animate={{
              width: expanded || hovered ? "40px" : "37px",
              height: expanded || hovered ? "40px" : "37px",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <img
              src="https://randomuser.me/api/portraits/men/1.jpg"
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div
            className="ml-3"
            initial={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
            animate={{
              opacity: expanded || hovered ? 1 : 0,
              width: expanded || hovered ? "auto" : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="text-sm font-medium text-[#488BBE]">Admin</div>
            <div className="text-xs text-[#488BBE] flex items-center">
              PT Mencari Cinta Sejati
              <span className="material-icons text-sm ml-1 text-[#488BBE]">expand_more</span>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          className="mt-8 mx-auto h-[1px]"
          style={{
            backgroundColor: expanded || hovered ? "#D8EEFF" : "#8B8B8B",
          }}
          animate={{
            width: expanded || hovered ? "237px" : "59px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        ></motion.div>

        {/* Toggle Button */}
        <div
          className="absolute"
          style={{
            top: "34px",
            left: expanded ? "226px" : "48px",
            transition: "left 0.3s ease-in-out",
          }}
        >
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-[11px] h-[36px] bg-[#D8EEFF] text-[#488BBE] rounded-tl-[3px] rounded-bl-[3px]"
            style={{ marginLeft: expanded ? "0" : "7px" }}
          >
            <span className="material-icons" style={{ fontSize: "11px" }}>
              {expanded ? "keyboard_arrow_left" : "keyboard_arrow_right"}
            </span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex flex-col mt-8">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center mx-3 my-1 px-[17px] py-[8px] rounded-md transition-colors ${
                isActive(item.path) ? "bg-[#488BBE] text-white" : "text-[#488BBE] hover:bg-[#488BBE] hover:text-white"
              }`}
              style={{ width: expanded || hovered ? "213px" : "auto", gap: "11px" }}
            >
              <span className="material-icons">{item.icon}</span>
              <motion.span
                initial={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
                animate={{
                  opacity: expanded || hovered ? 1 : 0,
                  width: expanded || hovered ? "auto" : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default Sidebar
