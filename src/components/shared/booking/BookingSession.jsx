// src/components/shared/booking/BookingSession.jsx - UPDATED WITH DISABLED TIME SLOTS
import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useBooking } from "./hooks/useBooking"
import { useAuth } from "@/hooks/useAuth"

// Back Arrow Component
const BackArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex p-[5px] items-center gap-2.5 rounded-[3px] bg-[#8CC3EE] w-[26px] h-[26px]"
    aria-label="Go back"
  >
    <span className="material-icons text-white text-base">arrow_back</span>
  </button>
)

// Calendar Component
const Calendar = ({ selectedDate, onDateSelect, availableDates = [], isOpen, onClose, triggerRef }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [position, setPosition] = useState({ top: true, left: 0 })
  const calendarRef = useRef(null)

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const calendarHeight = 400
      const calendarWidth = 320

      // Check if calendar fits below
      const spaceBelow = viewportHeight - triggerRect.bottom
      const spaceAbove = triggerRect.top
      const showAbove = spaceBelow < calendarHeight && spaceAbove > calendarHeight

      // Check horizontal position
      let leftOffset = 0
      if (triggerRect.left + calendarWidth > viewportWidth) {
        leftOffset = viewportWidth - triggerRect.left - calendarWidth - 20
      }

      setPosition({
        top: !showAbove,
        left: leftOffset,
      })
    }
  }, [isOpen, triggerRef])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const currentDate = new Date(dateStr)
      const isAvailable = availableDates.some((d) => d.value === dateStr)
      const isSelected = selectedDate === dateStr
      const isPast = currentDate < new Date().setHours(0, 0, 0, 0)
      const isToday = currentDate.toDateString() === new Date().toDateString()
      
      // Disable dates beyond 4 weeks (28 days) from today
      const today = new Date()
      const fourWeeksFromNow = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000))
      const isBeyondFourWeeks = currentDate > fourWeeksFromNow

      days.push({
        day,
        dateStr,
        isAvailable: isAvailable && !isPast && !isBeyondFourWeeks,
        isSelected,
        isPast,
        isToday,
        isBeyondFourWeeks,
      })
    }

    return days
  }

  const nextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }

  const prevMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }

  const days = getDaysInMonth(currentMonth)

  if (!isOpen) return null

  const positionClasses = position.top ? "top-full mt-1" : "bottom-full mb-1"

  return (
    <div
      ref={calendarRef}
      className={`fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] p-4 w-80 overflow-hidden ${positionClasses}`}
      style={{
        left: triggerRef?.current ? triggerRef.current.getBoundingClientRect().left + position.left : 0,
        [position.top ? "top" : "bottom"]: triggerRef?.current
          ? position.top
            ? triggerRef.current.getBoundingClientRect().bottom + 4
            : window.innerHeight - triggerRef.current.getBoundingClientRect().top + 4
          : 0,
      }}
    >
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            prevMonth()
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <span className="material-icons text-gray-600 text-lg">chevron_left</span>
        </button>

        <h3 className="text-sm font-semibold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            nextMonth()
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <span className="material-icons text-gray-600 text-lg">chevron_right</span>
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-xs text-gray-500 text-center py-2 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 h-48">
        {days.map((dayObj, index) => {
          if (!dayObj) {
            return <div key={`empty-${index}`} className="h-8"></div>
          }

          const { day, dateStr, isAvailable, isSelected, isPast, isToday } = dayObj

          let dayClasses = "h-8 text-sm rounded-full flex items-center justify-center transition-all duration-200 "

          if (isSelected) {
            dayClasses += "bg-[#488BBA] text-white font-semibold shadow-md"
          } else if (isToday) {
            dayClasses += "bg-blue-50 text-[#488BBA] font-semibold border border-[#488BBA]"
          } else if (isAvailable) {
            dayClasses += "hover:bg-blue-50 text-gray-800 cursor-pointer hover:text-[#488BBA]"
          } else if (isPast) {
            dayClasses += "text-gray-300 cursor-not-allowed"
          } else {
            dayClasses += "text-gray-300 cursor-not-allowed"
          }

          return (
            <button
              key={`day-${day}-${dateStr}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (isAvailable) {
                  onDateSelect(dateStr)
                  onClose()
                }
              }}
              disabled={!isAvailable}
              className={dayClasses}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}

// Main BookingSession Component
const BookingSession = ({ userType = "student", selectedMethod, onBack, onSuccess, standalone = false }) => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const {
    counselingMethods,
    locations,
    timeSlots,
    availableDates,
    selectedDate,
    selectedTimeSlot,
    selectedLocation,
    notes,
    loading,
    errors,
    handleMethodSelection,
    handleDateSelection,
    handleTimeSlotSelection,
    handleLocationSelection,
    handleBookingSubmit,
    setNotes,
    showConfirmModal,
    setShowConfirmModal,
    selectedMethod: currentSelectedMethod,
  } = useBooking(userType)

  const [showCalendar, setShowCalendar] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showMethodDropdown, setShowMethodDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  // Refs for positioning
  const datePickerRef = useRef(null)

  // Get selected method from props or location state
  const methodFromProps = selectedMethod
  const methodFromState = location.state?.selectedMethod
  const initialMethod = methodFromProps || methodFromState

  // Set selected method from props or location state when component mounts
  useEffect(() => {
    if (initialMethod && !loading.methods) {
      handleMethodSelection(initialMethod)
    }
  }, [initialMethod, handleMethodSelection, loading.methods])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest(".calendar-container")) {
        setShowCalendar(false)
      }
      if (showMethodDropdown && !event.target.closest(".method-dropdown")) {
        setShowMethodDropdown(false)
      }
      if (showLocationDropdown && !event.target.closest(".location-dropdown")) {
        setShowLocationDropdown(false)
      }
      if (showTimePicker && !event.target.closest(".time-dropdown")) {
        setShowTimePicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showCalendar, showMethodDropdown, showLocationDropdown, showTimePicker])

  const selectedDateObject = availableDates?.find((date) => date.value === selectedDate)

  // Check if form is valid for button enabling
  const isFormValid = () => {
    const hasRequiredFields = currentSelectedMethod && selectedDate && selectedTimeSlot
    // Only require location for offline method
    const hasLocationIfOffline = currentSelectedMethod?.id !== "offline" || selectedLocation
    // Check if selected time slot is available
    const isTimeSlotAvailable = selectedTimeSlot?.available === true
    return hasRequiredFields && hasLocationIfOffline && isTimeSlotAvailable
  }

  // Back button navigation - prioritize onBack callback
  const handleBackNavigation = () => {
    if (isFormValid()) {
      setShowConfirmModal(true)
    } else {
      if (onBack) {
        onBack()
      } else {
        navigate(-1)
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const result = await handleBookingSubmit()

      if (onSuccess && typeof onSuccess === "function") {
        onSuccess(result)
      } else {
        navigate(`/user/${userType}/booking-complete`, {
          state: { bookingResult: result },
          replace: true,
        })
      }
    } catch (error) {
      console.error("Booking submission error:", error)
    }
  }

  const getTermsContent = () => {
    const methodId = currentSelectedMethod?.id || "online"

    const termsMap = {
      online:
        "• Pengguna diharapkan hadir tepat waktu sesuai jadwal yang telah ditentukan. Link Zoom akan dikirimkan ke email dan WA kamu 1 jam sebelum sesi dan toleransi keterlambatan pada hari H adalah 15 menit.\n• Pengguna diharapkan berada dalam ruangan yang kondusif (di tempat yang tenang dan tidak dalam perjalanan).\n• Perubahan dan pembatalan jadwal dapat dilakukan maksimal H-1 dari jadwal yang telah ditentukan (dengan maksimal 1x perubahan).\n• Tautan untuk mengakses Zoom akan dikirim 1 jam sebelum sesi konseling.",
      offline:
        "• Pengguna diharapkan hadir tepat waktu sesuai jadwal yang telah ditentukan dengan toleransi keterlambatan 15 menit.\n• Pengguna diharapkan datang ke lokasi yang telah ditentukan sesuai dengan alamat yang diberikan.\n• Perubahan dan pembatalan jadwal dapat dilakukan maksimal H-1 dari jadwal yang telah ditentukan (dengan maksimal 1x perubahan).\n• Konfirmasi lokasi dan detail sesi akan dikirim 1 hari sebelum jadwal konseling.",
      chat: "• Sesi chat berlangsung selama 15 menit sesuai jadwal yang telah ditentukan.\n• Pengguna dapat mengakses ruang chat 5 menit sebelum jadwal dimulai.\n• Perubahan jadwal dapat dilakukan maksimal 2 jam sebelum sesi dimulai.\n• Link akses chat akan dikirimkan 15 menit sebelum sesi dimulai.",
    }

    return termsMap[methodId] || termsMap["online"]
  }

  const getTermsTitle = () => {
    const methodId = currentSelectedMethod?.id || "online"

    const titleMap = {
      online: "Syarat dan Ketentuan Sesi Konseling Daring Ruang Diri:",
      offline: "Syarat dan Ketentuan Sesi Konseling Luring Ruang Diri:",
      chat: "Syarat dan Ketentuan Sesi Konseling Chat Ruang Diri:",
    }

    return titleMap[methodId] || titleMap["online"]
  }

  // Get remaining quota from user data
  const remainingQuota = user?.organization?.remainingQuota || 0

  // Show loading state while methods are loading
  if (loading.methods) {
    return (
      <div className="w-full min-h-screen relative bg-white overflow-hidden flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-[#488BBA]">sync</span>
          <span className="text-[#488BBA]">Loading booking form...</span>
        </div>
      </div>
    )
  }

  // FIXED: Consistent field height (36px = h-9)
  const fieldHeight = "h-9"
  const fieldClasses = `${fieldHeight} px-2.5 py-3 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-gray-500 flex justify-between items-center relative cursor-pointer`

  return (
    <div className="w-full min-h-screen relative bg-white overflow-hidden">
      {/* Background Header */}
      <div className="w-full h-72 left-0 top-0 absolute bg-gradient-to-b from-teal-200 to-indigo-500" />

      {/* Main Content Card */}
      <div className="absolute left-[20px] right-[20px] top-[142px] bg-white rounded-tl-[10px] rounded-tr-[10px] shadow-[0px_12px_27px_0px_rgba(0,0,0,0.07)] shadow-[0px_49px_49px_0px_rgba(0,0,0,0.06)] shadow-[0px_111px_67px_0px_rgba(0,0,0,0.04)] shadow-[0px_198px_79px_0px_rgba(0,0,0,0.01)] shadow-[0px_309px_86px_0px_rgba(0,0,0,0.00)] min-h-[calc(100vh-162px)] max-md:left-[10px] max-md:right-[10px] max-md:top-[120px]" />

      {/* Logo */}
      <div className="w-24 left-1/2 top-[26px] absolute transform -translate-x-1/2 inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden max-md:w-20 max-md:top-[20px]">
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

      {/* Blue Line Separator */}
      <div className="absolute left-[59px] right-[59px] top-[288px] h-0 outline outline-[0.50px] outline-offset-[-0.25px] outline-[#488BBA] max-md:left-[30px] max-md:right-[30px] max-md:top-[250px]" />

      {/* Back Arrow */}
      <div className="absolute left-[59px] top-[196px] max-md:left-[30px] max-md:top-[170px]">
        <BackArrow onClick={handleBackNavigation} />
      </div>

      {/* Header - Aligned with back button */}
      <div className="absolute left-[104px] top-[191px] max-md:left-[70px] max-md:top-[165px]">
        <div className="text-[#488BBA] text-5xl font-extrabold font-['Public_Sans'] leading-[74px] max-md:text-3xl max-md:leading-[50px]">
          Booking Sesi Konseling
        </div>
      </div>

      {/* Form Section */}
      <div className="absolute left-[59px] right-[59px] top-[329px] flex flex-col gap-5 max-md:left-[30px] max-md:right-[30px] max-md:top-[290px]">
        
        {/* Method and Location Row */}
        <div className="flex gap-5 max-md:flex-col max-md:gap-4">
          
          {/* Method Selection */}
          <div className="w-1/2 max-md:w-full flex flex-col gap-3.5">
            <div className="text-neutral-600 text-sm font-bold font-['Public_Sans']">Jenis Konseling</div>
            <div className="method-dropdown relative">
              <div
                className={fieldClasses}
                onClick={() => setShowMethodDropdown(!showMethodDropdown)}
              >
                <div className="text-center justify-center text-neutral-600 text-sm font-semibold font-['Public_Sans']">
                  {currentSelectedMethod?.name || "Pilih Jenis Konseling"}
                </div>
                <span className="material-icons text-gray-600">expand_more</span>

                {/* Method Dropdown */}
                {showMethodDropdown && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                    {counselingMethods?.map((method) => (
                      <button
                        key={method.id}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMethodSelection(method)
                          setShowMethodDropdown(false)
                        }}
                      >
                        <div className="font-medium text-sm text-gray-900">{method.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Method Description */}
            <div className="text-neutral-600 text-sm font-normal font-['Public_Sans'] leading-tight">
              {currentSelectedMethod?.description || "Pilih jenis konseling terlebih dahulu"}
            </div>
          </div>

          {/* Location Selection for Offline */}
          {currentSelectedMethod?.id === "offline" && (
            <div className="w-1/2 max-md:w-full flex flex-col gap-3.5">
              <div className="text-neutral-600 text-sm font-bold font-['Public_Sans']">Lokasi Konseling</div>
              <div className="location-dropdown relative">
                <div
                  className={fieldClasses}
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                >
                  <div className="text-center justify-center text-neutral-600 text-sm font-semibold font-['Public_Sans']">
                    <span className="text-red-500 text-sm font-normal font-['Public_Sans']">*</span>
                    {selectedLocation?.name || "Pilih Lokasi Konseling"}
                  </div>
                  <span className="material-icons text-gray-600">expand_more</span>

                  {/* Location Dropdown */}
                  {showLocationDropdown && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-[9998] mt-1">
                      {loading.locations ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading locations...</div>
                      ) : locations?.length > 0 ? (
                        locations.map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLocationSelection(location)
                              setShowLocationDropdown(false)
                            }}
                          >
                            <div className="font-medium">{location.name}</div>
                            <div className="text-xs text-gray-500">{location.address}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">No locations available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date, Time, Subscription Section */}
        <div className="flex gap-11 max-md:flex-col max-md:gap-5">
          
          {/* Date and Time Column */}
          <div className="flex-1 flex flex-col gap-2.5">
            
            {/* Date Picker */}
            <div className="flex flex-col gap-3">
              <div className="text-neutral-600 text-sm font-bold font-['Public_Sans']">Tanggal</div>
              <div className="calendar-container relative">
                <div
                  ref={datePickerRef}
                  className={fieldClasses}
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <div className="text-center justify-center">
                    <span className="text-red-500 text-sm font-normal font-['Public_Sans']">*</span>
                    <span className="text-neutral-600 text-sm font-normal font-['Public_Sans']">
                      {selectedDateObject?.label || "Pilih Tanggal"}
                    </span>
                  </div>
                  <span className="material-icons text-gray-600">calendar_today</span>
                </div>

                {/* Calendar */}
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelection}
                  availableDates={availableDates || []}
                  isOpen={showCalendar}
                  onClose={() => setShowCalendar(false)}
                  triggerRef={datePickerRef}
                />
              </div>
            </div>

            {/* Time Picker - UPDATED WITH DISABLED SLOTS */}
            {selectedDate && (
              <div className="time-dropdown relative">
                <div
                  className={fieldClasses}
                  onClick={() => setShowTimePicker(!showTimePicker)}
                >
                  <div className="justify-center">
                    <span className="text-red-500 text-sm font-normal font-['Public_Sans']">*</span>
                    <span className="text-neutral-600 text-sm font-normal font-['Public_Sans']">
                      {selectedTimeSlot
                        ? `${selectedTimeSlot.startTime} - ${selectedTimeSlot.endTime} WIB`
                        : "Pilih Waktu"}
                    </span>
                  </div>
                  <span className="material-icons text-gray-600">expand_more</span>

                  {/* Time Dropdown - UPDATED WITH AVAILABILITY STATUS */}
                  {showTimePicker && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-[9999] mt-1">
                      {loading.availableDates ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading available times...</div>
                      ) : timeSlots?.length > 0 ? (
                        timeSlots.map((slot, index) => (
                          <button
                            key={slot.uniqueId || `${slot.psychologistName}-${slot.startTime}-${slot.endTime}-${index}`}
                            className={`w-full px-3 py-2 text-sm text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                              slot.available 
                                ? "hover:bg-gray-100 text-gray-900 cursor-pointer" 
                                : "text-gray-400 cursor-not-allowed bg-gray-50"
                            } ${
                              selectedTimeSlot?.uniqueId === slot.uniqueId 
                                ? "bg-blue-50 border-blue-200" 
                                : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (slot.available) {
                                handleTimeSlotSelection(slot)
                                setShowTimePicker(false)
                              }
                            }}
                            disabled={!slot.available}
                            title={slot.available ? "" : slot.reason || "Tidak tersedia"}
                          >
                            {/* Psychologist Name */}
                            {slot.psychologistName && (
                              <div className={`font-medium text-xs mb-1 ${
                                slot.available ? "text-blue-600" : "text-gray-400"
                              }`}>
                                {slot.psychologistName}
                              </div>
                            )}
                            
                            {/* Time Display */}
                            <div className="flex items-center justify-between">
                              <span>
                                {slot.displayTime || `${slot.startTime} - ${slot.endTime} WIB`}
                              </span>
                              
                              {/* Availability Indicator */}
                              {!slot.available && (
                                <span className="text-xs text-red-400 font-medium">
                                  Tidak Tersedia
                                </span>
                              )}
                            </div>
                            
                            {/* Debug info (show scheduled sessions count if debugging) */}
                            {process.env.NODE_ENV === 'development' && slot.hasScheduledSessions && (
                              <div className="text-xs text-gray-400 mt-1">
                                Sessions: {slot.scheduledSessionsCount}
                              </div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">No available times</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wajib diisi - Right aligned */}
            <div className="flex justify-end">
              <span className="text-red-500 text-[10px] font-normal font-['Public_Sans'] leading-snug">*</span>
              <span className="text-neutral-600 text-[10px] font-normal font-['Public_Sans'] leading-snug">
                Wajib diisi
              </span>
            </div>
          </div>

          {/* Subscription Type Column */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-neutral-600 text-sm font-bold font-['Public_Sans']">Tipe Langganan</div>
            <div className={`${fieldHeight} px-2.5 py-2 bg-zinc-100 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-gray-500 flex items-center`}>
              <div className="flex-1 h-5 rounded-[5px] flex flex-col justify-center items-start gap-2.5">
                <div className="flex-1 flex items-center gap-4">
                  <div className="text-gray-600 text-sm font-normal font-['Public_Sans']">Organisasi</div>
                </div>
              </div>
            </div>

            {/* Quota Info - Right aligned */}
            <div className="flex justify-end items-center gap-[5px]">
              <span className="material-icons text-[#EE4266] text-base">info</span>
              <div className="text-[#EE4266] text-xs font-normal font-['Public_Sans'] leading-4">
                Kuota tersisa untuk konseling : {remainingQuota}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Description */}
      <div className="absolute left-[59px] right-[59px] top-[590px] flex flex-col gap-2.5 max-md:left-[30px] max-md:right-[30px] max-md:top-[550px]">
        <div className="flex flex-col">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="text-neutral-600 text-sm font-bold font-['Public_Sans']">Jenis Permasalahan</div>
              <span className="text-gray-400 text-xs">(Opsional)</span>
            </div>
            <div className="h-20 px-2.5 py-3 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-neutral-600 flex items-start gap-2.5 relative">
              <textarea
                className="flex-1 h-full text-gray-600 text-xs font-normal font-['Public_Sans'] bg-transparent border-none outline-none resize-none"
                placeholder="Deskripsikan permasalahanmu secara singkat"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={255}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">{notes.length}/255</div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="text-[#EE4266] text-xs font-bold font-['Public_Sans'] max-md:text-[10px]">
            {getTermsTitle()}
          </div>
          <div className="text-gray-600 text-xs font-normal font-['Public_Sans'] whitespace-pre-line leading-relaxed max-md:text-[10px] max-md:leading-normal">
            {getTermsContent()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-[59px] bottom-[30px] flex justify-end items-center gap-2.5 max-md:left-[30px] max-md:right-[30px] max-md:bottom-[20px] max-md:justify-center">
        <button
          onClick={handleBackNavigation}
          className="h-8 px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#488BBA] flex justify-center items-center gap-2.5 hover:bg-blue-50 transition-colors max-md:flex-1"
        >
          <div className="text-[#488BBA] text-base font-semibold font-['Public_Sans'] max-md:text-sm">Batal</div>
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid() || loading.creating}
          className="h-8 px-5 py-2.5 bg-[#488BBA] rounded-[5px] flex justify-center items-center gap-2.5 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-md:flex-1"
        >
          <div className="text-white text-base font-semibold font-['Public_Sans'] max-md:text-sm">
            {loading.creating ? "Memproses..." : "Buat Janji"}
          </div>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Konfirmasi Pembatalan</h3>
            <p className="text-gray-600 mb-6">
              Anda memiliki data yang belum disimpan. Apakah Anda yakin ingin membatalkan?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Tetap di sini
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  if (onBack) {
                    onBack()
                  } else {
                    navigate(-1)
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading.creating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <span className="material-icons animate-spin text-[#488BBA]">sync</span>
            <span className="text-[#488BBA]">Membuat janji konseling...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingSession