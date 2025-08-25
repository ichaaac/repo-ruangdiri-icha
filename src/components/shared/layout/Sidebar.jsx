// src/components/shared/layout/Sidebar.jsx - FINAL LOGIC V2 (Correct Collapse Behavior)
import { useState, useEffect, useRef, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../../hooks/useAuth"

/**
 * Responsive Sidebar Component with correct persistence on collapse
 */
const Sidebar = ({
  expanded,
  setExpanded,
  onHoverChange,
  organizationType = "school",
  menuItems = [],
  isMobile = false,
  selectedDashboardTab = "home",
  onDashboardTabChange = () => {},
  dashboardMetrics = null,
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user: userData } = useAuth()
  
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeMenuPath, setActiveMenuPath] = useState(null);

  const [hovered, setHovered] = useState(false)
  const [toggleHovered, setToggleHovered] = useState(false)
  const [fallbackProfileImage, setFallbackProfileImage] = useState(false)
  const expandTimeoutRef = useRef(null)
  const collapseTimeoutRef = useRef(null)
  const sidebarRef = useRef(null)
  const hoverAreaRef = useRef(null)
  const hoverableContentRef = useRef(null)

  const expandedWidth = isMobile ? 200 : 237
  const collapsedWidth = isMobile ? 50 : 60
  const sidebarWidth = expanded || hovered ? expandedWidth : collapsedWidth
  
  const profileSectionHeight = isMobile ? 80 : 100
  const menuItemHeight = isMobile ? 40 : 47
  const totalMenuHeight = (menuItems.length + 1) * menuItemHeight
  const dividerHeight = 20
  const hoverableContentHeight = profileSectionHeight + dividerHeight + totalMenuHeight

  const handleHoverableContentMouseEnter = () => {
    if (!expanded && !isMobile) {
      clearTimeout(collapseTimeoutRef.current)
      expandTimeoutRef.current = setTimeout(() => {
        setHovered(true)
        onHoverChange?.(true)
      }, 100)
    }
  }

  const handleHoverableContentMouseLeave = () => {
    if (!expanded && !isMobile) {
      clearTimeout(expandTimeoutRef.current)
      collapseTimeoutRef.current = setTimeout(() => {
        setHovered(false)
        onHoverChange?.(false)
      }, 300)
    }
  }

  // This effect sets the default open state on page navigation
  useEffect(() => {
    const isProfilePage = location.pathname.includes(`/${organizationType}/profile`) || location.pathname.includes(`/${organizationType}/settings`);
    setProfileDropdownOpen(isProfilePage);

    const isDashboardPage = location.pathname.includes("/dashboard");
    const dashboardItem = menuItems.find(item => item.path.includes('/dashboard'));
    if (isDashboardPage && dashboardItem) {
        setActiveMenuPath(dashboardItem.path);
    } else {
        setActiveMenuPath(null);
    }
  }, [location.pathname, menuItems, organizationType]);

  // ✅ LOGIKA PERBAIKAN FINAL ADA DI SINI
  // This effect handles closing manually opened dropdowns when the sidebar collapses
  useEffect(() => {
    if (!expanded && !hovered) {
        // Cek apakah BUKAN di halaman profil, jika ya, tutup dropdownnya
        const isProfilePage = location.pathname.includes(`/${organizationType}/profile`) || location.pathname.includes(`/${organizationType}/settings`);
        if (!isProfilePage) {
            setProfileDropdownOpen(false);
        }

        // Cek apakah BUKAN di halaman dashboard, jika ya, tutup dropdownnya
        const isDashboardPage = location.pathname.includes("/dashboard");
        if (!isDashboardPage) {
            setActiveMenuPath(null);
        }
    }
  }, [expanded, hovered, location.pathname, organizationType]);

  const toggleSidebar = () => {
    setExpanded(!expanded)
    onHoverChange?.(!expanded)
  }

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

// ... (kode lainnya di dalam useEffect)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
          hoverAreaRef.current && !hoverAreaRef.current.contains(event.target) &&
          expanded && !isMobile) {
        setExpanded(false);
        onHoverChange?.(false);
      }
    }

    // Logika penguncian scroll sudah dihapus dari sini

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      clearTimeout(expandTimeoutRef.current)
      clearTimeout(collapseTimeoutRef.current)
      // Pastikan style dikembalikan ke default saat komponen unmount jika diperlukan
    }
  }, [expanded, hovered, isMobile, setExpanded, onHoverChange]);


  const handleImageError = () => setFallbackProfileImage(true)

  const isActive = (path) => {
    if (path.includes("/dashboard")) {
      return location.pathname.includes("/dashboard")
    }
    if (organizationType === "school") {
      if (path === "/organization/school/profile" && location.pathname === "/organization/school/settings") return true
    } else {
      if (path === "/organization/company/profile" && location.pathname === "/organization/company/settings") return true
    }
    return location.pathname === path
  }

  const isDashboardTabActive = (tabId) => {
    if (!location.pathname.includes("/dashboard")) return false
    return tabId === selectedDashboardTab
  }

  const getDashboardDropdownItems = () => [
    { id: "home", label: "Dashboard Home", disabled: false },
    { id: "tablist", label: "Dashboard Tab Laporan", disabled: false },
  ]

  const handleDashboardItemClick = (tabId) => {
    if (tabId === "home") {
      onDashboardTabChange("home")
    } else if (tabId === "tablist") {
      const metrics = dashboardMetrics?.summary || {}
      if ((metrics.atRisk?.count || 0) > 0) onDashboardTabChange("at_risk")
      else if ((metrics.notScreened?.count || 0) > 0) onDashboardTabChange("not_screened")
      else if ((metrics.notCounseled?.count || 0) > 0) onDashboardTabChange("not_counseled")
      else {
        onDashboardTabChange("home")
        return
      }
    }
    const dashboardPath = organizationType === "school" ? "/organization/school/dashboard" : "/organization/company/dashboard"
    if (location.pathname !== dashboardPath) navigate(dashboardPath)
    if (isMobile) setExpanded(false)
  }

  const toggleMenuDropdown = (path) => setActiveMenuPath(activeMenuPath === path ? null : path)

  const getInitial = () => {
    if (userData?.fullName && userData.fullName.length > 0) {
      return userData.fullName.charAt(0).toUpperCase()
    }
    return organizationType === "company" ? "C" : "S"
  }

  const dashboardDropdownItems = getDashboardDropdownItems()

const finalMenuItems = useMemo(() => {
  return menuItems;
}, [menuItems]);

  return (
    <>
      <motion.div
        ref={sidebarRef}
        className="fixed top-0 left-0 h-screen bg-[#F7F7F9] shadow-md z-40 flex flex-col"
        initial={{ width: expanded ? expandedWidth : collapsedWidth }}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => (document.body.style.overflow = "hidden")}
        onMouseLeave={() => (document.body.style.overflow = "")}
      >
        {/* Logo Container */}
        <div className={`relative ${isMobile ? "h-[60px]" : "h-[80px]"} flex-shrink-0 flex items-center justify-center`}>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ paddingTop: expanded || hovered ? (isMobile ? "8px" : "12px") : isMobile ? "4px" : "6px" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.img src="/logo/ruang-diri-logo.svg" alt="Ruang Diri Logo"
              animate={{
                width: expanded || hovered ? (isMobile ? "60px" : "80px") : isMobile ? "24px" : "32px",
                height: expanded || hovered ? (isMobile ? "53px" : "71px") : isMobile ? "24px" : "32px",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="object-contain"
            />
          </motion.div>

          <motion.div className="absolute right-0 top-1/2 transform -translate-y-1/2" onMouseEnter={() => setToggleHovered(true)} onMouseLeave={() => setToggleHovered(false)}>
            <button onClick={toggleSidebar}
              className={`${isMobile ? "w-2.5 h-7" : "w-3 h-9"} rounded-bl-md rounded-tl-md shadow-sm transition-colors ${toggleHovered ? "bg-[#488BBE] text-white" : "bg-[#D8EEFF] text-[#488BBE]"}`}>
              <span className="material-icons" style={{ fontSize: isMobile ? "10px" : "12px" }}>
                {expanded ? "chevron_left" : "chevron_right"}
              </span>
            </button>
          </motion.div>
        </div>

        <div
          ref={hoverableContentRef}
          className="flex-shrink-0"
          onMouseEnter={handleHoverableContentMouseEnter}
          onMouseLeave={handleHoverableContentMouseLeave}
        >
          {/* Profile Section */}
          <div className={`${isMobile ? "px-3 pt-10" : "px-2.5 pt-16"} relative mb-6`}>
            <div
              className="flex items-center cursor-pointer relative min-h-[40px] gap-3"
              onClick={() => setProfileDropdownOpen(prev => !prev)}
            >
              <div className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} rounded-full overflow-hidden flex-shrink-0 transition-all`}>
                {userData?.profilePicture && !fallbackProfileImage ? (
                  <img src={userData.profilePicture} alt="Organization" className="w-full h-full object-cover" onError={handleImageError} />
                ) : (
                  <div className="w-full h-full bg-[#488BBE] flex items-center justify-center text-white">
                    <span className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}>{getInitial()}</span>
                  </div>
                )}
              </div>
              <motion.div className="overflow-hidden transition-all"
                animate={{ width: expanded || hovered ? "auto" : 0, opacity: expanded || hovered ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}>
                <div className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-[#488BBE]`}>Admin</div>
                <div className={`${isMobile ? "text-xs" : "text-sm"} text-[#488BBE] flex items-center`}>
                  <span className={`truncate font-bold ${isMobile ? "max-w-[100px]" : "max-w-[140px]"}`}>
                    {userData?.fullName || "-"}
                  </span>
                  <span className={`material-icons ${isMobile ? "text-xs" : "text-sm"} ml-1 text-[#488BBE] flex-shrink-0`}>
                    {isProfileDropdownOpen ? "expand_less" : "expand_more"}
                  </span>
                </div>
              </motion.div>
            </div>
            
          <AnimatePresence>
            {isProfileDropdownOpen && (expanded || hovered) && (
              <motion.div
                className={`${isMobile ? "mt-2 pl-8" : "mt-3 pl-12"} overflow-hidden`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Link
                  to={`/organization/${organizationType}/profile`}
                  className={`block py-2 ${isMobile ? "text-xs" : "text-sm"} text-[#488BBE] hover:text-[#3399E9] transition-colors ${
                    isActive(`/organization/${organizationType}/profile`) ? "font-bold underline" : ""
                  }`}
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
          
          <div className={`${isMobile ? "px-2" : "px-3"} mb-6`}>
            <div className="h-[1px] bg-[#D9D9D9] w-full"></div>
          </div>

          {/* Navigatnotion Menu */}
          <div className={`flex flex-col gap-y-1`}>
            {finalMenuItems.map((item, index) => (
              <div key={index}>
                <motion.div className={`flex items-center w-full ${isMobile ? "h-[40px] px-3" : "h-[47px] px-5"} transition-colors cursor-pointer ${ isActive(item.path) ? "bg-[#488BBE] text-white font-bold" : "text-[#488BBE] hover:bg-[#488BBE] hover:text-white" }`}
                  onClick={() => {
                    if (item.hasDropdown) {
                        toggleMenuDropdown(item.path)
                    } else {
                      navigate(item.path)
                      if (item.path.includes('/dashboard')) onDashboardTabChange('home')
                      if (isMobile) setExpanded(false)
                    }
                  }}>
                  <span className={`material-icons ${isMobile ? "w-[16px]" : "w-[20px]"} flex-shrink-0`} style={{ fontSize: isMobile ? "16px" : "20px" }}>{item.icon}</span>
                  <motion.span animate={{ width: expanded || hovered ? "auto" : 0, opacity: expanded || hovered ? 1 : 0, marginLeft: expanded || hovered ? (isMobile ? "8px" : "10px") : 0, }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`${isMobile ? "text-xs" : "text-sm"} whitespace-nowrap overflow-hidden flex items-center justify-between flex-1 ${isActive(item.path) ? "font-bold" : ""}`}>
                    {item.label}
                    {item.hasDropdown && (<span className={`material-icons ${isMobile ? "text-xs" : "text-sm"} ml-2`}>{activeMenuPath === item.path ? "expand_less" : "expand_more"}</span>)}
                  </motion.span>
                </motion.div>
                <AnimatePresence>
                  {item.hasDropdown && activeMenuPath === item.path && (expanded || hovered) && (
                    <motion.div className={`overflow-hidden relative z-[9999]`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}>
                      
                      {item.path.includes('/dashboard') ? dashboardDropdownItems.map((dropdownItem) => (
                          <motion.div
                            key={dropdownItem.id}
                            className={`${isMobile ? "pl-7" : "pl-10"}`}
                            animate={{
                              paddingLeft: expanded || hovered ? (isMobile ? "28px" : "40px") : 0,
                              opacity: expanded || hovered ? 1 : 0
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <button type="button" disabled={dropdownItem.disabled}
                              className={`block w-full text-left ${isMobile ? "py-1.5 pl-2 text-xs" : "py-2 pl-3 text-sm"} transition-colors rounded ${dropdownItem.disabled ? "text-gray-400 cursor-not-allowed opacity-50" : ((dropdownItem.id === "home" && isDashboardTabActive("home")) || (dropdownItem.id === "tablist" && selectedDashboardTab !== "home")) ? "text-[#488BBE] font-bold underline" : "text-[#488BBE] hover:text-[#3399E9] hover:bg-[#F0F8FF]"}`}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!dropdownItem.disabled) handleDashboardItemClick(dropdownItem.id); }}>
                              <motion.span
                                animate={{
                                  opacity: expanded || hovered ? 1 : 0,
                                  x: expanded || hovered ? 0 : -10
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="whitespace-nowrap"
                              >
                                {dropdownItem.label}
                              </motion.span>
                            </button>
                          </motion.div>
                        )) : item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                          <motion.div
                            key={dropdownIndex}
                            className={`${isMobile ? "pl-7" : "pl-10"}`}
                            animate={{
                              paddingLeft: expanded || hovered ? (isMobile ? "28px" : "40px") : 0,
                              opacity: expanded || hovered ? 1 : 0
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <Link to={dropdownItem.path}
                              className={`block ${isMobile ? "py-1.5 pl-2 text-xs" : "py-2 pl-3 text-sm"} text-[#488BBE] hover:text-[#3399E9] transition-colors ${isActive(dropdownItem.path) ? "font-bold underline" : ""}`}
                              onClick={() => { if (isMobile) setExpanded(false); }}>
                              <motion.span
                                animate={{
                                  opacity: expanded || hovered ? 1 : 0,
                                  x: expanded || hovered ? 0 : -10
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="whitespace-nowrap"
                              >
                                {dropdownItem.label}
                              </motion.span>
                            </Link>
                          </motion.div>
                        ))
                      }
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden"></div>

        {isMobile && expanded && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          />
        )}
      </motion.div>

      {!expanded && !isMobile && (
        <div
          ref={hoverAreaRef}
          className="fixed z-30 pointer-events-auto"
          style={{
            top: isMobile ? '130px' : '160px',
            left: sidebarWidth,
            width: '20px',
            height: `${hoverableContentHeight}px`,
          }}
          onMouseEnter={handleHoverableContentMouseEnter}
          onMouseLeave={handleHoverableContentMouseLeave}
        />
      )}
    </>
  )
}

export default Sidebar