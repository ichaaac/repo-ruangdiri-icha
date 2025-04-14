"use client";
import React, { useState, useEffect } from "react";

const Navbar = ({ activeTab }) => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          setScrolled(currentScrollY > 20);
          setVisible(currentScrollY <= lastScrollY || currentScrollY <= 20);
          setLastScrollY(currentScrollY);
          
          ticking = false;
        });
        
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navItems = [
    "Beranda", 
    "Layanan Kami", 
    "Tentang Kami", 
    "Assesmen Diri", 
    "Artikel"
  ];

  return (
    <header 
      className={`w-full bg-white shadow-xl fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        scrolled ? 'shadow-md' : ''
      } ${visible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <nav className="flex justify-between items-center px-12 mx-auto h-[123px] max-w-[1440px] max-md:px-8 max-sm:px-5 max-md:h-[100px] max-sm:h-[80px]">
        <div className="flex gap-14 items-center max-md:gap-8 max-sm:gap-4">
          {/* Logo */}
          <div className="p-2.5 w-[120px] max-md:w-[100px] max-sm:w-[90px]">
            <img
              src="/logo/ruang-diri-logo.png"
              alt="Ruang Diri Logo"
              className="w-[100px] h-[89px] max-md:w-[80px] max-md:h-[70px] max-sm:w-[70px] max-sm:h-[60px]"
            />
          </div>

          {/* Navigation Links - Desktop Only */}
          <ul className="flex gap-12 items-center max-md:hidden">
            {navItems.map((item) => (
              <li key={item} className="relative">
                <a 
                  href="#" 
                  className={`text-xl text-[#8CC3EE] transition-all duration-200 hover:font-bold ${
                    activeTab === item ? 'font-extrabold' : 'hover:text-[#488BBE]'
                  }`}
                >
                  {item}
                </a>
                {activeTab === item && (
                  <div className="flex absolute left-0 gap-1 bottom-[-7px]">
                    <div className="bg-orange-400 h-[5px] w-[58px]" />
                    <div className="bg-orange-400 h-[5px] w-[19px]" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Section - Language & Buttons - Desktop Only */}
        <div className="flex gap-6 items-center max-md:hidden">
          {/* Increased spacing between Artikel and language selector */}
          <div className="text-sm text-zinc-500 ml-4">
            <span className="font-bold text-[#8CC3EE]">ID /</span>
            <span>EN</span>
          </div>
          <div className="flex gap-4 items-center">
            <button className="px-8 py-3 h-11 text-sm font-bold text-[#8CC3EE] bg-white border border-[#8CC3EE] rounded-[44px] hover:bg-[#E2F9FF] transition-colors">
              Masuk
            </button>
            <button className="px-8 py-3 h-11 text-sm font-bold text-white bg-[#8CC3EE] rounded-[44px] hover:bg-[#488BBE] transition-colors">
              Daftar
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="hidden max-md:block" aria-label="Toggle menu">
          <span className="material-icons text-[#8CC3EE] text-2xl">menu</span>
        </button>
      </nav>
    </header>
  );
};

export default Navbar;