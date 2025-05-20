// src/components/organization/school/SchoolSidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";

const SchoolSidebar = ({ expanded, setExpanded, onHoverChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user: userData } = useAuth(); // Gunakan user dari useAuth
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);
  const expandTimeoutRef = useRef(null);
  const collapseTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);

  const expandedWidth = 237;
  const collapsedWidth = 59;
  const sidebarWidth = expanded || hovered ? expandedWidth : collapsedWidth;

  // Sidebar enter/leave handlers with whole sidebar area
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
        setShowDashboardDropdown(false);
        onHoverChange?.(false);
      }, 300);
    }
  };

  // Close dropdowns when sidebar collapses
  useEffect(() => {
    if (!expanded && !hovered) {
      setShowProfileDropdown(false);
      setShowDashboardDropdown(false);
    }
  }, [expanded, hovered]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setExpanded(!expanded);
    onHoverChange?.(!expanded);
    setShowProfileDropdown(false);
    setShowDashboardDropdown(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
        setShowDashboardDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(expandTimeoutRef.current);
      clearTimeout(collapseTimeoutRef.current);
    };
  }, []);

  const menuItems = [
    {
      icon: "bar_chart",
      label: "Dashboard",
      path: "/organization/school/dashboard",
      hasDropdown: true,
      dropdownItems: [
        { label: "Dashboard Home", path: "/organization/school/dashboard" },
        { label: "Dashboard Tab Laporan", path: "/organization/school/dashboard/reports" }
      ]
    },
    {
      icon: "table_chart",
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

  const isActive = (path) => {
    if (path === "/organization/school/profile" && location.pathname === "/organization/school/settings") {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <motion.div
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen bg-[#F7F7F9] shadow-md z-40 flex flex-col"
      initial={{ width: expanded ? expandedWidth : collapsedWidth }}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Logo */}
      <div className="p-4 flex justify-center items-center relative">
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

        <div
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
        </div>
      </div>

      {/* Profile Section */}
      <div className="mt-6 px-4">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            {userData?.organization?.profilePicture ? (
              <img
                src={userData.organization.profilePicture}
                alt="Organization"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Profile image failed to load:", e);
                  e.target.onerror = null; // Prevent infinite loops
                  e.target.src = ""; // Clear the src
                  e.target.style.backgroundColor = "#488BBE";
                  e.target.style.display = "flex";
                  e.target.style.alignItems = "center";
                  e.target.style.justifyContent = "center";
                }}
              />
            ) : (
              <div className="w-full h-full bg-[#488BBE] flex items-center justify-center text-white">
                {userData?.fullName?.charAt(0).toUpperCase() || 'S'}
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
            <div className="text-sm font-medium text-[#488BBE]">Admin</div>
            <div className="text-sm font-medium text-[#488BBE]">
              {userData?.fullName || "Nama Sekolah"}
              <span className="material-icons text-sm ml-1 text-[#488BBE]">
                {showProfileDropdown ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </motion.div>
        </div>
        
        {/* Profile Dropdown */}
        <AnimatePresence>
          {showProfileDropdown && (expanded || hovered) && (
            <motion.div
              className="mt-2 pl-12 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Link
                to="/organization/school/profile"
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
      </div>

      {/* Sisa komponen tetap sama */}
      {/* Divider */}
      <div className="mt-6 px-2">
        <div className="h-[1px] bg-[#D9D9D9] w-full"></div>
      </div>

      {/* Navigation Menu */}
      <div 
        className="flex flex-col mt-6 flex-1 overflow-y-auto gap-y-[21px]"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {menuItems.map((item, index) => (
          <div key={index}>
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
            
            {/* Dashboard Dropdown */}
            <AnimatePresence>
              {item.hasDropdown && showDashboardDropdown && (expanded || hovered) && (
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
                      onClick={() => setShowDashboardDropdown(false)}
                    >
                      {dropdownItem.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SchoolSidebar;