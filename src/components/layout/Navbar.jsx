import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

const Navbar = ({ activeSection, onSectionClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navItemRefs = useRef({});
  
  // Ensure page starts from top on refresh
  useEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);
  
  // Simplified scroll behavior - only hide after passing Layanan Kami section
// Modified scroll behavior in the Navbar component
useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // Apply shadow when scrolled down
    if (currentScrollY > 20) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
    
    // Hide navbar quickly after a small scroll down (50px)
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      setVisible(false);
    }
    
    // Show navbar immediately when scrolling up, except at the hero section
    if (currentScrollY < lastScrollY) {
      // Only show if we've scrolled down some amount (not at hero)
      if (currentScrollY > 100) {
        setVisible(true);
      }
    }
    
    // Always visible at the very top
    if (currentScrollY <= 50) {
      setVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  };
  
  // Throttle scroll event for better performance
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener("scroll", onScroll, { passive: true });
  
  // Initial check
  handleScroll();
  
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.history.scrollRestoration = "auto";
  };
}, [lastScrollY]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navItems = [
    { id: "hero", name: "Beranda", path: "/" },
    { id: "services", name: "Layanan Kami" },
    { id: "about", name: "Tentang Kami", path: "/tentang" },
    { id: "assessment", name: "Assesmen Diri", path: "/assesmen" },
    { id: "articles", name: "Artikel", path: "/artikel" }
  ];

  const handleNavItemClick = (item) => {
    if (item.id === "hero" || item.id === "services") {
      setVisible(true);
      onSectionClick(item.id);
    } else if (item.path) {
      window.location.href = item.path;
    }
    
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header 
      className={clsx(
        "w-full bg-white fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "shadow-md" : "shadow-xl",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="max-w-[1440px] mx-auto">
        <nav className="flex justify-between items-center h-[123px] md:h-[100px] sm:h-[80px]">
          <div className="flex items-center">
            <div className="pl-2 md:pl-4">
              <Link to="/">
                <div className="w-[100px] h-[89px] md:w-[80px] md:h-[70px] sm:w-[70px] sm:h-[60px] flex items-center justify-center">
                  <img
                    src="/logo/ruang-diri-logo.svg"
                    alt="Ruang Diri Logo"
                    className="max-w-full max-h-full object-contain"
                    style={{ color: "#8CC3EE" }}
                  />
                </div>
              </Link>
            </div>

            <ul className="hidden md:flex ml-16 lg:ml-24 relative">
              {navItems.map((item) => (
                <li key={item.id || item.name} className="relative mx-5 lg:mx-7">
                  <div 
                    ref={el => navItemRefs.current[item.id] = el}
                    onClick={() => handleNavItemClick(item)}
                    className={clsx(
                      "text-[20px] text-[#488BBE] transition-all duration-200 hover:font-bold cursor-pointer whitespace-nowrap",
                      activeSection === item.id ? "font-extrabold" : "font-normal hover:text-[#488BBE]"
                    )}
                  >
                    {item.name}
                  </div>
                  
                  {(activeSection === item.id && (item.id === "hero" || item.id === "services")) && (
                    <div className="flex absolute left-0 gap-1 bottom-[-7px]">
                      <div 
                        className="bg-[#F59E0B] h-[5px] rounded-sm shadow-[0_0_5px_rgba(249,115,22,0.5)]"
                        style={{ width: item.id === "services" ? "100px" : "58px" }}
                      />
                      <div 
                        className="bg-[#F59E0B] h-[5px] rounded-sm shadow-[0_0_5px_rgba(249,115,22,0.5)]"
                        style={{ width: item.id === "services" ? "33px" : "19px" }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right side elements with adjusted spacing */}
          <div className="hidden md:flex items-center pr-8 md:pr-16 lg:pr-24">
            {/* Increased space after articles and decreased space before login buttons */}
            <div className="text-sm text-zinc-500 ml-12 mr-8">
              <span className="font-bold text-[#488BBE]">ID</span>
              <span className="mx-2">/</span>
              <span>EN</span>
            </div>
            <div className="flex items-center">
              <Link 
                to="/login" 
                className="px-7 py-2.5 h-11 text-sm font-bold text-[#488BBE] bg-white border border-[#488BBE] rounded-[44px] hover:bg-[#E2F9FF] transition-colors flex items-center justify-center mr-5"
              >
                Masuk
              </Link>
              <Link 
                to="/register" 
                className="px-7 py-2.5 h-11 text-sm font-bold text-white bg-[#488BBE] rounded-[44px] hover:bg-[#3399E9] transition-colors flex items-center justify-center"
              >
                Daftar
              </Link>
            </div>
          </div>

          <button 
            className="block md:hidden mr-6"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-icons text-[#488BBE] text-3xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </nav>
      </div>

      <div 
        className={clsx(
          "fixed inset-0 bg-white z-40 pt-[80px] px-6 transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ul className="flex flex-col gap-6 items-center">
          {navItems.map((item) => (
            <li key={item.id || item.name} className="w-full">
              <div 
                onClick={() => handleNavItemClick(item)}
                className={clsx(
                  "block text-xl py-4 text-center transition-all duration-200 border-b border-gray-100 cursor-pointer",
                  activeSection === item.id 
                    ? "font-extrabold text-[#488BBE]" 
                    : "text-[#488BBE] hover:text-[#3399E9]"
                )}
              >
                {item.name}
              </div>
            </li>
          ))}
          
          <li className="w-full pt-4 flex justify-center">
            <div className="text-base text-zinc-500">
              <span className="font-bold text-[#488BBE]">ID</span>
              <span className="mx-3">/</span>
              <span>EN</span>
            </div>
          </li>
          
          <li className="w-full py-4 flex flex-col gap-4 items-center">
            <Link 
              to="/login" 
              className="w-full max-w-[250px] py-3 text-center text-[#488BBE] bg-white border border-[#488BBE] rounded-[44px] hover:bg-[#E2F9FF] transition-colors"
            >
              Masuk
            </Link>
            <Link 
              to="/register" 
              className="w-full max-w-[250px] py-3 text-center text-white bg-[#488BBE] rounded-[44px] hover:bg-[#3399E9] transition-colors"
            >
              Daftar
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Navbar;