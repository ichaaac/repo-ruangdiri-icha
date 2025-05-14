// src/components/organization/company/CompanySidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../../lib/api";

/**
 * Company Sidebar Component
 * Navigation sidebar for company pages with collapsible behavior
 * Updated to match current app navigation structure with improved hover behavior
 */
const CompanySidebar = ({ expanded, setExpanded, onHoverChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);
  const expandTimeoutRef = useRef(null);
  const collapseTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);
  const dashboardDropdownRef = useRef(null);
  const navSectionRef = useRef(null);

  // Add direct query to fetch user data
  const { data: userData } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      const response = await getMe();
      if (response.data && response.data.status === "success") {
        return response.data.data;
      }
      throw new Error(response.data?.message || "Failed to fetch user data");
    }
  });

  // Constants for sidebar widths
  const expandedWidth = 237;
  const collapsedWidth = 59;

  // Handle mouse enter for navigation section only
  const handleNavSectionMouseEnter = () => {
    if (!expanded) {
      // Clear any pending collapse timeout
      clearTimeout(collapseTimeoutRef.current);
      
      // Set a shorter delay when hovering to make response feel more immediate
      expandTimeoutRef.current = setTimeout(() => {
        setHovered(true);
        if (onHoverChange) onHoverChange(true);
      }, 100);
    }
  };

  // Handle mouse leave for navigation section
  const handleNavSectionMouseLeave = () => {
    if (!expanded) {
      // Clear any pending expand timeout
      clearTimeout(expandTimeoutRef.current);
      
      // Use a longer delay when leaving to avoid flickering
      collapseTimeoutRef.current = setTimeout(() => {
        if (!showProfileDropdown && !showDashboardDropdown) {
          setHovered(false);
          if (onHoverChange) onHoverChange(false);
        }
      }, 400);
    }
  };

  // Close dropdowns when sidebar collapses
  useEffect(() => {
    if (!expanded && !hovered) {
      setShowProfileDropdown(false);
      setShowDashboardDropdown(false);
    }
  }, [expanded, hovered]);

  // Toggle expanded state
  const toggleSidebar = () => {
    setExpanded(!expanded);
    if (onHoverChange) onHoverChange(!expanded);
    // Close all dropdowns when toggling
    setShowProfileDropdown(false);
    setShowDashboardDropdown(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      // Navigation is handled by the logout function
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (dashboardDropdownRef.current && !dashboardDropdownRef.current.contains(event.target)) {
        setShowDashboardDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(expandTimeoutRef.current);
      clearTimeout(collapseTimeoutRef.current);
    };
  }, [dropdownRef, dashboardDropdownRef]);

  const menuItems = [
    {
      icon: "bar_chart",
      label: "Dashboard",
      path: "/organization/company/dashboard",
      hasDropdown: true,
      dropdownItems: [
        {
          label: "Dashboard Home",
          path: "/organization/company/dashboard",
        },
        {
          label: "Dashboard Tab Laporan",
          path: "/organization/company/dashboard/reports",
        }
      ]
    },
    {
      icon: "table_chart",
      label: "Daftar Karyawan",
      path: "/organization/company/employee-list",
    },
    {
      icon: "calendar_month",
      label: "Jadwal",
      path: "/organization/company/schedule",
    },
    {
      icon: "brightness_5",
      label: "Pengaturan",
      path: "/organization/company/profile",
    },
  ];

  const isActive = (path) => {
    if (path === "/organization/company/profile" && location.pathname === "/organization/company/settings") {
      return true;
    }
    return location.pathname === path;
  };

  const sidebarWidth = expanded || hovered ? expandedWidth : collapsedWidth;

  return (
    <motion.div
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen bg-[#F7F7F9] shadow-md z-40 flex flex-col"
      initial={{ width: expanded ? expandedWidth : collapsedWidth }}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="p-4 flex justify-center items-center relative">
        <motion.img
          src="/logo/ruang-diri-logo.svg"
          alt="Ruang Diri Logo"
          animate={{
            width: expanded || hovered ? "100px" : "32px",
            height: expanded || hovered ? "89px" : "32px",
            opacity: 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="object-contain"
        />

        <div
          className={`absolute right-0 top-4`}
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
        >
          <button
            onClick={toggleSidebar}
            className={`w-3 h-10 rounded-bl-md rounded-tl-md shadow-sm transition-colors ${
              toggleHovered
                ? 'bg-[#488BBE] text-white'
                : 'bg-[#D8EEFF] text-[#488BBE]'
            }`}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <span className="material-icons" style={{ fontSize: '12px' }}>
              {expanded ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        </div>
      </div>

      
      {/* Profile Section */}
      <div className="mt-6 px-4" ref={dropdownRef}>
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            {userData && userData.organization && userData.organization.profilePicture ? (
             <img
             src={`${userData.organization.profilePicture}?t=${new Date().getTime()}`}
             alt="Organization"
             className="w-full h-full object-cover"
           />
           
            ) : (
              <div className="w-full h-full bg-[#488BBE] flex items-center justify-center text-white">
              {userData?.fullName?.charAt(0).toUpperCase() || 'C'}
            </div>
          )}
        </div>
          <motion.div
            className="ml-3 overflow-hidden"
            animate={{
              width: expanded || hovered ? "auto" : 0,
              opacity: expanded || hovered ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="text-sm font-medium text-[#488BBE]">
              Admin
            </div>
            <div className="text-sm font-medium text-[#488BBE]">
            {userData?.fullName || "Nama Perusahaan"}
            <span className="material-icons text-sm ml-1 text-[#488BBE]">expand_more</span>
            </div>
          </motion.div>
        </div>
        
        {/* Profile Dropdown Menu - No white background */}
        <AnimatePresence>
          {showProfileDropdown && (expanded || hovered) && (
            <motion.div
              className="mt-2 pl-12 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="py-1">
                <Link
                  to="/organization/company/profile"
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mt-6 px-2">
        <motion.div
          className="h-[1px] bg-[#D9D9D9] mx-auto"
          animate={{
            width: "100%"
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        ></motion.div>
      </div>

      {/* Navigation Menu - with hover behavior only for this section */}
      <div 
        className="flex flex-col mt-6 flex-1 overflow-y-auto gap-y-[21px]"
        ref={navSectionRef}
        onMouseEnter={handleNavSectionMouseEnter}
        onMouseLeave={handleNavSectionMouseLeave}
      >
          {menuItems.map((item, index) => (
            <div key={index} ref={item.hasDropdown ? dashboardDropdownRef : null}>
              <div
                className={`flex items-center w-full h-[47px] px-5 transition-colors cursor-pointer ${
                  isActive(item.path)
                    ? "bg-[#488BBE] text-white"
                    : "text-[#488BBE] hover:bg-[#488BBE] hover:text-white"
                }`}
                onClick={() => {
                  if (item.hasDropdown) {
                    setShowDashboardDropdown(!showDashboardDropdown);
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                <span className="material-icons text-[22px]">{item.icon}</span>
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
                      {showDashboardDropdown ? 'expand_less' : 'expand_more'}
                    </span>
                  )}
                </motion.span>
              </div>
              
              {/* Dashboard Dropdown - No white background */}
              <AnimatePresence>
                {item.hasDropdown && showDashboardDropdown && (expanded || hovered) && (
                  <motion.div
                    className="pl-12 overflow-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="py-1">
                      {item.dropdownItems.map((dropdownItem, dropdownIndex) => (
                        <Link
                          key={dropdownIndex}
                          to={dropdownItem.path}
                          className="block py-2 pl-4 text-sm text-[#488BBE] hover:text-[#3399E9] transition-colors"
                          onClick={() => setShowDashboardDropdown(false)}
                        >
                          {dropdownItem.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
      </div>
    </motion.div>
  );
};

export default CompanySidebar;