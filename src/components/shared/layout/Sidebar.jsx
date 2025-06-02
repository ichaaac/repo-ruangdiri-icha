// src/components/shared/layout/Sidebar.jsx - Updated with dashboard selection
import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../../hooks/useAuth"

/**
 * Responsive Sidebar Component dengan active state untuk dashboard
 */
const Sidebar = ({
  expanded,
  setExpanded,
  onHoverChange,
  organizationType = "school",
  menuItems = [],
  isMobile = false,
  selectedDashboardTab = "home", // Add this prop for dashboard tab selection
  onDashboardTabChange = () => {}, // Add this callback
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user: userData } = useAuth()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [toggleHovered, setToggleHovered] = useState(false)
  const [fallbackProfileImage, setFallbackProfileImage] = useState(false)
  const expandTimeoutRef = useRef(null)
  const collapseTimeoutRef = useRef(null)
  const sidebarRef = useRef(null)

  // Responsive sidebar widths
  const expandedWidth = isMobile ? 200 : 237
  const collapsedWidth = isMobile ? 50 : 60
  const sidebarWidth = expanded || hovered ? expandedWidth : collapsedWidth

  // Sidebar enter/leave handlers - disabled on mobile
  const handleSidebarMouseEnter = () => {
    if (!expanded && !isMobile) {
      clearTimeout(collapseTimeoutRef.current)
      expandTimeoutRef.current = setTimeout(() => {
        setHovered(true)
        onHoverChange?.(true)
      }, 100)
    }
  }

  const handleSidebarMouseLeave = () => {
    if (!expanded && !isMobile) {
      clearTimeout(expandTimeoutRef.current)
      collapseTimeoutRef.current = setTimeout(() => {
        setHovered(false)
        setShowProfileDropdown(false)
        setActiveDropdown(null)
        onHoverChange?.(false)
      }, 300)
    }
  }

  useEffect(() => {
    if (!expanded && !hovered) {
      setShowProfileDropdown(false)
      setActiveDropdown(null)
    }
  }, [expanded, hovered])

  // Toggle sidebar
  const toggleSidebar = () => {
    setExpanded(!expanded)
    onHoverChange?.(!expanded)
    setShowProfileDropdown(false)
    setActiveDropdown(null)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
        setActiveDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      clearTimeout(expandTimeoutRef.current)
      clearTimeout(collapseTimeoutRef.current)
    }
  }, [])

  // Image error handler
  const handleImageError = () => {
    setFallbackProfileImage(true)
  }

  // Check if current path is active - UPDATED for dashboard
  const isActive = (path) => {
    // If path is dashboard, check if we're on dashboard route
    if (path.includes("/dashboard")) {
      return location.pathname.includes("/dashboard")
    }

    if (organizationType === "school") {
      if (path === "/organization/school/profile" && location.pathname === "/organization/school/settings") {
        return true
      }
    } else {
      if (path === "/organization/company/profile" && location.pathname === "/organization/company/settings") {
        return true
      }
    }
    return location.pathname === path
  }

  // Is dashboard item active
  const isDashboardItemActive = (tabId) => {
    if (!location.pathname.includes("/dashboard")) return false
    
    // If on dashboard route and this tab is selected
    return tabId === selectedDashboardTab
  }

  // Handle dashboard item click
  const handleDashboardItemClick = (tabId) => {
    // Set selected tab and call the callback
    onDashboardTabChange(tabId)
    
    // Navigate to dashboard if not already there
    const dashboardPath = 
      organizationType === "school" 
        ? "/organization/school/dashboard" 
        : "/organization/company/dashboard"
    
    if (location.pathname !== dashboardPath) {
      navigate(dashboardPath)
    }
  }

  // Handle dropdown toggle
  const toggleDropdown = (path) => {
    setActiveDropdown(activeDropdown === path ? null : path)
  }

  // Get the first letter of the name safely
  const getInitial = () => {
    if (userData?.fullName && userData.fullName.length > 0) {
      return userData.fullName.charAt(0).toUpperCase()
    }
    return organizationType === "company" ? "C" : "S"
  }

  // Find the dashboard item in menuItems
  const dashboardItem = menuItems.find(item => item.path.includes('/dashboard'))
  const dashboardDropdownItems = dashboardItem?.dropdownItems || [
    { id: "home", label: "Dashboard Home", path: `#dashboard-home` },
    { id: "at_risk", label: `${organizationType === 'school' ? 'Siswa' : 'Karyawan'} Beresiko`, path: `#dashboard-at_risk` },
    { id: "not_screened", label: `${organizationType === 'school' ? 'Siswa' : 'Karyawan'} Belum Skrining`, path: `#dashboard-not_screened` },
    { id: "not_counseled", label: `${organizationType === 'school' ? 'Siswa' : 'Karyawan'} Belum Konseling`, path: `#dashboard-not_counseled` },
  ]

  return (
    <motion.div
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen bg-[#F7F7F9] shadow-md z-40 flex flex-col"
      initial={{ width: expanded ? expandedWidth : collapsedWidth }}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Logo Container */}
      <div className={`relative ${isMobile ? "h-[60px]" : "h-[80px]"} flex items-center justify-center`}>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            paddingTop: expanded || hovered ? (isMobile ? "8px" : "12px") : isMobile ? "4px" : "6px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <motion.img
            src="/logo/ruang-diri-logo.svg"
            alt="Ruang Diri Logo"
            animate={{
              width: expanded || hovered ? (isMobile ? "60px" : "80px") : isMobile ? "24px" : "32px",
              height: expanded || hovered ? (isMobile ? "53px" : "71px") : isMobile ? "24px" : "32px",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="object-contain"
          />
        </motion.div>

        {/* Toggle Button */}
        <motion.div
          className="absolute right-0 top-1/2 transform -translate-y-1/2"
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
        >
          <button
            onClick={toggleSidebar}
            className={`${isMobile ? "w-2.5 h-7" : "w-3 h-9"} rounded-bl-md rounded-tl-md shadow-sm transition-colors ${
              toggleHovered ? "bg-[#488BBE] text-white" : "bg-[#D8EEFF] text-[#488BBE]"
            }`}
          >
            <span className="material-icons" style={{ fontSize: isMobile ? "10px" : "12px" }}>
              {expanded ? "chevron_left" : "chevron_right"}
            </span>
          </button>
        </motion.div>
      </div>

      {/* Profile Section */}
      <div className={`${isMobile ? "px-3 mt-6" : "px-4 mt-8"} relative`}>
        <div
          className="flex items-center cursor-pointer relative min-h-[40px] gap-3"
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        >
          {/* Profile Picture */}
          <div
            className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} rounded-full overflow-hidden flex-shrink-0 transition-all`}
          >
            {userData?.profilePicture && !fallbackProfileImage ? (
              <img
                src={userData.profilePicture || "/placeholder.svg"}
                alt="Organization"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-[#488BBE] flex items-center justify-center text-white">
                <span className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}>{getInitial()}</span>
              </div>
            )}
          </div>

          {/* Profile Text */}
          <motion.div
            className="overflow-hidden transition-all"
            animate={{
              width: expanded || hovered ? "auto" : 0,
              opacity: expanded || hovered ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-[#488BBE]`}>Admin</div>
            <div className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-[#488BBE] flex items-center`}>
              <span className={`truncate ${isMobile ? "max-w-[100px]" : "max-w-[140px]"}`}>
                {userData?.fullName || "-"}
              </span>
              <span className={`material-icons ${isMobile ? "text-xs" : "text-sm"} ml-1 text-[#488BBE] flex-shrink-0`}>
                {showProfileDropdown ? "expand_less" : "expand_more"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Profile Dropdown */}
        <AnimatePresence>
          {showProfileDropdown && (expanded || hovered) && (
            <motion.div
              className={`${isMobile ? "mt-2 pl-8" : "mt-3 pl-12"} overflow-hidden`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Link
                to={`/organization/${organizationType}/profile`}
                className={`block py-2 ${isMobile ? "text-xs" : "text-sm"} text-[#488BBE] hover:text-[#3399E9] transition-colors`}
                onClick={() => setShowProfileDropdown(false)}
              >
                Profil
              </Link>
              <button
                className={`block py-2 w-full text-left ${isMobile ? "text-xs" : "text-sm"} text-rose-500 hover:text-rose-600 transition-colors`}
                onClick={handleLogout}
              >
                Keluar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className={`${isMobile ? "mt-6 px-2" : "mt-8 px-3"}`}>
        <div className="h-[1px] bg-[#D9D9D9] w-full"></div>
      </div>

      {/* Navigation Menu */}
      <div
        className={`flex flex-col ${isMobile ? "mt-4 gap-y-2" : "mt-6 gap-y-3"} flex-1 overflow-y-auto`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {menuItems.map((item, index) => (
          <div key={index}>
            <motion.div
              className={`flex items-center w-full ${isMobile ? "h-[40px] px-3" : "h-[47px] px-5"} transition-colors cursor-pointer ${
                isActive(item.path)
                  ? "bg-[#488BBE] text-white font-bold border-b-2 border-white"
                  : "text-[#488BBE] hover:bg-[#488BBE] hover:text-white"
              }`}
              onClick={() => {
                if (item.hasDropdown) {
                  toggleDropdown(item.path)
                } else {
                  navigate(item.path)
                  // For dashboard items, select home tab by default when clicking the main menu
                  if (item.path.includes('/dashboard')) {
                    onDashboardTabChange('home')
                  }
                  // Close sidebar on mobile after navigation
                  if (isMobile) {
                    setExpanded(false)
                  }
                }
              }}
            >
              {/* Icon */}
              <span
                className={`material-icons ${isMobile ? "w-[16px]" : "w-[20px]"} flex-shrink-0`}
                style={{ fontSize: isMobile ? "16px" : "20px" }}
              >
                {item.icon}
              </span>

              {/* Label */}
              <motion.span
                animate={{
                  width: expanded || hovered ? "auto" : 0,
                  opacity: expanded || hovered ? 1 : 0,
                  marginLeft: expanded || hovered ? (isMobile ? "8px" : "10px") : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`${isMobile ? "text-xs" : "text-sm"} whitespace-nowrap overflow-hidden flex items-center justify-between flex-1 ${
                  isActive(item.path) ? "font-bold underline" : ""
                }`}
              >
                {item.label}
                {item.hasDropdown && (
                  <span className={`material-icons ${isMobile ? "text-xs" : "text-sm"} ml-2`}>
                    {activeDropdown === item.path ? "expand_less" : "expand_more"}
                  </span>
                )}
              </motion.span>
            </motion.div>

            {/* Dropdown Items - Special Handling for Dashboard */}
            <AnimatePresence>
              {item.hasDropdown && activeDropdown === item.path && (expanded || hovered) && (
                <motion.div
                  className={`${isMobile ? "pl-7" : "pl-10"} overflow-hidden`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {/* Special handling for dashboard dropdown items */}
                  {item.path.includes('/dashboard') 
                    ? dashboardDropdownItems.map((dropdownItem) => (
                        <a
                          key={dropdownItem.id}
                          href={dropdownItem.path}
                          className={`block ${isMobile ? "py-1.5 pl-2 text-xs" : "py-2 pl-3 text-sm"} 
                            ${isDashboardItemActive(dropdownItem.id) 
                              ? "text-[#488BBE] font-bold underline" 
                              : "text-[#488BBE] hover:text-[#3399E9]"} 
                            transition-colors`}
                          onClick={(e) => {
                            e.preventDefault()
                            handleDashboardItemClick(dropdownItem.id)
                            if (isMobile) setExpanded(false)
                          }}
                        >
                          {dropdownItem.label}
                        </a>
                      ))
                    : item.dropdownItems.map((dropdownItem, dropdownIndex) => (
                        <Link
                          key={dropdownIndex}
                          to={dropdownItem.path}
                          className={`block ${isMobile ? "py-1.5 pl-2 text-xs" : "py-2 pl-3 text-sm"} text-[#488BBE] hover:text-[#3399E9] transition-colors ${
                            isActive(dropdownItem.path) ? "font-bold underline" : ""
                          }`}
                          onClick={() => {
                            setActiveDropdown(null)
                            // Close sidebar on mobile after navigation
                            if (isMobile) {
                              setExpanded(false)
                            }
                          }}
                        >
                          {dropdownItem.label}
                        </Link>
                      ))
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Mobile overlay when sidebar is expanded */}
      {isMobile && expanded && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setExpanded(false)}
        />
      )}
    </motion.div>
  )
}

export default Sidebar