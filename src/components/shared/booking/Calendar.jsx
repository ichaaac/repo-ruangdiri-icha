import { useState, useEffect, useRef } from "react"

const Calendar = ({ selectedDate, onDateSelect, availableDates = [], fullyBookedDates = [], isOpen, onClose, triggerRef }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [position, setPosition] = useState({ top: true, left: 0 })
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const calendarRef = useRef(null)

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const calendarHeight = 400
      const calendarWidth = 320

      const spaceBelow = viewportHeight - triggerRect.bottom
      const spaceAbove = triggerRect.top
      const showAbove = spaceBelow < calendarHeight && spaceAbove > calendarHeight

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

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const currentDate = new Date(dateStr)
      const isAvailable = availableDates.some((d) => d.value === dateStr)
      const isFullyBooked = fullyBookedDates.includes(dateStr)
      const isSelected = selectedDate === dateStr
      const isPast = currentDate < new Date().setHours(0, 0, 0, 0)
      const isToday = currentDate.toDateString() === new Date().toDateString()

      days.push({
        day,
        dateStr,
        isAvailable: isAvailable && !isPast,
        isFullyBooked,
        isSelected,
        isPast,
        isToday,
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
    const now = new Date()
    const isCurrentMonth = currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() === now.getMonth()
    if (isCurrentMonth) return
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

        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowMonthPicker(p => !p); }}
              className="text-sm font-semibold text-gray-800 hover:text-[#42C1E3] transition-colors flex items-center gap-1"
            >
              {monthNames[currentMonth.getMonth()]}
              <span className="material-icons text-xs">expand_more</span>
            </button>
            {showMonthPicker && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-[60] bg-white rounded-xl shadow-lg border border-gray-100 p-2 grid grid-cols-3 gap-1 w-[220px]">
                {monthNames.map((m, i) => {
                  const now = new Date()
                  const isPastMonth = currentMonth.getFullYear() === now.getFullYear() && i < now.getMonth()
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={isPastMonth}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isPastMonth) return
                        const d = new Date(currentMonth)
                        d.setMonth(i)
                        setCurrentMonth(d)
                        setShowMonthPicker(false)
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs text-center transition-colors ${
                        isPastMonth
                          ? 'text-gray-300 cursor-not-allowed'
                          : i === currentMonth.getMonth()
                            ? 'bg-[#42C1E3] text-white font-semibold'
                            : 'text-gray-700 hover:bg-[#E0F7FD]'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowYearPicker(p => !p); setShowMonthPicker(false); }}
              className="text-sm font-semibold text-gray-800 hover:text-[#42C1E3] transition-colors flex items-center gap-1"
            >
              {currentMonth.getFullYear()}
              <span className="material-icons text-xs">expand_more</span>
            </button>
            {showYearPicker && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-[60] bg-white rounded-xl shadow-lg border border-gray-100 p-2 flex flex-col gap-1 w-[90px]">
                {[0, 1, 2].map(offset => {
                  const y = new Date().getFullYear() + offset
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const d = new Date(currentMonth)
                        d.setFullYear(y)
                        setCurrentMonth(d)
                        setShowYearPicker(false)
                      }}
                      className={`px-2 py-1.5 rounded-lg text-sm text-center transition-colors ${
                        y === currentMonth.getFullYear()
                          ? 'bg-[#42C1E3] text-white font-semibold'
                          : 'text-gray-700 hover:bg-[#E0F7FD]'
                      }`}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

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

          const { day, dateStr, isAvailable, isFullyBooked, isSelected, isPast, isToday } = dayObj

          let dayClasses = "h-8 text-sm rounded-full flex items-center justify-center transition-all duration-200 "

          if (isSelected) {
            dayClasses += "bg-[#488BBA] text-white font-semibold shadow-md"
          } else if (isFullyBooked && !isPast) {
            dayClasses += "bg-red-50 text-red-400 cursor-not-allowed"
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

export default Calendar
