import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const Sidebar = ({ expanded, setExpanded, onHoverChange }) => {
  const [hovered, setHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  
  const sidebarItems = [
    { icon: "bar_chart", label: "Dashboard", active: window.location.pathname === "/school/dashboard", href: "/school/dashboard" },
    { icon: "table_chart", label: "Daftar Siswa", active: window.location.pathname === "/school/students", href: "/school/students" },
    { icon: "calendar_month", label: "Jadwal", active: window.location.pathname === "/school/schedule", href: "/school/schedule" },
    { icon: "brightness_5", label: "Pengaturan", active: window.location.pathname === "/school/settings", href: "/school/settings" },
  ];
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const handleMouseEnter = () => {
    if (!expanded) {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      // Set a timeout before expanding
      hoverTimeoutRef.current = setTimeout(() => {
        setHovered(true);
        if (onHoverChange) onHoverChange(true);
      }, 300);
    }
  };
  
  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Set hovered to false immediately when mouse leaves
    if (!expanded) {
      setHovered(false);
      if (onHoverChange) onHoverChange(false);
    }
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  // Update parent component when expanded state changes
  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(hovered);
    }
  }, [hovered, onHoverChange]);
  
  const isOpen = expanded || hovered;
  
  return (
    <motion.nav 
      className="fixed top-[123px] left-0 h-[calc(100vh-123px)] bg-white shadow-lg z-20 border-r border-gray-200"
      initial={{ width: '69px' }}
      animate={{ width: isOpen ? '200px' : '69px' }}
      transition={{ 
        duration: 0.4, 
        ease: [0.4, 0.0, 0.2, 1]  // Material Design standard easing
      }}
    >
      {/* Toggle button centered horizontally */}
      <div className="flex justify-center mt-3">
        <motion.div 
          className="cursor-pointer w-8 h-8 flex items-center justify-center hover:text-primary bg-white rounded-full transition-all hover:shadow-sm"
          onClick={toggleExpanded}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span 
            className="material-icons text-primary-variant1 text-lg"
            initial={{ rotate: expanded ? 0 : 180 }}
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            keyboard_double_arrow_left
          </motion.span>
        </motion.div>
      </div>
      
      {/* Menu items with reduced spacing from toggle button */}
      <div 
        className="flex flex-col items-start w-full px-4 pt-8"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {sidebarItems.map((item, index) => (
          <motion.a 
            key={index} 
            href={item.href}
            className={`flex items-center ${index === 0 ? '' : 'mt-5'} py-3 px-2 w-full rounded-md ${
              item.active ? 'bg-primary-light' : 'hover:bg-gray-100'
            } cursor-pointer`}
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            whileHover={{ backgroundColor: item.active ? '#E2F9FF' : '#f7f7f7' }}
          >
            <span className={`material-icons ${item.active ? 'text-primary-variant1' : 'text-zinc-500'}`}>
              {item.icon}
            </span>
            
            <motion.div 
              className={`ml-4 text-base leading-none ${item.active ? 'font-bold text-primary-variant1' : 'text-zinc-500'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: isOpen ? 'block' : 'none' }}
            >
              {item.label}
            </motion.div>
          </motion.a>
        ))}
      </div>
    </motion.nav>
  );
};

export default Sidebar;