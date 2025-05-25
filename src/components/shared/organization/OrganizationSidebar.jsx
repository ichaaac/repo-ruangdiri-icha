// src/components/shared/organization/OrganizationSidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";

const OrganizationSidebar = ({ 
  organizationType = "school", // "school" or "company"
  expanded, 
  setExpanded, 
  onHoverChange 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user: userData } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);
  const [fallbackProfileImage, setFallbackProfileImage] = useState(false);
  const expandTimeoutRef = useRef(null);
  const collapseTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);

  const expandedWidth = 237;
  const collapsedWidth = 59;
  const sidebarWidth = expanded || hovered ? expandedWidth : collapsedWidth;

  // Base path for organization
  const basePath = `/organization/${organizationType}`;

  // Menu items configuration
  const menuItems = [
    {
      icon: "bar_chart",
      label: "Dashboard",
      path: `${basePath}/dashboard`,
      hasDropdown: true,
      dropdownItems: [
        { label: "Dashboard Home", path: `${basePath}/dashboard` },
        { label: "Dashboard Tab Laporan", path: `${basePath}/dashboard/reports` }
      ]
    },
    {
      icon: "table_chart",
      label: organizationType === "school" ? "Daftar Siswa" : "Daftar Karyawan",
      path: `${basePath}/${organizationType === "school" ? "student-list" : "employee-list"}`,
    },
    {
      icon: "calendar_month",
      label: "Jadwal",
      path: `${basePath}/schedule`,
    },
    {
      icon: "brightness_5",
      label: "Pengaturan",
      path: `${basePath}/profile`,
    },
  ];

  // Sidebar enter/leave handlers
  const handleSidebarMouseEnter = () => {
    if (!expanded) {
      clearTimeout(collapseTimeoutRef.current);
      expandTimeoutRef.current = setTimeout(() => {
        setHovered(true);
        onHoverChange?.(true);
      }, 100);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!expanded) {
      clearTimeout(expandTimeoutRef.current);
      collapseTimeoutRef.current = setTimeout(() => {
        setHovered(false);
        setShowProfileDropdown(false);
        setActiveDropdown(null);
        onHoverChange?.(false);
      }, 300);
    }
  };

  useEffect(() => {
    if (!expanded && !hovered) {
      setShowProfileDropdown(false);
      setActiveDropdown(null);
    }
  }, [expanded, hovered]);

  const toggleSidebar = () => {
    setExpanded(!expanded);
    onHoverChange?.(!expanded);
    setShowProfileDropdown(false);
    setActiveDropdown(null);
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(expandTimeoutRef.current);
      clearTimeout(collapseTimeoutRef.current);
    };
  }, []);

  const handleImageError = () => {
    setFallbackProfileImage(true);
  };

  const isLongName = () => {
    if (userData?.organization?.name) {
      return userData.organization.name.length > 20;
    }
    return false;
  };

  const isActive = (path) => {
    if (path === `${basePath}/profile` && location.pathname === `${basePath}/settings`) {
      return true;
    }
    return location.pathname === path;
  };

  const toggleDropdown = (path) => {
    setActiveDropdown(activeDropdown === path ? null : path);
  };

  const getInitial = () => {
    if (userData?.fullName && userData.fullName.length > 0) {
      return userData.fullName.charAt(0).toUpperCase();
    }
    return organizationType === 'school' ? 'S' : 'C';
  };

  return (
    <motion.div
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen bg-[#F7F7F9] shadow-md z-40 flex flex-col"
      initial={{ width: expanded ? expandedWidth : collapsedWidth }}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Logo Container */}
      <motion.div className="flex justify-center items-center relative h-[90px]">
        <motion.img
          src="/logo/ruang-diri-logo.svg"
          alt="Ruang Diri Logo"
          animate={{
            width: expanded || hovered ? "100px" : "32px",
            height: expanded || hovered ? "89px" : "32px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="object-contain"
        />
        
        {/* Toggle Button */}
        <motion.div
          className="absolute right-0 top-4"
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
        >
          <button
            onClick={toggleSidebar}
            className={`w-3 h-10 rounded-bl-md rounded-tl-md shadow-sm transition-colors ${
              toggleHovered ? 'bg-[#488BBE] text-white' : 'bg-[#D8EEFF] text-[#488BBE]'
            }`}
          >
            <span className="material-icons" style={{ fontSize: '12px' }}>
              {expanded ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        </motion.div>
      </motion.div>
      
      {/* Profile Section */}
      <motion.div className="px-4 mt-2">
        <motion.div
          className={`flex ${isLongName() && (expanded || hovered) ? 'flex-col items-center' : 'items-center'} cursor-pointer`}
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        >
          {/* Profile Picture */}
          <motion.div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            {userData?.organization?.profilePicture && !fallbackProfileImage ? (
              <img
                src={userData.organization.profilePicture}
                alt="Organization"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <motion.div className="w-full h-full bg-[#488BBE] flex items-center justify-center text-white">
                {getInitial()}
              </motion.div>
            )}
          </motion.div>
          
          {/* Profile Text */}
          <motion.div
            className={`${isLongName() && (expanded || hovered) ? 'mt-2 text-center' : 'ml-3'} overflow-hidden`}
            animate={{
              width: expanded || hovered ? "auto" : 0,
              opacity: expanded || hovered ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="text-sm font-medium text-[#488BBE]">Admin</div>
            <div className="text-sm font-medium text-[#488BBE] flex items-center">
              <span className="truncate max-w-[140px]">
                {userData?.fullName || "-"}
              </span>
              <span className="material-icons text-sm ml-1 text-[#488BBE] flex-shrink-0">
                {showProfileDropdown ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Profile Dropdown */}
        <AnimatePresence>
          {showProfileDropdown && (expanded || hovered) && (
            <motion.div
              className={`mt-2 ${isLongName() ? 'pl-0 text-center' : 'pl-12'} overflow-hidden`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Link
                to={`${basePath}/profile`}
                className="block py-1 text-sm text-[#488BBE] hover:text-[#3399E9] transition-colors"
                onClick={() => setShowProfileDropdown(false)}
              >
                Profil
              </Link>
              <button
                className="block py-1 w-full text-left text-sm text-rose-500 hover:text-rose-600 transition-colors"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Divider */}
      <div className="mt-4 px-2">
        <div className="h-[1px] bg-[#D9D9D9] w-full"></div>
      </div>

      {/* Navigation Menu */}
      <motion.div 
        className="flex flex-col mt-6 flex-1 overflow-y-auto gap-y-[21px]"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {menuItems.map((item, index) => (
          <motion.div key={index}>
            <motion.div
              className={`flex items-center w-full h-[47px] px-5 transition-colors cursor-pointer ${
                isActive(item.path)
                  ? "bg-[#488BBE] text-white"
                  : "text-[#488BBE] hover:bg-[#488BBE] hover:text-white"
              }`}
              onClick={() => {
                if (item.hasDropdown) {
                  toggleDropdown(item.path);
                } else {
                  navigate(item.path);
                }
              }}
            >
              <motion.span 
                className="material-icons w-[22px] flex-shrink-0"
                style={{ fontSize: '22px' }}
              >
                {item.icon}
              </motion.span>
              
              <motion.span
                animate={{
                  width: expanded || hovered ? "auto" : 0,
                  opacity: expanded || hovered ? 1 : 0,
                  marginLeft: expanded || hovered ? "12px" : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="whitespace-nowrap overflow-hidden flex items-center justify-between flex-1"
              >
                {item.label}
                {item.hasDropdown && (
                  <span className="material-icons text-sm ml-2">
                    {activeDropdown === item.path ? 'expand_less' : 'expand_more'}
                  </span>
                )}
              </motion.span>
            </motion.div>
            
            {/* Dropdown */}
            <AnimatePresence>
              {item.hasDropdown && activeDropdown === item.path && (expanded || hovered) && (
                <motion.div
                  className="pl-12 overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {item.dropdownItems.map((dropdownItem, dropdownIndex) => (
                    <Link
                      key={dropdownIndex}
                      to={dropdownItem.path}
                      className="block py-2 pl-4 text-sm text-[#488BBE] hover:text-[#3399E9] transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {dropdownItem.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default OrganizationSidebar;