import React from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section id="hero" className="w-full" style={{ padding: "0 48px" }}>
      <div
        className="relative w-full overflow-hidden"
        style={{ borderRadius: 24 }}
      >
        {/* Background image */}
        <img
          src="/landing/hero-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover" }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(12, 22, 49, 0.45)" }} />

        {/* Content: column, center, gap 60px, padding 140px 80px */}
        <div
          className="relative z-10 flex flex-col items-center"
          style={{ padding: "100px 48px", gap: 40 }}
        >
          {/* Title block: column, center, gap 24px, width 1280 */}
          <div className="flex flex-col items-center w-full" style={{ maxWidth: 1280, gap: 24 }}>
            <h1
              className="w-full"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 500,
                fontSize: 68,
                lineHeight: "1.4em",
                textAlign: "center",
                color: "#FDFEFF",
              }}
            >
              Screening Digital,
              <br />
              Deteksi Kesehatan Mental
            </h1>
            <p
              style={{
                maxWidth: 852,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 500,
                fontSize: 22,
                lineHeight: "1.6em",
                textAlign: "center",
                color: "#F4F4F4",
              }}
            >
              Pantau kesejahteraan anggota organisasi Anda melalui sistem screening digital dan identifikasi langsung. Solusi strategis dari Ruang Diri untuk produktivitas yang berkelanjutan.
            </p>
          </div>

          {/* CTA Button: row, center, gap 8px, padding 16px 24px, radius 100px */}
          <button
            onClick={() => navigate("/kontak")}
            className="flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
            style={{
              gap: 8,
              padding: "16px 24px",
              borderRadius: 100,
              backgroundColor: "#227BCC",
              border: "none",
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: 20,
                lineHeight: "1.4em",
                color: "#FDFEFF",
                textAlign: "center",
              }}
            >
              Konsultasi Sekarang
            </span>
            <img src="/landing/arrow-right.svg" alt="" style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
