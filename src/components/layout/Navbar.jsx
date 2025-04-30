import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return "Beranda";
    if (path.includes("/layanan")) return "Layanan Kami";
    if (path.includes("/tentang")) return "Tentang Kami";
    if (path.includes("/assesmen")) return "Assesmen Diri";
    if (path.includes("/artikel")) return "Artikel";
    return "";
  };
  
  const activeTab = getActiveTab();

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

  // Close mobile menu when changing route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navItems = [
    { name: "Beranda", path: "/" },
    { name: "Layanan Kami", scrollTo: "services" },
    { name: "Tentang Kami", path: "/tentang" },
    { name: "Assesmen Diri", path: "/assesmen" },
    { name: "Artikel", path: "/artikel" }
  ];

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
            {/* Logo - positioned further left */}
            <div className="pl-2 md:pl-4">
              <Link to="/">
                <img
                  src="/logo/ruang-diri-logo.png"
                  alt="Ruang Diri Logo"
                  className="w-[100px] h-[89px] md:w-[80px] md:h-[70px] sm:w-[70px] sm:h-[60px]"
                />
              </Link>
            </div>

            <ul className="hidden md:flex ml-16 lg:ml-24">
              {navItems.map((item) => (
                <li key={item.name} className="relative mx-5 lg:mx-7">
                  <Link 
                    to={item.path} 
                    className={clsx(
                      "text-lg lg:text-xl text-[#8CC3EE] transition-all duration-200 hover:font-bold",
                      activeTab === item.name ? "font-extrabold" : "hover:text-[#488BBE]"
                    )}
                  >
                    {item.name}
                  </Link>
                  {activeTab === item.name && (
                    <div className="flex absolute left-0 gap-1 bottom-[-7px]">
                      <div className="bg-orange-400 h-[5px] w-[58px] rounded-sm shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
                      <div className="bg-orange-400 h-[5px] w-[19px] rounded-sm shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:flex items-center pr-8 md:pr-12">
            {/* Language selector with increased spacing */}
            <div className="text-sm text-zinc-500 mr-10 lg:mr-12">
              <span className="font-bold text-[#8CC3EE]">ID</span>
              <span className="mx-2">/</span>
              <span>EN</span>
            </div>
            <div className="flex items-center">
              <Link 
                to="/login" 
                className="px-7 py-2.5 h-11 text-sm font-bold text-[#8CC3EE] bg-white border border-[#8CC3EE] rounded-[44px] hover:bg-[#E2F9FF] transition-colors flex items-center justify-center mr-5"
              >
                Masuk
              </Link>
              <Link 
                to="/register" 
                className="px-7 py-2.5 h-11 text-sm font-bold text-white bg-[#8CC3EE] rounded-[44px] hover:bg-[#488BBE] transition-colors flex items-center justify-center"
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
            <span className="material-icons text-[#8CC3EE] text-3xl">
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
            <li key={item.name} className="w-full">
              <Link 
                to={item.path} 
                className={clsx(
                  "block text-xl py-4 text-center transition-all duration-200 border-b border-gray-100",
                  activeTab === item.name 
                    ? "font-extrabold text-[#488BBE]" 
                    : "text-[#8CC3EE] hover:text-[#488BBE]"
                )}
              >
                {item.name}
              </Link>
            </li>
          ))}
          
          <li className="w-full pt-4 flex justify-center">
            <div className="text-base text-zinc-500">
              <span className="font-bold text-[#8CC3EE]">ID</span>
              <span className="mx-3">/</span>
              <span>EN</span>
            </div>
          </li>
          
          <li className="w-full py-4 flex flex-col gap-4 items-center">
            <Link 
              to="/login" 
              className="w-full max-w-[250px] py-3 text-center text-[#8CC3EE] bg-white border border-[#8CC3EE] rounded-[44px] hover:bg-[#E2F9FF] transition-colors"
            >
              Masuk
            </Link>
            <Link 
              to="/register" 
              className="w-full max-w-[250px] py-3 text-center text-white bg-[#8CC3EE] rounded-[44px] hover:bg-[#488BBE] transition-colors"
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