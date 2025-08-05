// src/components/shared/booking/BookingSessionComplete.jsx

import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../../hooks/useAuth"
import { useEffect, useState } from "react"

const BookingSessionComplete = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookingData, setBookingData] = useState(null)

  // Get booking result from location state
  useEffect(() => {
    const result = location.state?.bookingResult
    if (result) {
      setBookingData(result)
    } else {
      // If no booking data, redirect back
      navigate(-1)
    }
  }, [location.state, navigate])

  // Format date and time
  const formatDateTime = (date, startTime, endTime) => {
    try {
      const dateObj = new Date(date)
      const formattedDate = dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      return `${formattedDate} | ${startTime} - ${endTime} WIB`
    } catch (error) {
      return `${date} | ${startTime} - ${endTime} WIB`
    }
  }

  // Get counseling method display name
  const getCounselingMethodDisplay = (method) => {
    const methods = {
      online: "Daring (Zoom)",
      offline: "Luring",
      chat: "Chat",
    }
    return methods[method] || method
  }

  // Get user phone number from organization or user data
  const getUserPhone = () => {
    return user?.organization?.phone || user?.phone || "-"
  }

  // Get user name
  const getUserName = () => {
    return user?.fullName || "-"
  }

  // Generate booking number (in real app, this would come from backend)
  const getBookingNumber = () => {
    if (bookingData?.id) {
      return `RD-${bookingData.id.slice(-5).toUpperCase()}`
    }
    return `RD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  }

  const handleBackToHome = () => {
    // Navigate based on user type
    const userRole = user?.role
    if (userRole === "student") {
      navigate("/user/student/dashboard")
    } else if (userRole === "employee") {
      navigate("/user/employee/dashboard")
    } else {
      navigate("/")
    }
  }

  if (!bookingData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons text-6xl text-gray-400 mb-4 block">hourglass_empty</span>
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#ffffff] min-h-screen relative overflow-hidden w-full">
      {/* Background Gradient */}
      <div
        className="w-full h-60 absolute left-0 top-0 lg:h-72 sm:h-60 xs:h-52"
        style={{
          background: "linear-gradient(180deg, rgba(145, 217, 225, 1.00) 0%, rgba(94, 110, 195, 1.00) 100%)",
        }}
      />
      
      {/* Background Card - Fixed centering */}
      <div className="w-full max-w-[926px] mx-auto min-h-[580px] absolute left-1/2 top-28 transform -translate-x-1/2 bg-white rounded-[10px] shadow-lg px-4 py-6 lg:top-36 lg:min-h-[660px] lg:px-6 sm:top-28 sm:min-h-[520px] xs:top-24 xs:min-h-[480px] xs:px-3 xs:py-4" />

      {/* Logo */}
      <div className="flex flex-col gap-2.5 items-start justify-start w-16 absolute left-1/2 top-4 overflow-hidden transform -translate-x-1/2 lg:w-24 lg:top-7 sm:w-20 sm:top-5 xs:w-16 xs:top-3">
        <img
          className="w-full h-auto relative overflow-visible"
          src="/logo/ruang-diri-logo-white.svg"
          alt="RuangDiri Logo"
          onError={(e) => {
            e.target.style.display = "none"
            e.target.parentNode.innerHTML =
              '<div class="bg-white bg-opacity-20 rounded-lg flex items-center justify-center w-full h-16"><span class="text-white font-bold text-lg">LOGO</span></div>'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 items-center justify-start w-full max-w-[848px] mx-auto absolute left-4 right-4 top-36 px-4 lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:top-48 lg:gap-10 lg:px-6 sm:left-4 sm:right-4 sm:top-36 sm:gap-8 sm:px-4 xs:left-2 xs:right-2 xs:top-32 xs:gap-6 xs:px-3">
        {/* Success Icon */}
        <div className="w-20 h-20 relative flex items-center justify-center lg:w-40 lg:h-40 sm:w-28 sm:h-28 xs:w-16 xs:h-16">
          <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
            <span className="material-icons text-green-600 text-4xl lg:text-7xl sm:text-5xl xs:text-3xl">
              check_circle
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4 items-center justify-start w-full shrink-0 relative lg:gap-5 sm:gap-4 xs:gap-3">
          {/* Header */}
          <div className="flex flex-col gap-4 items-center justify-start shrink-0 relative lg:gap-6 sm:gap-4 xs:gap-3">
            <div className="flex flex-row items-center justify-center w-full shrink-0 relative">
              <div className="text-[#488BBA] text-center font-['Public_Sans'] text-2xl leading-8 font-extrabold relative lg:text-4xl lg:leading-[60px] sm:text-3xl sm:leading-[48px] xs:text-xl xs:leading-7">
                Terima Kasih
              </div>
            </div>
            <div className="text-[#6B7280] text-center font-['Public_Sans'] text-sm leading-5 font-normal relative w-full px-2 lg:text-base lg:leading-6 lg:px-4 sm:text-sm sm:leading-5 sm:px-3 xs:text-xs xs:leading-4 xs:px-2">
              Selamat, sesi konseling berhasil dibuat. Kamu sudah masuk daftar antrean konseling Ruang Diri.
            </div>
          </div>

          {/* Divider */}
          <div
            className="border-solid border-[#6B7280] border-t-[0.25px] border-r-0 border-b-0 border-l-0 shrink-0 w-full h-0 relative"
            style={{
              marginTop: "-0.25px",
              transformOrigin: "0 0",
              transform: "rotate(0deg) scale(1, 1)",
            }}
          />

          {/* Booking Details */}
          <div className="rounded-[10px] border-dashed border-[#6B7280] border-[0.25px] pt-4 pr-3 pb-4 pl-3 flex flex-col gap-2 items-center justify-center shrink-0 w-full relative lg:pt-6 lg:pr-5 lg:pb-6 lg:pl-5 lg:gap-3 sm:pt-4 sm:pr-4 sm:pb-4 sm:pl-4 sm:gap-2 xs:pt-3 xs:pr-2 xs:pb-3 xs:pl-2 xs:gap-2">
            <div className="flex flex-col gap-4 items-start justify-start shrink-0 relative w-full lg:gap-5 sm:gap-4 xs:gap-3">
              {/* Title */}
              <div className="text-[#488BBA] text-left font-['Public_Sans'] text-lg leading-6 font-bold relative w-full lg:text-xl lg:leading-7 sm:text-lg sm:leading-6 xs:text-base xs:leading-5">
                Rincian Pemesanan
              </div>

              {/* Details */}
              <div className="flex flex-col gap-3 items-start justify-start shrink-0 relative w-full lg:gap-4 sm:gap-3 xs:gap-2">
                {/* Booking Number */}
                <div className="flex flex-col gap-1 items-start justify-start shrink-0 relative w-full lg:flex-row lg:gap-16 lg:justify-between sm:flex-col sm:gap-1 xs:flex-col xs:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-5 font-normal relative lg:text-sm lg:leading-6 sm:text-sm sm:leading-5 xs:text-xs xs:leading-4">
                    Nomor Pemesanan
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-5 font-semibold relative break-all lg:text-sm lg:leading-6 lg:font-normal sm:text-sm sm:leading-5 sm:font-semibold xs:text-xs xs:leading-4 xs:font-semibold">
                    {getBookingNumber()}
                  </div>
                </div>

                {/* Time */}
                <div className="flex flex-col gap-1 items-start justify-start shrink-0 relative w-full lg:flex-row lg:gap-16 lg:justify-between sm:flex-col sm:gap-1 xs:flex-col xs:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-5 font-normal relative lg:text-sm lg:leading-6 sm:text-sm sm:leading-5 xs:text-xs xs:leading-4">
                    Waktu
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-5 font-semibold relative break-words lg:text-sm lg:leading-6 lg:font-normal sm:text-sm sm:leading-5 sm:font-semibold xs:text-xs xs:leading-4 xs:font-semibold">
                    {formatDateTime(bookingData.date, bookingData.startTime, bookingData.endTime)}
                  </div>
                </div>

                {/* Counseling Type */}
                <div className="flex flex-col gap-1 items-start justify-start shrink-0 relative w-full lg:flex-row lg:gap-16 lg:justify-between sm:flex-col sm:gap-1 xs:flex-col xs:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-5 font-normal relative lg:text-sm lg:leading-6 sm:text-sm sm:leading-5 xs:text-xs xs:leading-4">
                    Jenis Konseling
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-5 font-semibold relative lg:text-sm lg:leading-6 lg:font-normal sm:text-sm sm:leading-5 sm:font-semibold xs:text-xs xs:leading-4 xs:font-semibold">
                    {getCounselingMethodDisplay(bookingData.method)}
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1 items-start justify-start shrink-0 relative w-full lg:flex-row lg:gap-16 lg:justify-between sm:flex-col sm:gap-1 xs:flex-col xs:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-5 font-normal relative lg:text-sm lg:leading-6 sm:text-sm sm:leading-5 xs:text-xs xs:leading-4">
                    Nama
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-5 font-semibold relative break-words lg:text-sm lg:leading-6 lg:font-normal sm:text-sm sm:leading-5 sm:font-semibold xs:text-xs xs:leading-4 xs:font-semibold">
                    {getUserName()}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1 items-start justify-start shrink-0 relative w-full lg:flex-row lg:gap-16 lg:justify-between sm:flex-col sm:gap-1 xs:flex-col xs:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-5 font-normal relative lg:text-sm lg:leading-6 sm:text-sm sm:leading-5 xs:text-xs xs:leading-4">
                    Nomor Telepon
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-5 font-semibold relative break-all lg:text-sm lg:leading-6 lg:font-normal sm:text-sm sm:leading-5 sm:font-semibold xs:text-xs xs:leading-4 xs:font-semibold">
                    {getUserPhone()}
                  </div>
                </div>

                {/* Location (if offline) */}
                {bookingData.method === "offline" && bookingData.location && (
                  <div className="flex flex-col gap-1 items-start justify-start shrink-0 relative w-full lg:flex-row lg:gap-16 lg:justify-between sm:flex-col sm:gap-1 xs:flex-col xs:gap-1">
                    <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-5 font-normal relative lg:text-sm lg:leading-6 sm:text-sm sm:leading-5 xs:text-xs xs:leading-4">
                      Lokasi
                    </div>
                    <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-5 font-semibold relative break-words lg:text-sm lg:leading-6 lg:font-normal sm:text-sm sm:leading-5 sm:font-semibold xs:text-xs xs:leading-4 xs:font-semibold">
                      {bookingData.location.name}
                    </div>
                  </div>
                )}

                {/* Psychologist */}
                {bookingData.psychologist && (
                  <div className="flex flex-col gap-1 items-start justify-start shrink-0 relative w-full lg:flex-row lg:gap-16 lg:justify-between sm:flex-col sm:gap-1 xs:flex-col xs:gap-1">
                    <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-5 font-normal relative lg:text-sm lg:leading-6 sm:text-sm sm:leading-5 xs:text-xs xs:leading-4">
                      Psikolog
                    </div>
                    <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-5 font-semibold relative break-words lg:text-sm lg:leading-6 lg:font-normal sm:text-sm sm:leading-5 sm:font-semibold xs:text-xs xs:leading-4 xs:font-semibold">
                      {bookingData.psychologist.fullName || bookingData.psychologist.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Home Button */}
      <button
        onClick={handleBackToHome}
        className="text-[#488BBA] text-center font-['Public_Sans'] text-xs leading-5 font-normal absolute left-1/2 bottom-6 transform -translate-x-1/2 hover:underline transition-all duration-200 lg:text-sm lg:leading-6 lg:bottom-8 sm:text-xs sm:leading-5 sm:bottom-6 xs:text-[10px] xs:leading-4 xs:bottom-4"
      >
        Kembali ke Beranda
      </button>
    </div>
  )
}

export default BookingSessionComplete