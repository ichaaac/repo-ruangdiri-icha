// src/pages/shared/OnboardingSplashScreen.jsx
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

function OnboardingSplashScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="overflow-hidden font-bold bg-white">
      <div
        className="relative flex flex-col items-center justify-center w-full min-h-screen p-4"
        style={{ backgroundImage: "url('/onboarding-splash-bg.svg')" }}
      >
        <div className="absolute inset-0 w-full h-full bg-white bg-opacity-10" />

        <section className="relative flex flex-col items-center justify-center w-full max-w-5xl px-4 py-8 md:px-10">
          
          <h1 className="text-4xl font-extrabold leading-tight text-center text-[#488BBE] sm:text-5xl md:text-6xl lg:text-7xl">
            Selamat Datang
          </h1>

          <h2 className="mt-4 text-lg font-semibold leading-tight text-center text-neutral-800 md:mt-5 lg:mt-8 sm:text-xl md:text-2xl lg:text-3xl">
            {user?.fullName || "Admiral Keren"}
          </h2>

          <img
            src="/onboarding-splash.svg"
            className="object-contain self-center w-full max-w-3xl mt-10 mb-10 drop-shadow-xl md:mt-12 md:mb-12 lg:mt-16 lg:mb-16"
            alt="Onboarding illustration"
          />

          {/* === BAGIAN INI YANG DIUBAH === */}
          <button
            className="flex items-center justify-center text-xl font-semibold text-white bg-[#488BBA] rounded-lg shadow-xl transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#488BBA]/50"
            // Padding dibuang, diganti style buat ukuran fix
            style={{ width: '398px', height: '42px' }}
            onClick={() => navigate("/onboarding/form")}
          >
            Mulai Sekarang
          </button>
          {/* === BATAS AKHIR PERUBAHAN === */}

        </section>
      </div>
    </main>
  );
}

export default OnboardingSplashScreen;