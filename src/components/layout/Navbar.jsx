import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";

const navItems = [
  { id: "hero", name: "Beranda" },
  { id: "layanan", name: "Layanan" },
  { id: "keunggulan", name: "Keunggulan" },
  { id: "kontak", name: "Kontak Kami" },
  { id: "faq", name: "FAQ" },
];

const Navbar = ({ activeSection, onSectionClick }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [programmaticScroll, setProgrammaticScroll] = useState(false);
  const location = useLocation();
  const programmaticScrollTimer = useRef(null);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (!programmaticScroll) {
        if (y > lastScrollY && y > 50) setVisible(false);
        if (y < lastScrollY && y > 100) setVisible(true);
      }
      if (y <= 50) setVisible(true);
      setLastScrollY(y);
    };
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => { handleScroll(); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.history.scrollRestoration = "auto";
    };
  }, [lastScrollY, programmaticScroll]);

  useEffect(() => { setMobileMenuOpen(false); }, [location]);
  useEffect(() => () => { if (programmaticScrollTimer.current) clearTimeout(programmaticScrollTimer.current); }, []);

  const handleNavClick = (item) => {
    setVisible(true);
    setProgrammaticScroll(true);
    if (item.id === "kontak") {
      navigate("/kontak");
    } else if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(item.id);
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 300);
    } else {
      onSectionClick?.(item.id);
    }
    if (programmaticScrollTimer.current) clearTimeout(programmaticScrollTimer.current);
    programmaticScrollTimer.current = setTimeout(() => setProgrammaticScroll(false), 1000);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <header
      className={clsx(
        "w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "shadow-md" : "",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
      style={{ backgroundColor: "#FDFEFF", borderBottom: scrolled ? "1px solid #E5E7EB" : "none" }}
    >
      {/* Desktop navbar */}
      <div
        className="mx-auto hidden lg:flex items-center justify-between"
        style={{
          maxWidth: 1440,
          padding: "0 72px",
          width: "100%",
          height: 68,
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
        {/* Left: Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
          <img
            src="/logo/ruang-diri-full.png"
            alt="Ruang Diri"
            style={{ height: 36, objectFit: "contain" }}
          />
        </Link>

        {/* Center: Nav links */}
        <nav className="flex items-center" style={{ gap: 32 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="cursor-pointer whitespace-nowrap hover:opacity-80"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 15,
                lineHeight: "1.4em",
                fontWeight: activeSection === item.id ? 600 : 400,
                color: "#0F172B",
                background: "none",
                border: "none",
                padding: 0,
                transition: "opacity 0.2s",
              }}
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Right: Login button */}
        <Link
          to="/login"
          className="flex items-center justify-center hover:opacity-90 transition-opacity"
          style={{
            gap: 8,
            padding: "10px 24px",
            borderRadius: 56,
            backgroundColor: "#227BCC",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <img src="/landing/login-icon.svg" alt="" style={{ width: 16, height: 16 }} />
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            lineHeight: "1.2em",
            color: "#FDFEFF",
          }}>Masuk</span>
        </Link>
      </div>

      {/* Mobile header */}
      <div
        className="w-full flex lg:hidden items-center justify-between"
        style={{ padding: "12px 20px" }}
      >
        <Link to="/" className="flex-shrink-0" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo/ruang-diri-full.png" alt="Ruang Diri" style={{ height: 32, objectFit: "contain" }} />
        </Link>
        <button
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: "none", border: "none" }}
        >
          <span className="material-icons text-[#227BCC] text-3xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile menu — drops down from navbar, inside header so z-index is inherited */}
      {mobileMenuOpen && (
        <div
          className="absolute top-full left-0 right-0 lg:hidden shadow-lg"
          style={{ backgroundColor: "#FDFEFF", borderTop: "1px solid #E5E7EB" }}
        >
          <ul className="flex flex-col px-6 py-2">
            {navItems.map((item) => (
              <li key={item.id} className="w-full">
                <button
                  onClick={() => handleNavClick(item)}
                  className="block w-full text-left py-4 cursor-pointer"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: activeSection === item.id ? 600 : 400,
                    color: activeSection === item.id ? "#227BCC" : "#0F172B",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid #f3f4f6",
                    fontSize: 16,
                    width: "100%",
                  }}
                >
                  {item.name}
                </button>
              </li>
            ))}
            <li className="w-full py-4 flex justify-center">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full max-w-[280px] py-3 rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#227BCC", color: "#FDFEFF", fontSize: 16, fontWeight: 600, textDecoration: "none" }}
              >
                <img src="/landing/login-icon.svg" alt="" className="w-4 h-4" />
                Masuk
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
