import React, { useState, useRef, useEffect } from "react";

const Navbar = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
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
    };
  }, [dropdownRef]);
  
  return (
    <header className="fixed top-0 left-0 right-0 flex flex-wrap gap-5 justify-between items-center px-14 h-[123px] w-full bg-white shadow-[0px_20px_20px_rgba(164,166,140,0.09)] max-md:px-5 max-md:max-w-full z-30">
      <div className="flex flex-col justify-center self-start p-2.5">
        <div className="overflow-hidden w-full">
          <img
            src="/logo/ruang-diri-logo.png"
            alt="Ruang Diri Logo"
            className="object-contain aspect-[1.12] w-[100px]"
          />
        </div>
      </div>
      <div className="flex gap-10 my-auto items-center">
        <div className="my-auto text-sm font-bold text-center text-blue-500">
          ID /{" "}
          <span style={{ fontWeight: 400, color: "rgba(139,139,139,1)" }}>
            EN
          </span>
        </div>
        <div className="cursor-pointer hover:scale-105 transition-transform">
          <span className="material-icons text-[#8B8B8B] text-2xl hover:text-primary-variant1 transition-colors">
            notifications
          </span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <span className="material-icons text-[46px] text-primary-variant1">
              account_circle
            </span>
            <span className="text-xs text-[#8B8B8B]">Profil</span>
          </div>
          
          {showProfileDropdown && (
            <div className="absolute right-0 mt-[4px] w-[120px] bg-white rounded-md shadow-lg z-50 border border-gray-200">
              <div className="py-2">
                <a 
                  href="/school/profile"
                  className="block px-4 py-2 text-sm text-primary-variant1 hover:bg-primary-light font-medium cursor-pointer transition-colors"
                >
                  Profil
                </a>
                <a 
                  href="/school/settings"
                  className="block px-4 py-2 text-sm text-primary-variant1 hover:bg-primary-light font-medium cursor-pointer transition-colors"
                >
                  Pengaturan
                </a>
                <div className="w-full h-[1px] bg-gray-200 my-1"></div>
                <div className="px-4 py-2 text-sm text-rose-500 hover:bg-gray-100 cursor-pointer font-medium transition-colors">
                  Keluar
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;