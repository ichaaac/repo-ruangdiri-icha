import React from "react";
import { Link } from "react-router-dom";

const FONT = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const COLORS = { label: "#0F172B", desc: "#3F4555" };

const menuLinks = [
  { name: "Beranda", id: "hero" },
  { name: "Keunggulan", id: "keunggulan" },
  { name: "Fitur", id: "layanan" },
  { name: "Kontak Kami", id: "kontak" },
  { name: "FAQ", id: "faq" },
];

const contactItems = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.label} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    text: "icha@ariakarsa.com",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.label} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    text: "+62 815-4232-2127",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.label} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    text: "Jakarta, Indonesia",
  },
];

const socialIcons = [
  <svg key="li" width="20" height="20" viewBox="0 0 24 24" fill={COLORS.label}>
    <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>,
  <svg key="ig" width="20" height="20" viewBox="0 0 24 24" fill={COLORS.label}>
    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z"/>
  </svg>,
  <svg key="fb" width="20" height="20" viewBox="0 0 24 24" fill={COLORS.label}>
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.19 2.24.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
  </svg>,
];

const Footer = () => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <footer style={{ backgroundColor: "#EDF2FF", width: "100%" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "64px 72px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
          {/* Logo & Description */}
          <div style={{ flex: "0 0 auto", maxWidth: 320 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <img src="/logo/ruang-diri-full.png" alt="Ruang Diri" style={{ height: 40, objectFit: "contain" }} />
            </Link>
            <p style={{ ...FONT, marginTop: 16, fontWeight: 400, fontSize: 16, lineHeight: "22.4px", color: COLORS.desc }}>
              Ruang Diri adalah platform kesehatan mental yang membantu kamu memahami perasaan, mengelola pikiran, dan menjalani hari dengan lebih tenang melalui layanan konseling.
            </p>
          </div>

          {/* Menu List */}
          <div>
            <h4 style={{ ...FONT, fontWeight: 600, fontSize: 18, lineHeight: "25.2px", color: COLORS.label, marginBottom: 16 }}>
              Menu List
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {menuLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollTo(link.id)}
                    style={{
                      ...FONT, background: "none", border: "none", cursor: "pointer", padding: 0,
                      fontWeight: 400, fontSize: 16, lineHeight: "22.4px", color: COLORS.desc, transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = COLORS.label)}
                    onMouseLeave={(e) => (e.target.style.color = COLORS.desc)}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak Kami */}
          <div>
            <h4 style={{ ...FONT, fontWeight: 600, fontSize: 18, lineHeight: "25.2px", color: COLORS.label, marginBottom: 16 }}>
              Kontak Kami
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {contactItems.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon}
                  </div>
                  <span style={{ ...FONT, fontWeight: 400, fontSize: 16, color: COLORS.desc }}>{item.text}</span>
                </li>
              ))}
            </ul>

            {/* Social Media Icons */}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {socialIcons.map((icon, i) => (
                <div
                  key={i}
                  style={{
                    width: 40, height: 40, borderRadius: 8, backgroundColor: "#FFFFFF",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ borderTop: "1px solid rgba(15,23,43,0.1)", marginTop: 48 }}>
        <div style={{
          maxWidth: 1440, margin: "0 auto", padding: "24px 72px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <g clipPath="url(#clip0_footer)">
              <path d="M10.0003 18.3332C14.6027 18.3332 18.3337 14.6022 18.3337 9.99984C18.3337 5.39746 14.6027 1.6665 10.0003 1.6665C5.39795 1.6665 1.66699 5.39746 1.66699 9.99984C1.66699 14.6022 5.39795 18.3332 10.0003 18.3332Z" stroke="#0B1F3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.2005 13.9582C8.25052 13.9582 6.66719 12.1832 6.66719 10.0082C6.66719 7.83317 8.25052 6.05817 10.2005 6.05817C11.1588 6.05817 12.0838 6.4165 12.8088 7.03317C13.0672 7.25817 13.0922 7.65817 12.8672 7.9165C12.6422 8.17484 12.2422 8.19985 11.9838 7.97485C11.4922 7.54151 10.8588 7.29985 10.2005 7.29985C8.70883 7.29985 7.49219 8.5165 7.49219 10.0082C7.49219 11.4998 8.70883 12.7165 10.2005 12.7165C10.8505 12.7165 11.4922 12.4748 11.9838 12.0415C12.2422 11.8165 12.6422 11.8415 12.8672 12.0998C13.0922 12.3582 13.0672 12.7582 12.8088 12.9832C12.0838 13.6082 11.1588 13.9582 10.2005 13.9582Z" fill="#0B1F3B" />
            </g>
            <defs>
              <clipPath id="clip0_footer">
                <rect width="20" height="20" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <span style={{ ...FONT, fontWeight: 400, fontSize: 16, lineHeight: "22.4px", color: "#0B1F3B" }}>
            2026 Ruang Diri. All right reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
