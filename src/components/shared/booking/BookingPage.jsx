// src/components/shared/booking/BookingPage.jsx

import { useNavigate } from "react-router-dom"
import { useBooking } from "./hooks/useBooking"

const BookingPage = ({ userType = "student", onMethodSelect }) => {
  const navigate = useNavigate()
  const { counselingMethods, loading, errors } = useBooking(userType)

  // Function to get the appropriate image based on method type
  const getMethodImage = (method) => {
    // Map method names/types to specific images
    const methodName = method.name?.toLowerCase() || method.type?.toLowerCase() || ""
    
    if (methodName.includes("luring") || methodName.includes("tatap muka") || methodName.includes("offline")) {
      return "/booking-luring.png"
    } else if (methodName.includes("daring") || methodName.includes("online") || methodName.includes("video")) {
      return "/booking-daring.png"
    } else if (methodName.includes("chat") || methodName.includes("pesan") || methodName.includes("text")) {
      return "/booking-chat.png"
    }
    
    // Fallback: use method.id or index to determine image
    if (method.id === 1 || method.id === "luring") {
      return "/booking-luring.png"
    } else if (method.id === 2 || method.id === "daring") {
      return "/booking-daring.png"
    } else if (method.id === 3 || method.id === "chat") {
      return "/booking-chat.png"
    }
    
    // Default fallback
    return "/booking-luring.png"
  }

  const handleCardClick = (method) => {
    console.log("Method selected:", method)
    console.log("User type:", userType)

    // If we have a callback (used in container), call it
    if (onMethodSelect) {
      onMethodSelect(method)
      return
    }

    // For standalone usage, navigate to booking session
    navigate(`/booking-session/${userType}`, {
      state: { selectedMethod: method },
      replace: false,
    })
  }

  if (loading.methods) {
    return (
      <div className="relative bg-white h-[810px] w-full overflow-hidden flex items-center justify-center font-sans">
        {/* Background SVG */}
        <div className="absolute top-0 left-0 w-full h-96 overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 405"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <rect width="1440" height="405" fill="url(#paint0_linear_6299_998)" />
            <defs>
              <linearGradient
                id="paint0_linear_6299_998"
                x1="720"
                y1="0"
                x2="720"
                y2="405"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#91D9E1" />
                <stop offset="1" stopColor="#5E6EC3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex items-center space-x-2 z-10">
          <span className="material-icons animate-spin text-white">sync</span>
          <span className="text-white">Loading counseling options...</span>
        </div>
      </div>
    )
  }

  if (errors.methods) {
    return (
      <div className="relative bg-white h-[810px] w-full overflow-hidden flex items-center justify-center font-sans">
        {/* Background SVG */}
        <div className="absolute top-0 left-0 w-full h-96 overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 405"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <rect width="1440" height="405" fill="url(#paint0_linear_6299_998)" />
            <defs>
              <linearGradient
                id="paint0_linear_6299_998"
                x1="720"
                y1="0"
                x2="720"
                y2="405"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#91D9E1" />
                <stop offset="1" stopColor="#5E6EC3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="text-center z-10">
          <span className="material-icons text-red-500 text-4xl mb-4 block">error</span>
          <p className="text-red-500">Error loading counseling options</p>
          <p className="text-sm text-gray-500">{errors.methods?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white h-[810px] w-full overflow-hidden font-sans">
      {/* Background SVG */}
      <div className="absolute top-0 left-0 w-full h-96 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 405"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="1440" height="405" fill="url(#paint0_linear_6299_998)" />
          <defs>
            <linearGradient
              id="paint0_linear_6299_998"
              x1="720"
              y1="0"
              x2="720"
              y2="405"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#91D9E1" />
              <stop offset="1" stopColor="#5E6EC3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-[26px] w-24 z-10 max-md:relative max-md:left-1/2 max-md:transform max-md:-translate-x-1/2 max-md:top-4 max-md:mb-4">
        <img
          src="/logo/ruang-diri-logo-white.svg"
          alt="RuangDiri Logo"
          className="w-full h-auto"
          onError={(e) => {
            e.target.style.display = "none"
            e.target.parentNode.innerHTML =
              '<div class="bg-white bg-opacity-20 rounded-lg flex items-center justify-center w-full h-16"><span class="text-white font-bold text-lg">LOGO</span></div>'
          }}
        />
      </div>

      {/* Title */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-[173px] z-10 max-md:relative max-md:left-0 max-md:top-8 max-md:text-center max-md:px-4">
        <h1 className="text-white text-4xl font-bold font-['Public_Sans'] max-md:text-3xl max-sm:text-2xl">
          Pilih Jenis Konseling
        </h1>
      </div>

      {/* Separator Line */}
      <div className="absolute w-48 h-0 left-1/2 transform -translate-x-1/2 top-[243px] outline outline-[0.50px] outline-offset-[-0.25px] outline-white z-10 max-md:relative max-md:left-1/2 max-md:transform max-md:-translate-x-1/2 max-md:top-4 max-md:mb-8"></div>

      {/* Counseling Type Cards */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-[284px] z-10 inline-flex justify-start items-center gap-5 max-md:relative max-md:left-0 max-md:top-8 max-md:flex-col max-md:px-4 max-sm:gap-4">
        {counselingMethods?.map((method, index) => (
          <div
            key={method.id}
            onClick={() => handleCardClick(method)}
            className="w-72 h-80 bg-gradient-to-b from-sky-100 to-white rounded-2xl shadow-[0px_5px_11px_0px_rgba(0,0,0,0.07)] shadow-[0px_20px_20px_0px_rgba(0,0,0,0.06)] shadow-[0px_46px_27px_0px_rgba(0,0,0,0.04)] shadow-[0px_81px_32px_0px_rgba(0,0,0,0.01)] shadow-[0px_127px_35px_0px_rgba(0,0,0,0.00)] flex flex-col cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 max-md:w-full max-md:max-w-md overflow-hidden"
          >
            {/* Image Section */}
            <div className="w-full">
              <img
                className="w-full h-48 rounded-tl-2xl rounded-tr-2xl object-cover"
                src={getMethodImage(method)}
                alt={`${method.name} counseling`}
                onError={(e) => {
                  // Fallback if image fails to load
                  e.target.src = "/placeholder.svg?height=192&width=288"
                }}
              />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 py-4">
              <div className="text-center text-[#488BBA] text-base font-bold font-['Public_Sans'] mb-3">
                {method.name}
              </div>
              <div className="text-neutral-600 text-sm font-normal font-['Public_Sans'] leading-tight text-center">
                {method.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[51px] z-10 text-center justify-start text-zinc-500 text-xs font-normal font-['Public_Sans'] max-md:relative max-md:left-0 max-md:bottom-0 max-md:top-12 max-md:pb-8">
        Ruang Diri • 2025
      </div>
    </div>
  )
}

export default BookingPage