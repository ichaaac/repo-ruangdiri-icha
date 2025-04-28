// src/components/organization/school/SchoolSidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * School Sidebar Component
 * Navigation sidebar for school pages with collapsible behavior
 * Updated to match current app navigation structure
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.expanded - Whether the sidebar is expanded
 * @param {Function} props.setExpanded - Function to toggle expanded state
 * @param {Function} props.onHoverChange - Function to notify parent of hover state change
 * @returns {JSX.Element}
 */
const SchoolSidebar = ({ expanded, setExpanded, onHoverChange }) => {
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);
  const expandTimeoutRef = useRef(null);
  const collapseTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);

  // Constants for sidebar widths
  const expandedWidth = 240;
  const collapsedWidth = 64;

  // Handle mouse enter - expand sidebar after short delay
  const handleMouseEnter = () => {
    clearTimeout(collapseTimeoutRef.current);
    
    if (!expanded) {
      expandTimeoutRef.current = setTimeout(() => {
        setHovered(true);
        if (onHoverChange) onHoverChange(true);
      }, 200);
    }
  };

  // Handle mouse leave - collapse sidebar after delay
  const handleMouseLeave = () => {
    clearTimeout(expandTimeoutRef.current);
    
    if (!expanded && hovered) {
      collapseTimeoutRef.current = setTimeout(() => {
        if (!showProfileDropdown) {
          setHovered(false);
          if (onHoverChange) onHoverChange(false);
        }
      }, 300);
    }
  };

  // Toggle expanded state
  const toggleSidebar = () => {
    setExpanded(!expanded);
    if (onHoverChange) onHoverChange(!expanded);
    if (showProfileDropdown) {
      setShowProfileDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(expandTimeoutRef.current);
      clearTimeout(collapseTimeoutRef.current);
    };
  }, [dropdownRef]);

  // Menu items for school - Updated based on current app structure
  const menuItems = [
    {
      icon: "bar_chart",
      label: "Dashboard",
      path: "/organization/school/dashboard",
    },
    {
      icon: "settings_ethernet", // Using settings_ethernet as bounding box icon
      label: "Daftar Siswa",
      path: "/organization/school/student-list",
    },
    {
      icon: "calendar_month",
      label: "Jadwal",
      path: "/organization/school/schedule",
    },
    {
      icon: "brightness_5",
      label: "Pengaturan",
      path: "/organization/school/profile",
    },
  ];

  // Check if a menu item is active
  const isActive = (path) => {
    // Handle special case for "Pengaturan" which maps to profile
    if (path === "/organization/school/profile" && location.pathname === "/organization/school/settings") {
      return true;
    }
    return location.pathname === path;
  };

  // Calculate sidebar width based on state
  const sidebarWidth = expanded || hovered ? expandedWidth : collapsedWidth;

  return (
    <motion.div
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen bg-[#F7F7F9] shadow-md z-40 flex flex-col"
      initial={{ width: expanded ? expandedWidth : collapsedWidth }}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo Section */}
      <div className="p-4 flex justify-center items-center border-b border-gray-100">
        <motion.img
          src="/logo/ruang-diri-logo.png"
          alt="Ruang Diri Logo"
          animate={{
            width: expanded || hovered ? "140px" : "32px",
            opacity: 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-8 object-contain"
        />
      </div>
      
      {/* Profile Section */}
      <div className="mt-6 px-4" ref={dropdownRef}>
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img
              src="/school-avatar.jpg"
              alt="School"
              className="w-full h-full object-cover"
            />
          </div>
          
          <motion.div
            className="ml-3 overflow-hidden"
            animate={{
              width: expanded || hovered ? "auto" : 0,
              opacity: expanded || hovered ? 1 : 0
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
                  to="/organization/school/profile"
                  className="block py-2 text-sm text-[#488BBE] hover:text-[#3399E9] transition-colors"
                >
                  Profil
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
      <div className="mt-6 px-4">
        <motion.div
          className="h-[1px] bg-[#D8EEFF] mx-auto"
          animate={{
            width: "100%"
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        ></motion.div>
      </div>

      {/* Navigation Menu */}
      <div className="flex flex-col mt-6 flex-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`flex items-center mx-3 my-1 px-3 py-2 rounded-md transition-colors ${
              isActive(item.path) 
                ? "bg-[#488BBE] text-white" 
                : "text-[#488BBE] hover:bg-[#E2F9FF]"
            }`}
          >
            <span className="material-icons text-[22px]">{item.icon}</span>
            <motion.span
              animate={{
                width: expanded || hovered ? "auto" : 0,
                opacity: expanded || hovered ? 1 : 0,
                marginLeft: expanded || hovered ? "12px" : 0
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          </Link>
        ))}
      </div>

      {/* Toggle Button - properly positioned inside sidebar */}
      <div
        className="absolute right-0 top-24"
        onMouseEnter={() => setToggleHovered(true)}
        onMouseLeave={() => setToggleHovered(false)}
      >
        <button
          onClick={toggleSidebar}
          className={`flex items-center justify-center w-6 h-10 rounded-r-md shadow-md transition-colors ${
            toggleHovered ? 'bg-[#488BBE] text-white' : 'bg-[#D8EEFF] text-[#488BBE]'
          }`}
          style={{ transform: 'translateX(6px)' }}
        >
          <span className="material-icons" style={{ fontSize: "16px" }}>
            {expanded ? "chevron_left" : "chevron_right"}
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default SchoolSidebar;