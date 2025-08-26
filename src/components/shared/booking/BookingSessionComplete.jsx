// src/components/shared/booking/BookingSessionComplete.jsx - CLEAN LAYOUT VERSION

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

  // Get counseling method display name
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
    <div className="min-h-screen w-full bg-white overflow-x-hidden">
      {/* Background Gradient */}
      <div className="w-full h-72 bg-gradient-to-b from-teal-200 to-indigo-500" />
      
      {/* Main Container */}
      <div className="relative -mt-40 flex justify-center px-4 pb-20">
        
        {/* Main Content Card */}
        <div className="w-full max-w-4xl bg-white rounded-[15px] shadow-[0px_12px_27px_0px_rgba(0,0,0,0.07)] relative">
          
          {/* Logo */}
          <div className="flex justify-center pt-6 pb-2">
            <div className="w-20 h-16 sm:w-24 sm:h-20">
              <img
                src="/logo/ruang-diri-logo-white.svg"
                alt="RuangDiri Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none"
                  e.target.parentNode.innerHTML =
                    '<div class="bg-gray-200 rounded-lg flex items-center justify-center w-full h-full"><span class="text-gray-600 font-bold text-sm">LOGO</span></div>'
                }}
              />
            </div>
          </div>

          {/* Content Container */}
          <div className="px-6 pb-8 sm:px-12 sm:pb-12 md:px-20">
            
            {/* Success Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-green-100 rounded-full flex items-center justify-center">
                <span className="material-icons text-[#9BCA61] text-4xl sm:text-6xl">
                  check_circle
                </span>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              
              {/* Header Section */}
              <div className="text-center space-y-4">
                <h1 className="text-[#488BBA] text-2xl sm:text-3xl lg:text-4xl font-extrabold font-['Public_Sans']">
                  Terima Kasih
                </h1>
                <p className="text-[#6B7280] text-sm sm:text-base font-normal font-['Public_Sans'] leading-relaxed max-w-2xl mx-auto">
                  Selamat, sesi konseling berhasil dibuat. Kamu sudah masuk daftar antrean konseling Ruang Diri.
                </p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-[#6B7280] opacity-25"></div>

              {/* Booking Details Card */}
              <div className="border border-dashed border-[#6B7280] rounded-[10px] p-4 sm:p-6">
                
                {/* Title */}
                <h2 className="text-[#488BBA] text-lg sm:text-xl font-bold font-['Public_Sans'] mb-4 sm:mb-6">
                  Rincian Pemesanan
                </h2>

                {/* Details */}
                <div className="space-y-3 sm:space-y-4">
                  
                  {/* Booking Number */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-[#6B7280] text-xs sm:text-sm font-normal font-['Public_Sans'] flex-shrink-0">
                      Nomor Pemesanan
                    </span>
                    <span className="text-[#374151] text-xs sm:text-sm font-semibold font-['Public_Sans'] word-break-all">
                      {getBookingNumber()}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-[#6B7280] text-xs sm:text-sm font-normal font-['Public_Sans'] flex-shrink-0">
                      Waktu
                    </span>
                    <span className="text-[#374151] text-xs sm:text-sm font-semibold font-['Public_Sans'] text-left sm:text-right">
                      {formatDateTime(bookingData)}
                    </span>
                  </div>

                  {/* Counseling Type */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-[#6B7280] text-xs sm:text-sm font-normal font-['Public_Sans'] flex-shrink-0">
                      Jenis Konseling
                    </span>
                    <span className="text-[#374151] text-xs sm:text-sm font-semibold font-['Public_Sans']">
                      {getCounselingMethodDisplay(bookingData.method)}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-[#6B7280] text-xs sm:text-sm font-normal font-['Public_Sans'] flex-shrink-0">
                      Nama
                    </span>
                    <span className="text-[#374151] text-xs sm:text-sm font-semibold font-['Public_Sans'] word-wrap">
                      {getUserName()}
                    </span>
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-[#6B7280] text-xs sm:text-sm font-normal font-['Public_Sans'] flex-shrink-0">
                      Nomor Telepon
                    </span>
                    <span className="text-[#374151] text-xs sm:text-sm font-semibold font-['Public_Sans'] word-break-all">
                      {getUserPhone()}
                    </span>
                  </div>

                  {/* Psychologist - if available */}
                  {(bookingData.psychologistName || bookingData.psychologistId) && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                      <span className="text-[#6B7280] text-xs sm:text-sm font-normal font-['Public_Sans'] flex-shrink-0">
                        Psikolog
                      </span>
                      <span className="text-[#374151] text-xs sm:text-sm font-semibold font-['Public_Sans'] word-wrap">
                        {bookingData.psychologistName || `Psikolog ID: ${bookingData.psychologistId}`}
                      </span>
                    </div>
                  )}

                  {/* Location - if offline */}
                  {bookingData.method === "offline" && bookingData.location && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                      <span className="text-[#6B7280] text-xs sm:text-sm font-normal font-['Public_Sans'] flex-shrink-0">
                        Lokasi
                      </span>
                      <span className="text-[#374151] text-xs sm:text-sm font-semibold font-['Public_Sans'] word-wrap">
                        {bookingData.location.name}
                      </span>
                    </div>
                  )}

                  {/* Notes - if provided */}
                  {bookingData.notes && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                      <span className="text-[#6B7280] text-xs sm:text-sm font-normal font-['Public_Sans'] flex-shrink-0">
                        Catatan
                      </span>
                      <span className="text-[#374151] text-xs sm:text-sm font-semibold font-['Public_Sans'] word-wrap">
                        {bookingData.notes}
                      </span>
                    </div>
                  )}

                  

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Home Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <button
          onClick={handleBackToHome}
          className="text-[#488BBA] text-xs sm:text-sm font-normal font-['Public_Sans'] hover:underline transition-all duration-200 px-4 py-2"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  )
}

export default BookingSessionComplete