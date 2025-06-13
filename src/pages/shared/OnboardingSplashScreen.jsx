import React from "react";

function OnboardingSplashScreen() {
  return (
    <div className="overflow-hidden font-bold bg-white">
      <div className="flex relative flex-col w-full min-h-[810px] max-md:max-w-full">
        <svg
          className="object-cover absolute inset-0 size-full"
          viewBox="0 0 1200 810"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#1E40AF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.9" />
            </linearGradient>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="white" fillOpacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#backgroundGradient)" />
          <rect width="100%" height="100%" fill="url(#dots)" />
          <circle cx="200" cy="150" r="80" fill="white" fillOpacity="0.05" />
          <circle cx="1000" cy="300" r="120" fill="white" fillOpacity="0.03" />
          <circle cx="800" cy="600" r="60" fill="white" fillOpacity="0.08" />
          <path
            d="M0,400 Q300,350 600,400 T1200,400 L1200,810 L0,810 Z"
            fill="white"
            fillOpacity="0.1"
          />
        </svg>

        <main className="flex relative flex-col justify-center items-center px-20 py-28 w-full bg-white bg-opacity-20 max-md:px-5 max-md:py-24 max-md:max-w-full">
          <div className="flex flex-col items-center mb-0 w-full max-w-[1041px] max-md:mb-2.5 max-md:max-w-full">
            <header className="text-7xl font-extrabold leading-none text-blue-500 max-md:max-w-full max-md:text-4xl">
              Selamat <span style={{color: "rgba(72,139,190,1)"}}>Datang</span>
            </header>

            <h1 className="mt-5 text-3xl leading-3 text-neutral-700">
              SMA 007 Veteran Jakarta
            </h1>

            <svg
              className="object-contain self-stretch mt-14 w-full aspect-[3.11] max-md:mt-10 max-md:max-w-full"
              viewBox="0 0 800 257"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="illustrationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1E40AF" />
                </linearGradient>
              </defs>

              {/* School building illustration */}
              <rect x="50" y="80" width="200" height="150" fill="url(#illustrationGradient)" rx="8" />
              <rect x="70" y="100" width="30" height="40" fill="white" fillOpacity="0.9" />
              <rect x="120" y="100" width="30" height="40" fill="white" fillOpacity="0.9" />
              <rect x="170" y="100" width="30" height="40" fill="white" fillOpacity="0.9" />
              <rect x="70" y="160" width="30" height="40" fill="white" fillOpacity="0.9" />
              <rect x="120" y="160" width="30" height="40" fill="white" fillOpacity="0.9" />
              <rect x="170" y="160" width="30" height="40" fill="white" fillOpacity="0.9" />
              <rect x="130" y="200" width="40" height="30" fill="#FEF3C7" />

              {/* Flag pole */}
              <line x1="280" y1="50" x2="280" y2="200" stroke="#374151" strokeWidth="4" />
              <rect x="285" y="50" width="40" height="25" fill="#EF4444" />
              <rect x="285" y="75" width="40" height="25" fill="white" />

              {/* Students illustration */}
              <circle cx="400" cy="180" r="15" fill="#F59E0B" />
              <rect x="390" y="195" width="20" height="35" fill="#3B82F6" />
              <circle cx="450" cy="180" r="15" fill="#F59E0B" />
              <rect x="440" y="195" width="20" height="35" fill="#EF4444" />
              <circle cx="500" cy="180" r="15" fill="#F59E0B" />
              <rect x="490" y="195" width="20" height="35" fill="#10B981" />

              {/* Books */}
              <rect x="550" y="200" width="15" height="20" fill="#8B5CF6" />
              <rect x="570" y="195" width="15" height="25" fill="#F59E0B" />
              <rect x="590" y="190" width="15" height="30" fill="#EF4444" />

              {/* Decorative elements */}
              <circle cx="650" cy="100" r="25" fill="#FEF3C7" fillOpacity="0.7" />
              <path d="M640,100 L650,85 L660,100 L650,115 Z" fill="#F59E0B" />

              <circle cx="700" cy="150" r="20" fill="#DBEAFE" fillOpacity="0.7" />
              <path d="M692,150 L700,138 L708,150 L700,162 Z" fill="#3B82F6" />

              {/* Ground line */}
              <line x1="0" y1="230" x2="800" y2="230" stroke="#6B7280" strokeWidth="2" strokeDasharray="5,5" />
            </svg>

            <button className="gap-2.5 self-stretch px-5 mt-9 max-w-full text-xl text-white bg-blue-500 rounded-xl shadow-xl leading-[87px] min-h-[42px] w-[398px] hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Mulai Sekarang
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default OnboardingSplashScreen;
