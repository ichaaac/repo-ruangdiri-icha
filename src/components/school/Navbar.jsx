import React, { useState } from "react";

const Navbar = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  return (
    <header className="flex flex-wrap gap-5 justify-between items-center px-14 h-[123px] w-full max-w-[1440px] mx-auto bg-white shadow-[0px_20px_20px_rgba(164,166,140,0.09)] max-md:px-5 max-md:max-w-full">
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
        <div className="cursor-pointer">
          <span className="material-icons text-[#8B8B8B]">
            notifications
          </span>
        </div>
        <div className="relative">
          <div 
            className="flex flex-col items-center cursor-pointer"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <span className="material-icons text-[46px] text-primary-variant1">
              account_circle
            </span>
            <span className="text-xs text-[#8B8B8B]">Profil</span>
          </div>
          
          {showProfileDropdown && (
            <div className="absolute right-0 mt-[4px] w-[82px] bg-white rounded-md shadow-lg z-50 border border-gray-200">
              <div className="py-2">
                <a 
                  href="/school/profile"
                  className="block px-4 py-2 text-xs text-primary-variant1 bg-primary-light font-bold cursor-pointer"
                >
                  Profil
                </a>
                <div className="px-4 py-2 text-xs text-[#8B8B8B] hover:bg-gray-100 cursor-pointer font-bold">
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