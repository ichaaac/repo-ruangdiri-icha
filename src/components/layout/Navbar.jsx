import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const Navbar = ({ activeSection, onSectionClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // References to measure text width for dynamic indicator
  const navItemRefs = useRef({});
  
  // Track scroll position for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Smooth transitions for navbar visibility
      if (currentScrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Only hide navbar when scrolling down rapidly
      if ((currentScrollY > lastScrollY + 50) && currentScrollY > 300) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    // Use requestAnimationFrame for smoother performance
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
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  // Close mobile menu when changing route
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
      onSectionClick(item.id);
    } else if (item.path) {
      navigate(item.path);
    }
    
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogoClick = () => {
    // Navigate to home page and scroll to top
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Only show indicator for hero and services sections
  const showIndicator = activeSection === "hero" || activeSection === "services";
  const indicatorPosition = activeSection === "services" ? 
    { left: navItemRefs.current["services"]?.offsetLeft || 0 } : 
    { left: navItemRefs.current["hero"]?.offsetLeft || 0 };
  
  const indicatorWidth = activeSection === "services" ? 
    navItemRefs.current["services"]?.offsetWidth || 0 : 
    navItemRefs.current["hero"]?.offsetWidth || 0;

  return (
    <header 
      className={clsx(
        "w-full bg-white fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "shadow-md" : "shadow-xl",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="max-w-[1440px] mx-auto">
        <nav className="flex justify-between items-center h-[123px] md:h-[100px] sm:h-[80px]">
          <div className="flex items-center">
            {/* Logo with link to home */}
            <div className="pl-2 md:pl-4">
              <div 
                onClick={handleLogoClick}
                className="cursor-pointer"
              >
                <img
                  src="/logo/ruang-diri-logo.png"
                  alt="Ruang Diri Logo"
                  className="w-[100px] h-[89px] md:w-[80px] md:h-[70px] sm:w-[70px] sm:h-[60px]"
                />
              </div>
            </div>

            {/* Navigation links with dynamic indicator */}
            <ul className="hidden md:flex ml-16 lg:ml-24 relative">
              {navItems.map((item) => (
                <li key={item.id || item.name} className="relative mx-5 lg:mx-7">
                  <div 
                    ref={el => navItemRefs.current[item.id] = el}
                    onClick={() => handleNavItemClick(item)}
                    className={clsx(
                      "text-lg lg:text-xl text-[#488BBE] transition-all duration-200 hover:font-bold cursor-pointer whitespace-nowrap",
                      activeSection === item.id ? "font-extrabold" : "hover:text-[#488BBE]"
                    )}
                  >
                    {item.name}
                  </div>
                </li>
              ))}
              
              {/* Indicator with smooth animations */}
              <AnimatePresence>
                {showIndicator && (
                  <motion.div 
                    className="absolute bottom-[-7px] flex gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      left: indicatorPosition.left,
                      width: indicatorWidth
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 30
                    }}
                  >
                    <motion.div 
                      className="h-[5px] bg-[#F59E0B] rounded-sm shadow-[0_0_5px_rgba(249,115,22,0.5)]"
                      animate={{ 
                        width: indicatorWidth * 0.75
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <motion.div 
                      className="h-[5px] bg-[#F59E0B] rounded-sm shadow-[0_0_5px_rgba(249,115,22,0.5)]"
                      animate={{ 
                        width: indicatorWidth * 0.25
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </ul>
          </div>

          <div className="hidden md:flex items-center pr-8 md:pr-12">
            {/* Language selector with increased spacing */}
            <div className="text-sm text-zinc-500 mr-10 lg:mr-12">
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

      {/* Mobile menu with animation */}
      <motion.div 
        className="fixed inset-0 bg-white z-40 pt-[80px] px-6"
        initial={{ opacity: 0, y: -50 }}
        animate={{ 
          opacity: mobileMenuOpen ? 1 : 0, 
          y: mobileMenuOpen ? 0 : -50,
          pointerEvents: mobileMenuOpen ? "auto" : "none"
        }}
        transition={{ duration: 0.3 }}
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
      </motion.div>
    </header>
  );
};

export default Navbar;