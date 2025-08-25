// src/components/shared/booking/BookingSessionComplete.jsx - UPDATED RESPONSIVE VERSION

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
      // Handle different possible data structures
      let processedData = result
      
      // Check for multiple levels of nesting
      if (result.data && typeof result.data === 'object') {
        processedData = result.data
        
        // Check for second level nesting
        if (processedData.data && typeof processedData.data === 'object') {
          processedData = processedData.data
        }
      }
      
      setBookingData(processedData)
    } else {
      // If no booking data, redirect back
      navigate(-1)
    }
  }, [location.state, navigate])

  // Format date and time with backend data structure handling
  const formatDateTime = (bookingData) => {
    try {
      if (!bookingData) {
        return "Data tidak tersedia"
      }

      // First, check if we have pre-formatted dateTimeFormatted from API (but fix undefined times)
      if (bookingData.dateTimeFormatted && 
          bookingData.dateTimeFormatted.date &&
          bookingData.dateTimeFormatted.time && 
          !bookingData.dateTimeFormatted.time.includes('undefined')) {
        return `${bookingData.dateTimeFormatted.date} | ${bookingData.dateTimeFormatted.time}`
      }

      // Handle backend structure with date/endDate ISO timestamps
      let dateValue = null
      let startTime = null
      let endTime = null

      if (bookingData.date && bookingData.endDate) {
        const startDate = new Date(bookingData.date)
        const endDate = new Date(bookingData.endDate)
        
        // Extract date in YYYY-MM-DD format
        dateValue = startDate.toISOString().split('T')[0]
        
        // Extract times in HH:mm format (convert from UTC to local timezone)
        const timeOptions = { 
          timeZone: bookingData.originalTimezone || 'Asia/Jakarta',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }
        
        startTime = startDate.toLocaleTimeString('en-US', timeOptions)
        endTime = endDate.toLocaleTimeString('en-US', timeOptions)
      } else {
        // Fallback: try original structure
        const { date, startTime: st, endTime: et } = bookingData
        dateValue = date
        startTime = st
        endTime = et
      }
      
      if (!dateValue) {
        return "Tanggal tidak tersedia"
      }
      
      if (!startTime || !endTime) {
        return `${formatDateOnly(dateValue)} | Waktu tidak tersedia`
      }

      const dateObj = new Date(dateValue)
      const formattedDate = dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      
      // Format time - handle both "HH:mm" and "HH:mm:ss" formats
      const formatTime = (time) => {
        if (!time) return ""
        const timeStr = String(time)
        return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr
      }
      
      const formattedStartTime = formatTime(startTime)
      const formattedEndTime = formatTime(endTime)
      
      return `${formattedDate} | ${formattedStartTime} - ${formattedEndTime} WIB`
    } catch (error) {
      // Last resort fallback
      return `${bookingData?.date || "Unknown date"} | ${bookingData?.startTime || "Unknown"} - ${bookingData?.endTime || "Unknown"} WIB`
    }
  }

  // Helper function to format date only
  const formatDateOnly = (date) => {
    try {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    } catch (error) {
      return date
    }
  }

  // Get counseling method display name - UPDATED
  const getCounselingMethodDisplay = (method) => {
    const methods = {
      online: "Daring (Zoom)",
      offline: "Luring",
      chat: "Chat",
    }
    return methods[method] || method || "Konseling"
  }

  // Get user phone number from organization or user data
  const getUserPhone = () => {
    return user?.organization?.phone || user?.phone || "-"
  }

  // Get user name
  const getUserName = () => {
    return user?.fullName || user?.name || "-"
  }

  // Generate booking number
  const getBookingNumber = () => {
    if (bookingData?.id) {
      return `RD-${String(bookingData.id).padStart(5, '0')}`
    }
    if (bookingData?.bookingId) {
      return `RD-${String(bookingData.bookingId).padStart(5, '0')}`
    }
    // Generate from date and time if no ID available
    if (bookingData?.date) {
      const dateStr = new Date(bookingData.date).toISOString().split('T')[0].replace(/-/g, '')
      return `RD-${dateStr.slice(-4)}${Math.random().toString(36).substr(2, 2).toUpperCase()}`
    }
    return `RD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  }

  const handleBackToHome = () => {
    // Navigate based on user type
    const userRole = user?.role
    if (userRole === "student") {
      navigate("/user/student/screening")
    } else if (userRole === "employee") {
      navigate("/user/employee/screening")
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
          <p className="text-sm text-gray-500 mt-2">Waiting for booking data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[810px] relative bg-white overflow-hidden">
      {/* Background Gradient */}
      <div className="w-full h-72 left-0 top-0 absolute bg-gradient-to-b from-teal-200 to-indigo-500" />
      
      {/* Main Content Card with Shadow */}
      <div className="absolute left-[271px] top-[150px] max-md:left-[20px] max-md:right-[20px] max-md:top-[120px] max-sm:left-[10px] max-sm:right-[10px]">
        <div className="w-[898px] max-md:w-full bg-white rounded-[15px] shadow-[0px_12px_27px_0px_rgba(0,0,0,0.07)] shadow-[0px_49px_49px_0px_rgba(0,0,0,0.06)] shadow-[0px_111px_67px_0px_rgba(0,0,0,0.04)] shadow-[0px_198px_79px_0px_rgba(0,0,0,0.01)] shadow-[0px_309px_86px_0px_rgba(0,0,0,0.00)] min-h-[525px] px-[79px] py-[25px] max-md:px-[30px] max-md:py-[20px] max-sm:px-[20px] max-sm:py-[15px]">
          
          {/* Logo */}
          <div className="w-24 absolute left-1/2 top-[26px] transform -translate-x-1/2 max-md:w-20 max-md:top-[20px] max-sm:w-16 max-sm:top-[15px]">
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

          {/* Content Container */}
          <div className="w-[740px] max-md:w-full left-[79px] max-md:left-0 top-[74px] max-md:top-[60px] max-sm:top-[50px] absolute flex flex-col justify-start items-center gap-10 max-md:gap-8 max-sm:gap-6">
            
            {/* Success Icon */}
            <div className="w-[168px] h-[167px] max-md:w-[120px] max-md:h-[120px] max-sm:w-[80px] max-sm:h-[80px] flex items-center justify-center">
              <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                <span className="material-icons text-[#9BCA61] text-[120px] max-md:text-[80px] max-sm:text-[60px]">
                  check_circle
                </span>
              </div>
            </div>

            {/* Main Content Section */}
            <div className="self-stretch flex flex-col justify-start items-center gap-5 max-md:gap-4 max-sm:gap-3">
              
              {/* Header Section */}
              <div className="self-stretch flex flex-col justify-start items-center gap-6 max-md:gap-4 max-sm:gap-3">
                <div className="self-stretch inline-flex justify-center items-center">
                  <div className="text-[#488BBA] text-4xl font-extrabold font-['Public_Sans'] leading-[74px] max-md:text-3xl max-md:leading-[50px] max-sm:text-2xl max-sm:leading-[40px]">
                    Terima Kasih
                  </div>
                </div>
                <div className="self-stretch text-center text-[#6B7280] text-base font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:leading-5 max-sm:text-xs max-sm:leading-4">
                  Selamat, sesi konseling berhasil dibuat. Kamu sudah masuk daftar antrean konseling Ruang Diri.
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-0 outline outline-[0.25px] outline-offset-[-0.12px] outline-[#6B7280]"></div>

              {/* Booking Details Card */}
              <div className="w-full px-5 py-6 max-md:px-4 max-md:py-5 max-sm:px-3 max-sm:py-4 rounded-[10px] outline outline-[0.25px] outline-dashed outline-offset-[-0.25px] outline-[#6B7280] flex flex-col justify-center items-center gap-2.5">
                
                <div className="self-stretch flex flex-col justify-start items-start gap-5 max-md:gap-4 max-sm:gap-3">
                  
                  {/* Title */}
                  <div className="self-stretch text-[#488BBA] text-xl font-bold font-['Public_Sans'] leading-snug max-md:text-lg max-md:leading-6 max-sm:text-base max-sm:leading-5">
                    Rincian Pemesanan
                  </div>

                  {/* Details Grid */}
                  <div className="self-stretch flex flex-col justify-start items-start gap-3.5 max-md:gap-3 max-sm:gap-2.5">
                    
                    {/* Booking Number */}
                    <div className="self-stretch inline-flex justify-between items-start max-md:flex-col max-md:gap-1 max-sm:gap-0.5">
                      <div className="text-[#6B7280] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-sm:text-xs">
                        Nomor Pemesanan
                      </div>
                      <div className="text-[#374151] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:font-semibold max-sm:text-xs max-sm:font-semibold break-all">
                        {getBookingNumber()}
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="self-stretch inline-flex justify-between items-start max-md:flex-col max-md:gap-1 max-sm:gap-0.5">
                      <div className="text-[#6B7280] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-sm:text-xs">
                        Waktu
                      </div>
                      <div className="text-[#374151] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:font-semibold max-sm:text-xs max-sm:font-semibold break-words text-right max-md:text-left">
                        {formatDateTime(bookingData)}
                      </div>
                    </div>

                    {/* Counseling Type - UPDATED */}
                    <div className="self-stretch inline-flex justify-between items-start max-md:flex-col max-md:gap-1 max-sm:gap-0.5">
                      <div className="text-[#6B7280] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-sm:text-xs">
                        Jenis Konseling
                      </div>
                      <div className="text-[#374151] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:font-semibold max-sm:text-xs max-sm:font-semibold">
                        {getCounselingMethodDisplay(bookingData.method)}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="self-stretch inline-flex justify-between items-start max-md:flex-col max-md:gap-1 max-sm:gap-0.5">
                      <div className="text-[#6B7280] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-sm:text-xs">
                        Nama
                      </div>
                      <div className="text-[#374151] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:font-semibold max-sm:text-xs max-sm:font-semibold break-words">
                        {getUserName()}
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="self-stretch inline-flex justify-between items-start max-md:flex-col max-md:gap-1 max-sm:gap-0.5">
                      <div className="text-[#6B7280] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-sm:text-xs">
                        Nomor Telepon
                      </div>
                      <div className="text-[#374151] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:font-semibold max-sm:text-xs max-sm:font-semibold break-all">
                        {getUserPhone()}
                      </div>
                    </div>

                    {/* Psychologist - if available */}
                    {(bookingData.psychologistName || bookingData.psychologistId) && (
                      <div className="self-stretch inline-flex justify-between items-start max-md:flex-col max-md:gap-1 max-sm:gap-0.5">
                        <div className="text-[#6B7280] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-sm:text-xs">
                          Psikolog
                        </div>
                        <div className="text-[#374151] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:font-semibold max-sm:text-xs max-sm:font-semibold break-words">
                          {bookingData.psychologistName || `Psikolog ID: ${bookingData.psychologistId}`}
                        </div>
                      </div>
                    )}

                    {/* Location - if offline */}
                    {bookingData.method === "offline" && bookingData.location && (
                      <div className="self-stretch inline-flex justify-between items-start max-md:flex-col max-md:gap-1 max-sm:gap-0.5">
                        <div className="text-[#6B7280] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-sm:text-xs">
                          Lokasi
                        </div>
                        <div className="text-[#374151] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:font-semibold max-sm:text-xs max-sm:font-semibold break-words">
                          {bookingData.location.name}
                        </div>
                      </div>
                    )}

                    {/* Notes - if provided */}
                    {bookingData.notes && (
                      <div className="self-stretch inline-flex justify-between items-start max-md:flex-col max-md:gap-1 max-sm:gap-0.5">
                        <div className="text-[#6B7280] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-sm:text-xs">
                          Catatan
                        </div>
                        <div className="text-[#374151] text-sm font-normal font-['Public_Sans'] leading-snug max-md:text-sm max-md:font-semibold max-sm:text-xs max-sm:font-semibold break-words">
                          {bookingData.notes}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Home Button */}
      <button
        onClick={handleBackToHome}
        className="absolute left-1/2 top-[749px] transform -translate-x-1/2 text-[#488BBA] text-[10px] font-normal font-['Public_Sans'] leading-snug hover:underline transition-all duration-200 max-md:text-xs max-md:top-[700px] max-sm:text-[10px] max-sm:top-[680px]"
      >
        Kembali ke Beranda
      </button>
    </div>
  )
}

export default BookingSessionComplete