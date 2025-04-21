import React, { useState, useEffect } from "react";

const Sidebar = ({ expanded, setExpanded }) => {
  const [hovered, setHovered] = useState(false);
  
  const sidebarItems = [
    { icon: "bar_chart", label: "Dashboard", active: window.location.pathname === "/school/dashboard", href: "/school/dashboard" },
    { icon: "table_chart", label: "Daftar Siswa", active: window.location.pathname === "/school/students", href: "/school/students" },
    { icon: "calendar_month", label: "Jadwal", active: window.location.pathname === "/school/schedule", href: "/school/schedule" },
    { icon: "brightness_5", label: "Pengaturan", active: window.location.pathname === "/school/settings", href: "/school/settings" },
  ];
  
  // Gmail-like behavior: expand on hover when collapsed
  useEffect(() => {
    if (!expanded && hovered) {
      const timer = setTimeout(() => {
        setHovered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [expanded, hovered]);
  
  const isOpen = expanded || hovered;
  
  return (
    <nav 
      className="fixed top-[123px] left-0 h-[687px] bg-white shadow-lg z-10 transition-all duration-300 ease-in-out border-r border-gray-200"
      style={{ width: isOpen ? '200px' : '69px' }}
      onMouseEnter={() => !expanded && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex overflow-hidden z-10 flex-col items-start w-full px-4 py-5">
        {sidebarItems.map((item, index) => (
          <a 
            key={index} 
            href={item.href}
            className={`flex gap-1.5 items-center ${index === 0 ? '' : 'mt-5'} py-3 px-2 w-full rounded-md ${
              item.active ? 'bg-primary-light' : 'hover:bg-gray-100'
            } transition-colors cursor-pointer`}
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          >
            <span className={`material-icons ${item.active ? 'text-primary-variant1' : 'text-zinc-500'}`}>
              {item.icon}
            </span>
            {isOpen && (
              <div className={`text-base leading-none ${item.active ? 'font-bold text-primary-variant1' : 'text-zinc-500'} transition-opacity duration-300`}>
                {item.label}
              </div>
            )}
          </a>
        ))}
      </div>
      
      {/* Collapse/Expand button */}
      <div 
        className="absolute cursor-pointer top-4"
        style={{ 
          left: isOpen ? '160px' : '30px',
          transition: 'left 0.3s ease-in-out'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="material-icons text-primary-variant1 text-sm">
          {isOpen ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
        </span>
      </div>
    </nav>
  );
};

export default Sidebar;