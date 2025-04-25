import React from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Company Sidebar Component
 * Navigation sidebar for company pages
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.expanded - Whether the sidebar is expanded
 * @param {Function} props.setExpanded - Function to toggle expanded state
 * @param {Function} props.onHoverChange - Function to handle hover state
 */
const CompanySidebar = ({ expanded = true, setExpanded, onHoverChange }) => {
  const location = useLocation();
  const basePath = "/organization/company";
  
  // Menu items with path and icon
  const menuItems = [
    {
      path: `${basePath}/dashboard`,
      icon: "dashboard",
      label: "Dashboard"
    },
    {
      path: `${basePath}/employee-list`,
      icon: "people",
      label: "Daftar Karyawan"
    },
    {
      path: `${basePath}/training`,
      icon: "school",
      label: "Pelatihan & Pengembangan"
    },
    {
      path: `${basePath}/profile`,
      icon: "business",
      label: "Profil Perusahaan"
    },
    {
      path: `${basePath}/settings`,
      icon: "settings",
      label: "Pengaturan"
    }
  ];
  
  // Check if current path is active
  const isActive = (path) => {
    // Handle index route
    if (path === `${basePath}/dashboard` && location.pathname === basePath) {
      return true;
    }
    return location.pathname === path;
  };
  
  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-white shadow-lg z-30 transition-all duration-300 ease-in-out ${expanded ? 'w-[240px]' : 'w-[69px]'}`}
      onMouseEnter={() => onHoverChange && onHoverChange(true)}
      onMouseLeave={() => onHoverChange && onHoverChange(false)}
    >
      {/* Logo */}
      <div className="h-[60px] flex items-center justify-center border-b border-gray-200">
        {expanded ? (
          <img src="/logo/ruang-diri-logo.png" alt="Logo" className="h-8" />
        ) : (
          <img src="/logo/ruang-diri-icon.png" alt="Logo" className="h-8" />
        )}
      </div>
      
      {/* Menu items */}
      <nav className="mt-4 px-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center py-3 px-3 rounded-md mb-1 transition-colors ${
              isActive(item.path)
                ? 'bg-primary-light text-primary-variant1 font-medium'
                : 'text-zinc-500 hover:bg-gray-100'
            } ${expanded ? 'justify-start' : 'justify-center'}`}
          >
            <span className="material-icons text-[22px]">{item.icon}</span>
            {expanded && <span className="ml-3">{item.label}</span>}
          </Link>
        ))}
      </nav>
      
      {/* Toggle button */}
      <button
        className="absolute -right-3 top-16 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="material-icons text-sm text-primary">
          {expanded ? 'chevron_left' : 'chevron_right'}
        </span>
      </button>
      
      {/* Logout button at bottom */}
      <div className="absolute bottom-4 w-full px-2">
        <Link
          to="/login"
          className={`flex items-center py-3 px-3 rounded-md text-red-500 hover:bg-red-50 transition-colors ${
            expanded ? 'justify-start' : 'justify-center'
          }`}
        >
          <span className="material-icons">logout</span>
          {expanded && <span className="ml-3">Keluar</span>}
        </Link>
      </div>
    </aside>
  );
};

export default CompanySidebar;