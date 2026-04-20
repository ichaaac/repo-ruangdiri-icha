import React from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section id="hero" className="w-full px-4 md:px-12">
      <div className="relative w-full overflow-hidden rounded-2xl">
        <img
          src="/landing/hero-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(12, 22, 49, 0.45)" }} />

        <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 md:py-24 lg:py-[100px] gap-8 md:gap-10">
          <div className="flex flex-col items-center w-full gap-4 md:gap-6" style={{ maxWidth: 1280 }}>
            <h1
              className="w-full"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 500,
                lineHeight: "1.4em",
                color: "#FDFEFF",
              }}
            >
              <span className="block text-3xl md:text-5xl lg:text-[68px]">
                Screening Digital,
              </span>
              <span className="block text-3xl md:text-5xl lg:text-[68px]">
                Deteksi Kesehatan Mental
              </span>
            </h1>
            <p
              className="text-base md:text-lg lg:text-[22px]"
              style={{
                maxWidth: 852,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 400,
                lineHeight: "1.6em",
                color: "#F4F4F4",
              }}
            >
              Pantau kesejahteraan anggota organisasi Anda melalui sistem screening digital dan identifikasi langsung. Solusi strategis dari Ruang Diri untuk produktivitas yang berkelanjutan.
            </p>
          </div>

          <button
            onClick={() => navigate("/kontak")}
            className="flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
            style={{
              padding: "14px 24px",
              borderRadius: 100,
              backgroundColor: "#227BCC",
              border: "none",
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: 18,
                lineHeight: "1.4em",
                color: "#FDFEFF",
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
