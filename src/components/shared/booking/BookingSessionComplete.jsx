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
        className="w-full h-72 absolute left-0 top-0 max-md:h-60"
        style={{
          background: "linear-gradient(180deg, rgba(145, 217, 225, 1.00) 0%, rgba(94, 110, 195, 1.00) 100%)",
        }}
      />
      
      {/* Background Card */}
      <div className="w-full max-w-[926px] mx-auto min-h-[660px] absolute left-1/2 top-[150px] transform -translate-x-1/2 bg-white rounded-[10px] shadow-lg px-4 max-md:top-[120px] max-md:min-h-[500px] max-md:left-4 max-md:right-4 max-md:w-auto max-md:transform-none" />

      {/* Logo */}
      <div className="flex flex-col gap-2.5 items-start justify-start w-[100px] absolute left-[50%] top-[26px] overflow-hidden transform -translate-x-1/2 max-md:w-20 max-md:top-[20px]">
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
      <div className="flex flex-col gap-10 items-center justify-start w-full max-w-[848px] mx-auto absolute left-1/2 top-[199px] transform -translate-x-1/2 px-4 max-md:gap-8 max-md:top-[180px] max-md:px-6">
        {/* Success Icon */}
        <div className="w-[166.67px] h-[166.67px] relative flex items-center justify-center max-md:w-24 max-md:h-24">
          <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
            <span className="material-icons text-green-600 max-md:text-4xl" style={{ fontSize: "80px" }}>
              check_circle
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-5 items-center justify-start w-full shrink-0 relative max-md:gap-4">
          {/* Header */}
          <div className="flex flex-col gap-[25px] items-center justify-start shrink-0 relative max-md:gap-4">
            <div className="flex flex-row items-center justify-center w-full shrink-0 relative">
              <div className="text-[#488BBA] text-center font-['Public_Sans'] text-[40px] leading-[74px] font-extrabold relative max-md:text-2xl max-md:leading-[40px] max-sm:text-xl max-sm:leading-[32px]">
                Terima Kasih
              </div>
            </div>
            <div className="text-[#6B7280] text-center font-['Public_Sans'] text-base leading-[22px] font-normal relative w-full max-md:text-sm max-md:px-4 max-sm:text-xs max-sm:px-2">
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
          <div className="rounded-[10px] border-dashed border-[#6B7280] border-[0.25px] pt-[25px] pr-5 pb-[25px] pl-5 flex flex-col gap-2.5 items-center justify-center shrink-0 w-full relative max-md:px-4 max-md:py-4 max-sm:px-3 max-sm:py-3">
            <div className="flex flex-col gap-5 items-start justify-start shrink-0 relative w-full max-md:gap-4">
              {/* Title */}
              <div className="text-[#488BBA] text-left font-['Public_Sans'] text-xl leading-[22px] font-bold relative w-full max-md:text-lg max-sm:text-base">
                Rincian Pemesanan
              </div>

              {/* Details */}
              <div className="flex flex-col gap-[15px] items-start justify-start shrink-0 relative w-full max-md:gap-3 max-sm:gap-2">
                {/* Booking Number */}
                <div className="flex flex-row gap-[67px] items-start justify-between shrink-0 relative w-full max-md:flex-col max-md:items-start max-md:gap-2 max-sm:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-sm:text-xs">
                    Nomor Pemesanan
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-md:font-semibold max-sm:text-xs break-all">
                    {getBookingNumber()}
                  </div>
                </div>

                {/* Time */}
                <div className="flex flex-row gap-[149px] items-start justify-between shrink-0 relative w-full max-md:flex-col max-md:items-start max-md:gap-2 max-sm:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-sm:text-xs">
                    Waktu
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-md:font-semibold max-sm:text-xs break-words">
                    {formatDateTime(bookingData.date, bookingData.startTime, bookingData.endTime)}
                  </div>
                </div>

                {/* Counseling Type */}
                <div className="flex flex-row gap-[91px] items-start justify-between shrink-0 relative w-full max-md:flex-col max-md:items-start max-md:gap-2 max-sm:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-sm:text-xs">
                    Jenis Konseling
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-md:font-semibold max-sm:text-xs">
                    {getCounselingMethodDisplay(bookingData.method)}
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-row gap-[152px] items-start justify-between shrink-0 relative w-full max-md:flex-col max-md:items-start max-md:gap-2 max-sm:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-sm:text-xs">
                    Nama
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-md:font-semibold max-sm:text-xs break-words">
                    {getUserName()}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex flex-row gap-[93px] items-start justify-between shrink-0 relative w-full max-md:flex-col max-md:items-start max-md:gap-2 max-sm:gap-1">
                  <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-sm:text-xs">
                    Nomor Telepon
                  </div>
                  <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-md:font-semibold max-sm:text-xs break-all">
                    {getUserPhone()}
                  </div>
                </div>

                {/* Location (if offline) */}
                {bookingData.method === "offline" && bookingData.location && (
                  <div className="flex flex-row gap-[67px] items-start justify-between shrink-0 relative w-full max-md:flex-col max-md:items-start max-md:gap-2 max-sm:gap-1">
                    <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-sm:text-xs">
                      Lokasi
                    </div>
                    <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-md:font-semibold max-sm:text-xs break-words">
                      {bookingData.location.name}
                    </div>
                  </div>
                )}

                {/* Psychologist */}
                {bookingData.psychologist && (
                  <div className="flex flex-row gap-[67px] items-start justify-between shrink-0 relative w-full max-md:flex-col max-md:items-start max-md:gap-2 max-sm:gap-1">
                    <div className="text-[#6B7280] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-sm:text-xs">
                      Psikolog
                    </div>
                    <div className="text-[#374151] text-left font-['Public_Sans'] text-sm leading-[22px] font-normal relative max-md:text-xs max-md:font-semibold max-sm:text-xs break-words">
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
        className="text-[#488BBA] text-center font-['Public_Sans'] text-[10px] leading-[22px] font-normal absolute left-[50%] bottom-[30px] transform -translate-x-1/2 hover:underline transition-all duration-200 max-md:bottom-[20px] max-md:text-xs max-sm:text-[10px]"
      >
        Kembali ke Beranda
      </button>
    </div>
  )
}

export default BookingSessionComplete