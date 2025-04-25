"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

const SchoolSidebar = ({ expanded, setExpanded, onHoverChange }) => {
  const location = useLocation()
  const [hovered, setHovered] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [toggleHovered, setToggleHovered] = useState(false)
  const hoverTimeoutRef = useRef(null)
  const sidebarRef = useRef(null)
  const dropdownRef = useRef(null)

  // Handle hover state changes with delay
  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current)
    setHovered(true)
    if (onHoverChange) {
      onHoverChange(true)
    }
  }

  const handleMouseLeave = () => {
    // Prevent immediate collapse when hovering dropdown
    if (showProfileDropdown) return

    // Add delay before collapsing (300ms for smoother transition)
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false)
      if (onHoverChange) {
        onHoverChange(false)
      }
    }, 300)
  }

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    setExpanded(!expanded)
    setShowProfileDropdown(false) // Close dropdown when toggling sidebar
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      clearTimeout(hoverTimeoutRef.current)
    }
  }, [dropdownRef])

  // Menu items for school
  const menuItems = [
    {
      icon: "dashboard",
      label: "Dashboard",
      path: "/school/dashboard",
    },
    {
      icon: "people",
      label: "Daftar Siswa",
      path: "/school/students",
    },
    {
      icon: "school",
      label: "Profil Sekolah",
      path: "/school/profile",
    },
    {
      icon: "calendar_month",
      label: "Jadwal",
      path: "/school/schedule",
    },
    {
      icon: "settings",
      label: "Pengaturan",
      path: "/school/settings",
    },
  ]

  // Check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path
  }

  // Width and style values
  const expandedWidth = 240
  const collapsedWidth = 69
  const sidebarWidth = expanded || hovered ? expandedWidth : collapsedWidth

  return (
    <motion.div
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen bg-[#F7F7F9] shadow-md z-40"
      initial={{ width: expanded ? expandedWidth : collapsedWidth }}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo Section */}
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
      
      {/* Profile Section */}
      <div className="mt-6 px-4" ref={dropdownRef}>
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        >
          <motion.div
            className="rounded-full overflow-hidden"
            animate={{
              width: expanded || hovered ? "40px" : "37px",
              height: expanded || hovered ? "40px" : "37px",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <img
              src="/school-avatar.jpg"
              alt="School"
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
            <div className="text-sm font-medium text-[#488BBE]">SMA</div>
            <div className="text-xs text-[#488BBE] flex items-center">
              Veteran 007
              <span className="material-icons text-sm ml-1 text-[#488BBE]">expand_more</span>
            </div>
          </motion.div>
        </div>
        
        {/* Profile Dropdown Menu */}
        <AnimatePresence>
          {showProfileDropdown && (expanded || hovered) && (
            <motion.div
              className="mt-2 pl-12 bg-white rounded-md shadow-md overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="py-2">
                <Link
                  to="/school/profile"
                  className="block py-2 text-sm text-[#488BBE] hover:text-[#3399E9] transition-colors"
                >
                  Profil
                </Link>
                <Link
                  to="/school/settings"
                  className="block py-2 text-sm text-[#488BBE] hover:text-[#3399E9] transition-colors"
                >
                  Pengaturan
                </Link>
                <div className="w-full h-[1px] bg-gray-200 my-1"></div>
                <button
                  className="block py-2 w-full text-left text-sm text-rose-500 hover:text-rose-600 transition-colors"
                  onClick={() => console.log("Logout clicked")}
                >
                  Keluar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <motion.div
        className="mt-6 mx-auto h-[1px]"
        style={{
          backgroundColor: expanded || hovered ? "#D8EEFF" : "#8B8B8B",
        }}
        animate={{
          width: expanded || hovered ? expandedWidth - 20 : collapsedWidth - 20,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      ></motion.div>

      {/* Navigation Menu */}
      <div className="flex flex-col mt-6">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`flex items-center mx-3 my-1 px-[17px] py-[8px] rounded-md transition-colors ${
              isActive(item.path) ? "bg-[#488BBE] text-white" : "text-[#488BBE] hover:bg-[#488BBE] hover:text-white"
            }`}
          >
            <span className="material-icons">{item.icon}</span>
            <motion.span
              initial={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
              animate={{
                opacity: expanded || hovered ? 1 : 0,
                width: expanded || hovered ? "auto" : 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="ml-3 whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          </Link>
        ))}
      </div>

      {/* Toggle Button */}
      <div
        className="absolute top-32 -right-3 z-50"
        onMouseEnter={() => setToggleHovered(true)}
        onMouseLeave={() => setToggleHovered(false)}
      >
        <button
          onClick={toggleSidebar}
          className={`flex items-center justify-center w-6 h-12 ${toggleHovered ? 'bg-[#488BBE] text-white' : 'bg-[#D8EEFF] text-[#488BBE]'} rounded-r-md transition-colors`}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>
            {expanded ? "chevron_left" : "chevron_right"}
          </span>
        </button>
      </div>
    </motion.div>
  )
}

export default SchoolSidebar